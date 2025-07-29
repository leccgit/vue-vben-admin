import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;
  /**
   * 账户状态
   */
  accountStatus?: 'active' | 'disabled' | 'locked';
  /**
   * 头像
   */
  avatar: string;
  /**
   * 用户邮箱
   */
  email?: string;
  /**
   * 最后登录时间
   */
  lastLoginTime?: string;
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
   * 用户手机号
   */
  phone?: string;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 用户角色
   */
  roles?: string[];
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}

interface TenantInfo {
  /**
   * 租户配置
   */
  config?: Record<string, any>;
  /**
   * 租户状态
   */
  status?: 'active' | 'inactive' | 'suspended';
  /**
   * 租户ID
   */
  tenant_id: string;
  /**
   * 租户名称
   */
  tenant_name: string;
}

interface AccessState {
  /**
   * 租户信息
   */
  tenantInfo: null | TenantInfo;
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;
  /**
   * 用户角色
   */
  userRoles: string[];
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      // 设置用户信息
      this.userInfo = userInfo;
      // 设置角色信息
      const roles = userInfo?.roles ?? [];
      this.setUserRoles(roles);
    },
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
    setTenantInfo(tenantInfo: null | TenantInfo) {
      this.tenantInfo = tenantInfo;
    },
    getTenantInfo() {
      return this.tenantInfo;
    },
    clearTenantInfo() {
      this.tenantInfo = null;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
    tenantInfo: null,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
