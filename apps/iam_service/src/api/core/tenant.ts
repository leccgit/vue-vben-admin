/**
 * 租户管理 API
 */

import { requestClient } from '#/api/request';
import { collectDeviceInfo } from '#/utils/device';

// 租户相关类型定义
export interface TenantBasicInfo {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  status: 'active' | 'deleted' | 'inactive' | 'pending' | 'suspended';
  description?: string;
  max_users: number;
  current_users: number;
  created_at: string;
  updated_at: string;
}

export interface TenantStatistics {
  user_count: number;
  active_user_count: number;
  role_count: number;
  permission_count: number;
  last_updated: string;
}

export interface TenantDetailInfo extends TenantBasicInfo {
  data: TenantDetailInfo;
  statistics: TenantStatistics;
}

export interface CreateTenantRequest {
  tenant_name: string;
  tenant_code: string;
  description?: string;
  max_users: number;
  create_admin_user?: boolean;
  admin_username?: string;
  admin_email?: string;
  admin_password?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantRequest {
  tenant_id: string;
  tenant_name?: string;
  description?: string;
  max_users?: number;
  settings?: Record<string, any>;
}

export interface ListTenantsRequest {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: string;
}

export interface ListTenantsResponse {
  items: TenantBasicInfo[];
  total: number;
  next_cursor?: string;
  has_more: boolean;
}

// API 响应的完整格式
export interface ListTenantsApiResponse {
  status: string;
  code: number;
  data: ListTenantsResponse;
  message: string;
  timestamp: string;
  request_id: string;
}

export interface ChangeTenantStatusRequest {
  tenant_id: string;
  new_status: 'active' | 'deleted' | 'inactive' | 'suspended';
  reason?: string;
}

export interface TenantSettings {
  password_policy?: Record<string, any>;
  session_config?: Record<string, any>;
  security_config?: Record<string, any>;
  feature_modules?: Record<string, any>;
  storage_config?: Record<string, any>;
  notification_config?: Record<string, any>;
}

export interface TenantSettingsResponse {
  tenant_id: string;
  settings: TenantSettings;
  last_updated: string;
  settings_version: string;
  is_default: boolean;
}

export interface UpdateTenantSettingsRequest {
  tenant_id: string;
  settings: TenantSettings;
  merge_mode?: 'merge' | 'patch' | 'replace';
}

export interface TenantQuotaInfo {
  quota_type: 'api_calls' | 'sessions' | 'storage' | 'users';
  limit: number;
  used: number;
  percentage: number;
  is_exceeded: boolean;
  warning_threshold: number;
}

export interface CheckTenantQuotasResponse {
  tenant_id: string;
  quotas: TenantQuotaInfo[];
  overall_status: 'exceeded' | 'normal' | 'warning';
  checked_at: string;
}

/**
 * 生成统一的请求数据
 */
async function generateRequestData<T>(data: T) {
  const deviceInfo = await collectDeviceInfo();
  return {
    meta: {
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      device_info: deviceInfo,
    },
    data,
  };
}

/**
 * 创建租户
 */
export async function createTenantApi(params: CreateTenantRequest) {
  const requestData = await generateRequestData(params);
  return requestClient.post<{ tenant: TenantDetailInfo }>(
    '/v1/tenants/create',
    requestData,
  );
}

/**
 * 查询租户列表
 */
export async function listTenantsApi(params: ListTenantsRequest = {}) {
  const requestData = await generateRequestData(params);
  return requestClient.post<ListTenantsApiResponse>(
    '/v1/tenants/list',
    requestData,
    { responseReturn: 'raw' },
  );
}

/**
 * 获取租户详情
 */
export async function getTenantDetailApi(tenantId: string) {
  const requestData = await generateRequestData({ tenant_id: tenantId });
  return requestClient.post<TenantDetailInfo>(
    '/v1/tenants/detail',
    requestData,
    { responseReturn: 'raw' },
  );
}

/**
 * 更新租户信息
 */
export async function updateTenantApi(params: UpdateTenantRequest) {
  const requestData = await generateRequestData(params);
  return requestClient.post<{ tenant: TenantDetailInfo }>(
    '/v1/tenants/update',
    requestData,
    { responseReturn: 'raw' },
  );
}

/**
 * 删除租户
 */
export async function deleteTenantApi(
  tenantId: string,
  hardDelete = false,
  forceDelete = false,
) {
  const requestData = await generateRequestData({
    tenant_id: tenantId,
    hard_delete: hardDelete,
    force_delete: forceDelete,
  });
  return requestClient.post<{ backup_info?: any; deleted_tenant_id: string }>(
    '/v1/tenants/delete',
    requestData,
    { responseReturn: 'raw' },
  );
}

/**
 * 变更租户状态
 */
export async function changeTenantStatusApi(params: ChangeTenantStatusRequest) {
  const requestData = await generateRequestData(params);
  return requestClient.post<{
    changed_at: string;
    new_status: string;
    old_status: string;
    reason: string;
    tenant_id: string;
  }>('/v1/tenants/status/change', requestData);
}

/**
 * 获取租户配置
 */
export async function getTenantSettingsApi(tenantId: string) {
  const requestData = await generateRequestData({ tenant_id: tenantId });
  return requestClient.post<TenantSettingsResponse>(
    '/v1/tenants/settings/get',
    requestData,
  );
}

/**
 * 更新租户配置
 */
export async function updateTenantSettingsApi(
  params: UpdateTenantSettingsRequest,
) {
  const requestData = await generateRequestData(params);
  return requestClient.post<{
    merge_mode: string;
    settings: TenantSettings;
    tenant_id: string;
    updated_at: string;
    updated_keys: string[];
  }>('/v1/tenants/settings/update', requestData);
}

/**
 * 检查租户配额
 */
export async function checkTenantQuotasApi(tenantId: string) {
  const requestData = await generateRequestData({ tenant_id: tenantId });
  return requestClient.post<CheckTenantQuotasResponse>(
    '/v1/tenants/quotas/check',
    requestData,
    {
      responseReturn: 'raw',
    },
  );
}

/**
 * 自动管理租户状态
 */
export async function autoManageTenantStatusApi(tenantId?: string) {
  const requestData = await generateRequestData({ tenant_id: tenantId });
  return requestClient.post<{
    errors: Array<{
      error: string;
      tenant_id: string;
    }>;
    processed_at: string;
    processed_tenants: number;
    quota_violations: Array<{
      limit: number;
      quota_type: string;
      tenant_id: string;
      used: number;
    }>;
    status_changes: Array<{
      new_status: string;
      old_status: string;
      reason: string;
      tenant_id: string;
    }>;
  }>('/v1/tenants/status/auto_manage', requestData);
}
