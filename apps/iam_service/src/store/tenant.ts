/**
 * 租户管理状态管理
 */

import type {
  ChangeTenantStatusRequest,
  CheckTenantQuotasResponse,
  CreateTenantRequest,
  ListTenantsRequest,
  TenantBasicInfo,
  TenantDetailInfo,
  TenantSettingsResponse,
  UpdateTenantRequest,
  UpdateTenantSettingsRequest,
} from '#/api/core/tenant';

import { computed, ref } from 'vue';

import { ElMessage, ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import {
  changeTenantStatusApi,
  checkTenantQuotasApi,
  createTenantApi,
  deleteTenantApi,
  getTenantDetailApi,
  getTenantSettingsApi,
  listTenantsApi,
  updateTenantApi,
  updateTenantSettingsApi,
} from '#/api/core/tenant';
import { $t } from '#/locales';

export const useTenantStore = defineStore('tenant', () => {
  // 状态定义
  const tenantList = ref<TenantBasicInfo[]>([]);
  const currentTenant = ref<null | TenantDetailInfo>(null);
  const tenantSettings = ref<null | TenantSettingsResponse>(null);
  const tenantQuotas = ref<CheckTenantQuotasResponse | null>(null);
  const listLoading = ref(false);
  const detailLoading = ref(false);
  const settingsLoading = ref(false);
  const quotasLoading = ref(false);
  const operationLoading = ref(false);

  // 分页信息
  const pagination = ref({
    total: 0,
    current: 1,
    pageSize: 20,
    nextCursor: undefined as string | undefined,
    hasMore: false,
  });

  // 搜索和筛选条件
  const searchParams = ref({
    search: '',
    status: '',
  });

  // 计算属性
  const activeTenants = computed(() =>
    tenantList.value.filter((tenant) => tenant.status === 'active'),
  );

  const suspendedTenants = computed(() =>
    tenantList.value.filter((tenant) => tenant.status === 'suspended'),
  );

  const totalTenants = computed(() => tenantList.value.length);

  /**
   * 获取租户列表
   */
  async function fetchTenantList(params: ListTenantsRequest = {}) {
    try {
      listLoading.value = true;

      const requestParams = {
        limit: params.limit || pagination.value.pageSize,
        cursor: params.cursor,
        search: params.search || searchParams.value.search,
        status: params.status || searchParams.value.status,
      };

      const response = await listTenantsApi(requestParams);

      // 由于 listTenantsApi 使用 responseReturn: 'raw'，需要从 data 中获取数据
      if (response && response.data) {
        const { items, total } = response.data;

        // 如果是第一页或者没有cursor，则替换列表；否则追加
        if (params.cursor) {
          tenantList.value.push(...items);
        } else {
          tenantList.value = items;
        }

        pagination.value = {
          ...pagination.value,
          total,
          nextCursor: response.data.next_cursor,
          hasMore: response.data.has_more || false,
        };

        return response.data;
      } else {
        throw new Error('Failed to fetch tenant list');
      }
    } catch (error: any) {
      console.error('Fetch tenant list error:', error);
      ElMessage.error(error.message || $t('tenant.fetchListFailed'));
      throw error;
    } finally {
      listLoading.value = false;
    }
  }

  /**
   * 获取租户详情
   */
  async function fetchTenantDetail(tenantId: string) {
    try {
      detailLoading.value = true;

      const response = await getTenantDetailApi(tenantId);

      if (response && response.data) {
        currentTenant.value = response.data;
        return response.data;
      } else {
        throw new Error('Failed to fetch tenant detail');
      }
    } catch (error: any) {
      console.error('Fetch tenant detail error:', error);
      ElMessage.error(error.message || $t('tenant.fetchDetailFailed'));
      throw error;
    } finally {
      detailLoading.value = false;
    }
  }

  /**
   * 创建租户
   */
  async function createTenant(params: CreateTenantRequest) {
    try {
      operationLoading.value = true;

      const response = await createTenantApi(params);

      if (response && response.tenant) {
        const newTenant = response.tenant;

        // 添加到列表开头
        tenantList.value.unshift(newTenant);
        pagination.value.total += 1;

        ElNotification({
          title: $t('tenant.createSuccess'),
          message: $t('tenant.createSuccessDesc', {
            name: newTenant.tenant_name,
          }),
          type: 'success',
        });

        return newTenant;
      } else {
        throw new Error('Failed to create tenant');
      }
    } catch (error: any) {
      console.error('Create tenant error:', error);
      ElMessage.error(error.message || $t('tenant.createFailed'));
      throw error;
    } finally {
      operationLoading.value = false;
    }
  }

  /**
   * 更新租户
   */
  async function updateTenant(params: UpdateTenantRequest) {
    try {
      operationLoading.value = true;

      const response = await updateTenantApi(params);

      if (response && response.tenant) {
        const updatedTenant = response.tenant;

        // 更新列表中的租户信息
        const index = tenantList.value.findIndex(
          (t) => t.tenant_id === updatedTenant.tenant_id,
        );
        if (index !== -1) {
          tenantList.value[index] = updatedTenant;
        }

        // 更新当前租户信息
        if (currentTenant.value?.tenant_id === updatedTenant.tenant_id) {
          currentTenant.value = updatedTenant;
        }

        ElNotification({
          title: $t('tenant.updateSuccess'),
          message: $t('tenant.updateSuccessDesc', {
            name: updatedTenant.tenant_name,
          }),
          type: 'success',
        });

        return updatedTenant;
      } else {
        throw new Error('Failed to update tenant');
      }
    } catch (error: any) {
      console.error('Update tenant error:', error);
      ElMessage.error(error.message || $t('tenant.updateFailed'));
      throw error;
    } finally {
      operationLoading.value = false;
    }
  }

  /**
   * 删除租户
   */
  async function deleteTenant(
    tenantId: string,
    hardDelete = false,
    forceDelete = false,
  ) {
    try {
      operationLoading.value = true;

      const response = await deleteTenantApi(tenantId, hardDelete, forceDelete);

      if (response) {
        // 从列表中移除
        const index = tenantList.value.findIndex(
          (t) => t.tenant_id === tenantId,
        );
        let deletedTenantName = 'Unknown';
        if (index !== -1) {
          const deletedTenant = tenantList.value[index];
          if (deletedTenant) {
            deletedTenantName = deletedTenant.tenant_name;
          }
          tenantList.value.splice(index, 1);
          pagination.value.total -= 1;
        }

        ElNotification({
          title: $t('tenant.deleteSuccess'),
          message: $t('tenant.deleteSuccessDesc', {
            name: deletedTenantName,
          }),
          type: 'success',
        });

        // 清除当前租户信息
        if (currentTenant.value?.tenant_id === tenantId) {
          currentTenant.value = null;
        }

        return response;
      } else {
        throw new Error('Failed to delete tenant');
      }
    } catch (error: any) {
      console.error('Delete tenant error:', error);
      ElMessage.error(error.message || $t('tenant.deleteFailed'));
      throw error;
    } finally {
      operationLoading.value = false;
    }
  }

  /**
   * 变更租户状态
   */
  async function changeTenantStatus(params: ChangeTenantStatusRequest) {
    try {
      operationLoading.value = true;

      const response = await changeTenantStatusApi(params);

      if (response) {
        const { tenant_id, new_status } = response;

        // 更新列表中的租户状态
        const tenant = tenantList.value.find((t) => t.tenant_id === tenant_id);
        if (tenant) {
          tenant.status = new_status as any;
        }

        // 更新当前租户状态
        if (currentTenant.value?.tenant_id === tenant_id) {
          currentTenant.value.status = new_status as any;
        }

        ElNotification({
          title: $t('tenant.statusChangeSuccess'),
          message: $t('tenant.statusChangeSuccessDesc', {
            name: tenant?.tenant_name || tenant_id,
            status: $t(`tenant.status.${new_status}`),
          }),
          type: 'success',
        });

        return response;
      } else {
        throw new Error('Failed to change tenant status');
      }
    } catch (error: any) {
      console.error('Change tenant status error:', error);
      ElMessage.error(error.message || $t('tenant.statusChangeFailed'));
      throw error;
    } finally {
      operationLoading.value = false;
    }
  }

  /**
   * 获取租户配置
   */
  async function fetchTenantSettings(tenantId: string) {
    try {
      settingsLoading.value = true;

      const response = await getTenantSettingsApi(tenantId);

      if (response) {
        tenantSettings.value = response;
        return response;
      } else {
        throw new Error('Failed to fetch tenant settings');
      }
    } catch (error: any) {
      console.error('Fetch tenant settings error:', error);
      ElMessage.error(error.message || $t('tenant.fetchSettingsFailed'));
      throw error;
    } finally {
      settingsLoading.value = false;
    }
  }

  /**
   * 更新租户配置
   */
  async function updateTenantSettings(params: UpdateTenantSettingsRequest) {
    try {
      operationLoading.value = true;

      const response = await updateTenantSettingsApi(params);

      if (response) {
        // 更新本地配置
        if (tenantSettings.value?.tenant_id === params.tenant_id) {
          tenantSettings.value.settings = response.settings;
          tenantSettings.value.last_updated = response.updated_at;
        }

        ElNotification({
          title: $t('tenant.updateSettingsSuccess'),
          message: $t('tenant.updateSettingsSuccessDesc'),
          type: 'success',
        });

        return response;
      } else {
        throw new Error('Failed to update tenant settings');
      }
    } catch (error: any) {
      console.error('Update tenant settings error:', error);
      ElMessage.error(error.message || $t('tenant.updateSettingsFailed'));
      throw error;
    } finally {
      operationLoading.value = false;
    }
  }

  /**
   * 检查租户配额
   */
  async function fetchTenantQuotas(tenantId: string) {
    try {
      quotasLoading.value = true;

      const response = await checkTenantQuotasApi(tenantId);

      // checkTenantQuotasApi 使用 responseReturn: 'raw'，直接使用响应数据
      if (response) {
        tenantQuotas.value = response;
        return response;
      } else {
        throw new Error('Failed to fetch tenant quotas');
      }
    } catch (error: any) {
      console.error('Fetch tenant quotas error:', error);
      ElMessage.error(error.message || $t('tenant.fetchQuotasFailed'));
      throw error;
    } finally {
      quotasLoading.value = false;
    }
  }

  /**
   * 重置状态
   */
  function resetState() {
    tenantList.value = [];
    currentTenant.value = null;
    tenantSettings.value = null;
    tenantQuotas.value = null;
    pagination.value = {
      total: 0,
      current: 1,
      pageSize: 20,
      nextCursor: undefined,
      hasMore: false,
    };
    searchParams.value = {
      search: '',
      status: '',
    };
  }

  return {
    // 状态
    tenantList,
    currentTenant,
    tenantSettings,
    tenantQuotas,
    listLoading,
    detailLoading,
    settingsLoading,
    quotasLoading,
    operationLoading,
    pagination,
    searchParams,

    // 计算属性
    activeTenants,
    suspendedTenants,
    totalTenants,

    // 方法
    fetchTenantList,
    fetchTenantDetail,
    createTenant,
    updateTenant,
    deleteTenant,
    changeTenantStatus,
    fetchTenantSettings,
    updateTenantSettings,
    fetchTenantQuotas,
    resetState,
  };
});
