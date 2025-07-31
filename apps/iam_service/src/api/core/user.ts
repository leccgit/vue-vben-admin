import type { RequestMeta, SuccessResponse, UserBasicInfo } from '#/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  /** 获取用户信息接口参数 */
  export interface GetUserInfoParams {
    meta: RequestMeta;
    data: {
      include_permissions?: boolean;
      include_sessions?: boolean;
      tenant_id: string;
      user_id: string;
    };
  }

  /** 获取用户信息接口返回值 */
  export type GetUserInfoResult = SuccessResponse<UserBasicInfo>;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi(params: UserApi.GetUserInfoParams) {
  return requestClient.post<UserApi.GetUserInfoResult>(
    '/v1/user/profile',
    params,
  );
}

/**
 * 统一获取用户信息接口 - 自动构建请求参数
 */
export async function unifiedGetUserInfoApi(params: {
  includePermissions?: boolean;
  includeSessions?: boolean;
  tenantId: string;
  userId: string;
}) {
  const {
    tenantId,
    userId,
    includePermissions = true,
    includeSessions = false,
  } = params;

  // 动态导入设备信息工具
  const { generateRequestMeta } = await import('#/utils/device');

  const getUserInfoParams: UserApi.GetUserInfoParams = {
    meta: generateRequestMeta(),
    data: {
      tenant_id: tenantId,
      user_id: userId,
      include_permissions: includePermissions,
      include_sessions: includeSessions,
    },
  };

  return await getUserInfoApi(getUserInfoParams);
}
