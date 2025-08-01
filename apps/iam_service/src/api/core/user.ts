import type { RequestMeta, SuccessResponse } from '#/types';

import { requestClient } from '#/api/request';

// 用户资料相关类型定义（匹配 OpenAPI 规范）
export interface UserProfile {
  avatar?: null | string;
  department?: null | string;
  position?: null | string;
  employee_id?: null | string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'auto' | 'dark' | 'light';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    login_notifications: boolean;
    suspicious_activity_alerts: boolean;
  };
}

export interface UserSecurityInfo {
  mfa_enabled: boolean;
  last_login_at?: null | string;
  last_password_change?: null | string;
  failed_login_attempts: number;
  account_locked: boolean;
  trusted_devices_count: number;
}

export interface UserProfileResponse {
  user_id: string;
  username: string;
  email: string;
  phone?: null | string;
  nickname?: null | string;
  profile?: null | UserProfile;
  preferences: UserPreferences;
  security_info: UserSecurityInfo;
}

export namespace UserApi {
  /** 获取用户信息接口参数 */
  export interface GetUserInfoParams {
    meta: RequestMeta;
    data: {
      tenant_id: string;
      user_id: string;
    };
  }

  /** 获取用户信息接口返回值 */
  export type GetUserInfoResult = SuccessResponse<UserProfileResponse>;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi(params: UserApi.GetUserInfoParams) {
  return requestClient.post<UserApi.GetUserInfoResult>(
    '/v1/users/profile',
    params,
  );
}

/**
 * 统一获取用户信息接口 - 自动构建请求参数
 */
export async function unifiedGetUserInfoApi(params: {
  tenantId: string;
  userId: string;
}) {
  const { tenantId, userId } = params;

  // 动态导入设备信息工具
  const { generateRequestMeta } = await import('#/utils/device');

  const getUserInfoParams: UserApi.GetUserInfoParams = {
    meta: generateRequestMeta(),
    data: {
      tenant_id: tenantId,
      user_id: userId,
    },
  };

  return await getUserInfoApi(getUserInfoParams);
}
