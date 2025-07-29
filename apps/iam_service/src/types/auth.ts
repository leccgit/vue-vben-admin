/**
 * 认证相关的类型定义
 */

/** 登录类型枚举 */
export type LoginType = 'email' | 'phone' | 'username';

/** 用户状态枚举 */
export type UserStatus =
  | 'active'
  | 'deleted'
  | 'inactive'
  | 'locked'
  | 'pending';

/** 租户状态枚举 */
export type TenantStatus =
  | 'active'
  | 'deleted'
  | 'inactive'
  | 'pending'
  | 'suspended';

/** 设备信息接口 */
export interface DeviceInfo {
  device_id: string;
  device_name: string;
  os: string;
  app_version: string;
  ip_address: string;
  user_agent: string;
  // 扩展信息
  browser?: string;
  browser_version?: string;
  is_mobile?: boolean;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  fingerprint?: string;
  network_info?: Record<string, any>;
  is_trusted?: boolean;
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
  status: UserStatus;
  roles: string[];
  permissions: string[];
  mfa_enabled: boolean;
  password_expires_in?: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

/** 租户基本信息接口 */
export interface TenantBasicInfo {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  status: TenantStatus;
  max_users: number;
  current_users: number;
  created_at: string;
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
  security_warnings: SecurityWarning[];
}

/** 安全警告类型 */
export type SecurityWarningType =
  | 'account_locked'
  | 'mfa_required'
  | 'multiple_failed_attempts'
  | 'new_device_login'
  | 'password_expiring'
  | 'session_timeout_warning'
  | 'suspicious_location'
  | 'weak_password';

/** 安全警告接口 */
export interface SecurityWarning {
  type: SecurityWarningType;
  message: string;
  level: 'error' | 'info' | 'warning';
  action_required?: boolean;
  expires_at?: string;
}

/** 会话信息接口 */
export interface SessionInfo {
  session_id: string;
  user_id: string;
  device_info: DeviceInfo;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  is_current: boolean;
}

/** 密码策略接口 */
export interface PasswordPolicy {
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  forbidden_patterns: string[];
  history_check_count: number;
  expiry_days?: number;
}

/** 认证错误类型 */
export type AuthErrorType =
  | 'account_disabled'
  | 'account_locked'
  | 'device_not_trusted'
  | 'invalid_credentials'
  | 'invalid_token'
  | 'mfa_required'
  | 'password_expired'
  | 'rate_limit_exceeded'
  | 'session_expired'
  | 'tenant_inactive';

/** 认证错误接口 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
  retry_after?: number;
}

/** 登录历史接口 */
export interface LoginHistory {
  id: string;
  user_id: string;
  login_type: LoginType;
  device_info: DeviceInfo;
  ip_address: string;
  location?: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

/** 令牌信息接口 */
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  issued_at: string;
  scope?: string[];
}

/** 用户偏好设置接口 */
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
