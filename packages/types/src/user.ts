import type { BasicUserInfo } from '@vben-core/typings';

/** 租户信息 */
interface TenantInfo {
  /**
   * 租户ID
   */
  tenant_id: string;
  /**
   * 租户名称
   */
  tenant_name: string;
  /**
   * 租户状态
   */
  status?: 'active' | 'inactive' | 'suspended';
  /**
   * 租户配置
   */
  config?: Record<string, any>;
}

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;

  /**
   * 租户信息
   */
  tenantInfo?: TenantInfo;

  /**
   * 多因素认证是否启用
   */
  mfaEnabled?: boolean;

  /**
   * 密码过期时间（秒）
   */
  passwordExpiresIn?: number;

  /**
   * 用户权限码列表
   */
  permissions?: string[];

  /**
   * 用户邮箱
   */
  email?: string;

  /**
   * 用户手机号
   */
  phone?: string;

  /**
   * 最后登录时间
   */
  lastLoginTime?: string;

  /**
   * 账户状态
   */
  accountStatus?: 'active' | 'locked' | 'disabled';
}

export type { TenantInfo, UserInfo };
