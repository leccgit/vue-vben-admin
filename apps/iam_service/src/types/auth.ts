/**
 * 认证相关的类型定义
 */

/** 登录类型枚举 */
export type LoginType = 'email' | 'phone' | 'username';

/** 设备信息接口 */
export interface DeviceInfo {
  device_id: string;
  device_name: string;
  os: string;
  app_version: string;
  ip_address: string;
  user_agent: string;
}

/** 请求元数据接口 */
export interface RequestMeta {
  request_id: string;
  timestamp: string;
  version: string;
}

/** 多租户登录请求数据接口 */
export interface LoginRequestData {
  login_type: LoginType;
  identifier: string;
  credential: string;
  remember_me?: boolean;
  mfa_code?: string;
  device_info: DeviceInfo;
}

/** 用户基本信息接口 */
export interface UserBasicInfo {
  user_id: string;
  username: string;
  nickname: string;
  email: string;
  phone?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  mfa_enabled: boolean;
  password_expires_in?: number;
}

/** 租户基本信息接口 */
export interface TenantBasicInfo {
  tenant_id: string;
  tenant_name: string;
}

/** 登录响应数据接口 */
export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  session_id: string;
  user_info: UserBasicInfo;
  tenant_info: TenantBasicInfo;
  security_warnings: string[];
}

/** 安全警告类型 */
export type SecurityWarningType = 
  | 'password_expiring'
  | 'new_device_login'
  | 'suspicious_location'
  | 'multiple_failed_attempts'
  | 'account_locked'
  | 'mfa_required';

/** 安全警告接口 */
export interface SecurityWarning {
  type: SecurityWarningType;
  message: string;
  level: 'info' | 'warning' | 'error';
  action_required?: boolean;
}
