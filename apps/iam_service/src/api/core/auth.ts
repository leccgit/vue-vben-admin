import { baseRequestClient, requestClient } from '#/api/request';
import type {
  // DeviceInfo,
  LoginRequestData,
  LoginResponseData,
  RequestMeta,
  // TenantBasicInfo,
  // UserBasicInfo
} from '#/types';

export namespace AuthApi {
  /** 登录接口参数 - 向后兼容的简单格式 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口参数 - 新的多租户格式 */
  export interface MultiTenantLoginParams {
    meta: RequestMeta;
    data: LoginRequestData;
  }

  /** 登录接口返回值 - 向后兼容的简单格式 */
  export interface LoginResult {
    accessToken: string;
  }

  /** 登录接口返回值 - 新的多租户格式 */
export interface MultiTenantLoginResult {
    status: string;
    code: number;
    data: LoginResponseData;
    message: string;
    timestamp: string;
    request_id: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录 - 向后兼容的简单接口
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 登录 - 新的多租户接口
 */
export async function multiTenantLoginApi(data: AuthApi.MultiTenantLoginParams) {
  return requestClient.post<AuthApi.MultiTenantLoginResult>('/auth/login', data);
}

/**
 * 统一登录接口 - 自动适配格式
*/
export async function unifiedLoginApi(params: {
  username: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
  useMultiTenant?: boolean;
}) {
const { username, password, rememberMe, mfaCode, useMultiTenant = false } = params;

  if (useMultiTenant) {
    // 动态导入设备信息工具
    const { collectDeviceInfo, generateRequestMeta, detectLoginType } = await import('#/utils/device');

    const multiTenantParams: AuthApi.MultiTenantLoginParams = {
      meta: generateRequestMeta(),
      data: {
        login_type: detectLoginType(username),
        identifier: username,
        credential: password,
        remember_me: rememberMe,
        mfa_code: mfaCode,
        device_info: await collectDeviceInfo()
      }
    };

    return multiTenantLoginApi(multiTenantParams);
  } else {
    // 使用传统登录接口
    return loginApi({ username, password });
  }
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
