import type {
  DeviceInfo,
  LoginRequestData,
  LoginResponseData,
  RequestMeta,
  SuccessResponse,
} from '#/types';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    meta: RequestMeta;
    data: LoginRequestData;
  }

  /** 登录接口返回值 */
  export type LoginResult = SuccessResponse<LoginResponseData>;

  /** 登出接口参数 */
  export interface LogoutParams {
    meta: RequestMeta;
    data: {
      logout_type: 'all' | 'current';
      session_id?: string;
    };
  }

  /** 登出接口返回值 */
  export type LogoutResult = SuccessResponse<{
    logout_time: string;
    remaining_sessions: number;
    terminated_sessions: number;
  }>;

  /** 刷新令牌接口参数 */
  export interface RefreshTokenParams {
    meta: RequestMeta;
    data: {
      device_info: DeviceInfo;
      refresh_token: string;
    };
  }

  /** 刷新令牌接口返回值 */
  export type RefreshTokenResult = SuccessResponse<{
    access_token: string;
    expires_in: number;
    issued_at: string;
    refresh_expires_in: number;
    refresh_token: string;
    token_type: string;
  }>;

  /** 修改密码接口参数 */
  export interface ChangePasswordParams {
    meta: RequestMeta;
    data: {
      logout_other_sessions?: boolean;
      new_password: string;
      old_password: string;
    };
  }

  /** 修改密码接口返回值 */
  export type ChangePasswordResult = SuccessResponse<{
    changed_at: string;
    password_expires_at?: string;
    terminated_sessions: number;
  }>;

  /** 忘记密码接口参数 */
  export interface ForgotPasswordParams {
    meta: RequestMeta;
    data: {
      identifier: string;
      identifier_type: 'email' | 'phone';
      tenant_code: string;
    };
  }

  /** 忘记密码接口返回值 */
  export type ForgotPasswordResult = SuccessResponse<{
    expires_at: string;
    reset_token_id: string;
    sent_to: string; // 脱敏显示
  }>;

  /** 重置密码接口参数 */
  export interface ResetPasswordParams {
    meta: RequestMeta;
    data: {
      new_password: string;
      reset_token: string;
    };
  }

  /** 重置密码接口返回值 */
  export type ResetPasswordResult = SuccessResponse<{
    all_sessions_terminated: boolean;
    reset_at: string;
  }>;
}

/**
 * 用户登录
 */
export async function loginApi(params: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/v1/auth/login', params, {
    responseReturn: 'body',
  });
}

/**
 * 统一登录接口 - 自动构建请求参数
 */
export async function unifiedLoginApi(params: {
  identifier: string;
  mfaCode?: string;
  password: string;
  rememberMe?: boolean;
}) {
  const { identifier, password, rememberMe, mfaCode } = params;

  // 动态导入设备信息工具
  const { collectDeviceInfo, generateRequestMeta, detectLoginType } =
    await import('#/utils/device');

  const loginParams: AuthApi.LoginParams = {
    meta: generateRequestMeta(),
    data: {
      login_type: detectLoginType(identifier),
      identifier,
      credential: password,
      remember_me: rememberMe,
      mfa_code: mfaCode,
      device_info: await collectDeviceInfo(),
    },
  };
  return await loginApi(loginParams);
}

/**
 * 用户登出
 */
export async function logoutApi(params: AuthApi.LogoutParams) {
  return requestClient.post<AuthApi.LogoutResult>('/v1/auth/logout', params);
}

/**
 * 统一登出接口
 */
export async function unifiedLogoutApi(
  logoutType: 'all' | 'current' = 'current',
) {
  const { generateRequestMeta } = await import('#/utils/device');

  const logoutParams: AuthApi.LogoutParams = {
    meta: generateRequestMeta(),
    data: {
      logout_type: logoutType,
    },
  };

  return logoutApi(logoutParams);
}

/**
 * 刷新访问令牌
 */
export async function refreshTokenApi(params: AuthApi.RefreshTokenParams) {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/v1/auth/refresh',
    params,
  );
}

/**
 * 统一刷新令牌接口
 */
export async function unifiedRefreshTokenApi(refreshToken: string) {
  const { collectDeviceInfo, generateRequestMeta } = await import(
    '#/utils/device'
  );

  const refreshParams: AuthApi.RefreshTokenParams = {
    meta: generateRequestMeta(),
    data: {
      refresh_token: refreshToken,
      device_info: await collectDeviceInfo(),
    },
  };

  return refreshTokenApi(refreshParams);
}

/**
 * 修改密码
 */
export async function changePasswordApi(params: AuthApi.ChangePasswordParams) {
  return requestClient.post<AuthApi.ChangePasswordResult>(
    '/v1/auth/change_password',
    params,
  );
}

/**
 * 统一修改密码接口
 */
export async function unifiedChangePasswordApi(params: {
  logoutOtherSessions?: boolean;
  newPassword: string;
  oldPassword: string;
}) {
  const { oldPassword, newPassword, logoutOtherSessions } = params;
  const { generateRequestMeta } = await import('#/utils/device');

  const changePasswordParams: AuthApi.ChangePasswordParams = {
    meta: generateRequestMeta(),
    data: {
      old_password: oldPassword,
      new_password: newPassword,
      logout_other_sessions: logoutOtherSessions,
    },
  };

  return changePasswordApi(changePasswordParams);
}

/**
 * 忘记密码
 */
export async function forgotPasswordApi(params: AuthApi.ForgotPasswordParams) {
  return requestClient.post<AuthApi.ForgotPasswordResult>(
    '/v1/auth/forgot_password',
    params,
  );
}

/**
 * 统一忘记密码接口
 */
export async function unifiedForgotPasswordApi(params: {
  identifier: string;
  identifierType: 'email' | 'phone';
  tenantCode: string;
}) {
  const { tenantCode, identifier, identifierType } = params;
  const { generateRequestMeta } = await import('#/utils/device');

  const forgotPasswordParams: AuthApi.ForgotPasswordParams = {
    meta: generateRequestMeta(),
    data: {
      tenant_code: tenantCode,
      identifier,
      identifier_type: identifierType,
    },
  };

  return forgotPasswordApi(forgotPasswordParams);
}

/**
 * 重置密码
 */
export async function resetPasswordApi(params: AuthApi.ResetPasswordParams) {
  return requestClient.post<AuthApi.ResetPasswordResult>(
    '/v1/auth/reset_password',
    params,
  );
}

/**
 * 统一重置密码接口
 */
export async function unifiedResetPasswordApi(params: {
  newPassword: string;
  resetToken: string;
}) {
  const { resetToken, newPassword } = params;
  const { generateRequestMeta } = await import('#/utils/device');

  const resetPasswordParams: AuthApi.ResetPasswordParams = {
    meta: generateRequestMeta(),
    data: {
      reset_token: resetToken,
      new_password: newPassword,
    },
  };

  return resetPasswordApi(resetPasswordParams);
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/v1/auth/codes');
}
