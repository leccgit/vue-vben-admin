import type {
  SecurityWarning,
  SessionInfo,
  TenantBasicInfo,
  TokenInfo,
  UserBasicInfo,
  UserPreferences,
} from '#/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  unifiedChangePasswordApi,
  unifiedForgotPasswordApi,
  unifiedLoginApi,
  unifiedLogoutApi,
  unifiedRefreshTokenApi,
  unifiedResetPasswordApi,
} from '#/api';
import { $t } from '#/locales';
import {
  checkPasswordStrength,
  checkRateLimit,
  detectSuspiciousActivity,
  recordFailureAttempt,
  recordSuccessAttempt,
  sanitizeInput,
} from '#/utils/security';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const router = useRouter();

  // 基础状态
  const loginLoading = ref(false);
  const logoutLoading = ref(false);
  const passwordChangeLoading = ref(false);
  const passwordResetLoading = ref(false);

  // 认证信息状态
  const userInfo = ref<null | UserBasicInfo>(null);
  const tenantInfo = ref<null | TenantBasicInfo>(null);
  const tokenInfo = ref<null | TokenInfo>(null);
  const sessionInfo = ref<null | SessionInfo>(null);
  const securityWarnings = ref<SecurityWarning[]>([]);
  const userPreferences = ref<null | UserPreferences>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!tokenInfo.value?.access_token);
  const isTokenExpired = computed(() => {
    if (!tokenInfo.value) return true;
    const now = Date.now();
    const expiresAt =
      new Date(tokenInfo.value.issued_at).getTime() +
      tokenInfo.value.expires_in * 1000;
    return now >= expiresAt;
  });
  const needsPasswordChange = computed(() => {
    return (
      userInfo.value?.password_expires_in !== undefined &&
      userInfo.value.password_expires_in <= 0
    );
  });

  /**
   * 处理安全警告
   */
  function handleSecurityWarnings(warnings: SecurityWarning[]) {
    securityWarnings.value = warnings;

    warnings.forEach((warning) => {
      if (warning.action_required) {
        ElNotification({
          title: $t('security.warning'),
          message: warning.message,
          type: warning.level === 'error' ? 'error' : 'warning',
          duration: 0, // 不自动关闭
        });
      }
    });
  }

  /**
   * 用户登录
   */
  async function authLogin(
    params: {
      identifier: string;
      mfaCode?: string;
      password: string;
      rememberMe?: boolean;
    },
    onSuccess?: () => Promise<void> | void,
  ) {
    const cleanIdentifier = sanitizeInput(params.identifier);

    try {
      loginLoading.value = true;

      // 检查频率限制
      checkRateLimit('login', cleanIdentifier);

      const response = await unifiedLoginApi({
        ...params,
        identifier: cleanIdentifier,
      });

      if (response.code === 200 && response.data) {
        const {
          access_token,
          refresh_token,
          token_type,
          expires_in,
          refresh_expires_in,
          session_id,
          user_info,
          tenant_info,
          security_warnings = [], // 默认为空数组
        } = response.data;

        // 存储令牌信息
        tokenInfo.value = {
          access_token,
          refresh_token,
          token_type,
          expires_in,
          refresh_expires_in,
          issued_at: new Date().toISOString(),
        };

        // 存储用户和租户信息
        userInfo.value = user_info;
        tenantInfo.value = tenant_info;

        // 收集设备信息
        let deviceInfo;
        try {
          deviceInfo = await import('#/utils/device').then((m) =>
            m.collectDeviceInfo(),
          );
        } catch (error) {
          console.warn('Failed to collect device info:', error);
          // 使用基本的设备信息作为后备
          deviceInfo = {
            device_id: 'unknown',
            device_name: 'Unknown Device',
            os: 'Unknown',
            app_version: '1.0.0',
            ip_address: 'unknown',
            user_agent: navigator.userAgent,
            browser: 'Unknown',
            browser_version: 'Unknown',
            is_mobile: false,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            fingerprint: 'unknown',
            network_info: { connection_type: 'unknown', downlink: 0, rtt: 0 },
            is_trusted: false,
          };
        }

        sessionInfo.value = {
          session_id,
          user_id: user_info.user_id,
          device_info: deviceInfo,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          is_current: true,
        };

        // 设置访问令牌到 accessStore
        accessStore.setAccessToken(access_token);

        // 获取权限码
        try {
          const accessCodes = await getAccessCodesApi();
          accessStore.setAccessCodes(accessCodes);
        } catch (error) {
          console.warn('Failed to fetch access codes:', error);
          accessStore.setAccessCodes([]);
        }

        // 检测可疑活动
        const suspiciousWarnings = detectSuspiciousActivity({
          userAgent: navigator.userAgent,
          ipAddress: sessionInfo.value?.device_info.ip_address || '',
          loginTime: new Date().toISOString(),
          previousLoginTime: user_info.last_login_at,
        });

        // 合并所有安全警告
        const allWarnings = [...security_warnings];

        if (suspiciousWarnings.length > 0) {
          const additionalWarnings = suspiciousWarnings.map((warning) => ({
            type: 'suspicious_location' as const,
            message: warning,
            level: 'warning' as const,
            action_required: false,
          }));
          allWarnings.push(...additionalWarnings);
        }

        // 处理安全警告
        if (allWarnings.length > 0) {
          handleSecurityWarnings(allWarnings);
        }

        // 记录成功登录
        recordSuccessAttempt('login', cleanIdentifier);

        // 重置登录过期状态
        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        }

        // 导航到目标页面
        try {
          await (onSuccess
            ? onSuccess()
            : router.push(preferences.app.defaultHomePath));
        } catch (navigationError) {
          // 导航错误不应该影响登录成功状态
          console.error(
            'Navigation error after successful login:',
            navigationError,
          );
        }

        // 显示登录成功通知
        ElNotification({
          message: `${$t('authentication.loginSuccessDesc')}: ${user_info.nickname || user_info.username}`,
          title: $t('authentication.loginSuccess'),
          type: 'success',
        });

        return { userInfo: user_info, tenantInfo: tenant_info };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // 记录失败尝试
      recordFailureAttempt('login', cleanIdentifier);

      ElNotification({
        message: error.message || $t('authentication.loginFailed'),
        title: $t('authentication.loginError'),
        type: 'error',
      });

      throw error;
    } finally {
      loginLoading.value = false;
    }
  }

  /**
   * 用户登出
   */
  async function logout(
    logoutType: 'all' | 'current' = 'current',
    redirect: boolean = true,
  ) {
    try {
      logoutLoading.value = true;

      await unifiedLogoutApi(logoutType);

      ElNotification({
        message: $t('authentication.logoutSuccess'),
        title: $t('authentication.logout'),
        type: 'success',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // 即使登出失败也要清理本地状态
    } finally {
      logoutLoading.value = false;
    }

    // 清理所有状态
    clearAuthState();
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 导航到登录页
    if (redirect) {
      await router.replace({
        path: LOGIN_PATH,
        query: {
          redirect: encodeURIComponent(router.currentRoute.value.fullPath),
        },
      });
    }
  }

  /**
   * 刷新访问令牌
   */
  async function refreshToken() {
    if (!tokenInfo.value?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await unifiedRefreshTokenApi(
        tokenInfo.value.refresh_token,
      );

      if (response.code === 200 && response.data) {
        const {
          access_token,
          refresh_token,
          token_type,
          expires_in,
          refresh_expires_in,
          issued_at,
        } = response.data;

        tokenInfo.value = {
          access_token,
          refresh_token,
          token_type,
          expires_in,
          refresh_expires_in,
          issued_at,
        };

        accessStore.setAccessToken(access_token);

        return tokenInfo.value;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // 刷新失败，强制登出
      await logout(false);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(params: {
    logoutOtherSessions?: boolean;
    newPassword: string;
    oldPassword: string;
  }) {
    const userId = userInfo.value?.user_id || 'unknown';

    try {
      passwordChangeLoading.value = true;

      // 检查频率限制
      checkRateLimit('changePassword', userId);

      // 检查密码强度
      const passwordCheck = checkPasswordStrength(params.newPassword);
      if (!passwordCheck.isStrong) {
        throw new Error(
          `Password is not strong enough: ${passwordCheck.feedback.join(', ')}`,
        );
      }

      const response = await unifiedChangePasswordApi(params);

      if (response.code === 200) {
        // 记录成功尝试
        recordSuccessAttempt('changePassword', userId);

        ElNotification({
          message: $t('authentication.passwordChangeSuccess'),
          title: $t('authentication.passwordChange'),
          type: 'success',
        });

        // 如果选择登出其他会话，显示相关信息
        if (
          params.logoutOtherSessions &&
          response.data.terminated_sessions > 0
        ) {
          ElNotification({
            message: $t('authentication.otherSessionsTerminated', {
              count: response.data.terminated_sessions,
            }),
            type: 'info',
          });
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      console.error('Password change error:', error);

      // 记录失败尝试
      recordFailureAttempt('changePassword', userId);

      ElNotification({
        message: error.message || $t('authentication.passwordChangeFailed'),
        title: $t('authentication.passwordChangeError'),
        type: 'error',
      });

      throw error;
    } finally {
      passwordChangeLoading.value = false;
    }
  }

  /**
   * 忘记密码
   */
  async function forgotPassword(params: {
    identifier: string;
    identifierType: 'email' | 'phone';
    tenantCode: string;
  }) {
    const cleanIdentifier = sanitizeInput(params.identifier);

    try {
      passwordResetLoading.value = true;

      // 检查频率限制
      checkRateLimit('forgotPassword', cleanIdentifier);

      const response = await unifiedForgotPasswordApi({
        ...params,
        identifier: cleanIdentifier,
      });

      if (response.code === 200) {
        // 记录成功尝试
        recordSuccessAttempt('forgotPassword', cleanIdentifier);

        ElNotification({
          message: $t('authentication.resetLinkSent', {
            target: response.data.sent_to,
          }),
          title: $t('authentication.forgotPassword'),
          type: 'success',
        });

        return response.data;
      } else {
        throw new Error(response.message || 'Forgot password failed');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);

      // 记录失败尝试
      recordFailureAttempt('forgotPassword', cleanIdentifier);

      ElNotification({
        message: error.message || $t('authentication.forgotPasswordFailed'),
        title: $t('authentication.forgotPasswordError'),
        type: 'error',
      });

      throw error;
    } finally {
      passwordResetLoading.value = false;
    }
  }

  /**
   * 重置密码
   */
  async function resetPassword(params: {
    newPassword: string;
    resetToken: string;
  }) {
    try {
      passwordResetLoading.value = true;

      const response = await unifiedResetPasswordApi(params);

      if (response.code === 200) {
        ElNotification({
          message: $t('authentication.passwordResetSuccess'),
          title: $t('authentication.resetPassword'),
          type: 'success',
        });

        // 密码重置成功后，清理本地状态并导航到登录页
        clearAuthState();
        await router.replace({ path: LOGIN_PATH });

        return response.data;
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);

      ElNotification({
        message: error.message || $t('authentication.passwordResetFailed'),
        title: $t('authentication.passwordResetError'),
        type: 'error',
      });

      throw error;
    } finally {
      passwordResetLoading.value = false;
    }
  }

  /**
   * 清理认证状态
   */
  function clearAuthState() {
    userInfo.value = null;
    tenantInfo.value = null;
    tokenInfo.value = null;
    sessionInfo.value = null;
    securityWarnings.value = [];
    userPreferences.value = null;
  }

  /**
   * 检查认证状态
   */
  function checkAuthStatus() {
    if (!isAuthenticated.value) {
      return false;
    }

    if (isTokenExpired.value) {
      // 尝试刷新令牌
      refreshToken().catch(() => {
        // 刷新失败，清理状态
        clearAuthState();
      });
      return false;
    }

    return true;
  }

  function $reset() {
    loginLoading.value = false;
    logoutLoading.value = false;
    passwordChangeLoading.value = false;
    passwordResetLoading.value = false;
    clearAuthState();
  }

  return {
    // 状态
    loginLoading,
    logoutLoading,
    passwordChangeLoading,
    passwordResetLoading,
    userInfo,
    tenantInfo,
    tokenInfo,
    sessionInfo,
    securityWarnings,
    userPreferences,

    // 计算属性
    isAuthenticated,
    isTokenExpired,
    needsPasswordChange,

    // 方法
    authLogin,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    clearAuthState,
    checkAuthStatus,
    handleSecurityWarnings,
    $reset,
  };
});
