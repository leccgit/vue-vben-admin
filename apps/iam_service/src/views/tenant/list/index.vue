<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowDown,
  Building2,
  CircleCheck,
  CirclePause,
  Plus,
  Refresh,
  Search,
  Users,
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';
import { formatDateTime } from '#/utils/date';

const router = useRouter();
const tenantStore = useTenantStore();

// 响应式数据
const {
  tenantList,
  activeTenants,
  suspendedTenants,
  totalTenants,
  listLoading,
  pagination,
  searchParams,
} = tenantStore;

// 状态选项
const statusOptions = [
  { label: $t('tenant.status.active'), value: 'active' },
  { label: $t('tenant.status.inactive'), value: 'inactive' },
  { label: $t('tenant.status.pending'), value: 'pending' },
  { label: $t('tenant.status.suspended'), value: 'suspended' },
  { label: $t('tenant.status.deleted'), value: 'deleted' },
];

// 计算总用户数
const totalUsers = computed(() => {
  return tenantList.value.reduce(
    (sum, tenant) => sum + tenant.current_users,
    0,
  );
});

// 获取状态标签类型
function getStatusTagType(status: string) {
  const typeMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    pending: 'warning',
    suspended: 'danger',
    deleted: 'info',
  };
  return typeMap[status] || 'info';
}

// 事件处理
function handleCreate() {
  router.push('/tenant/create');
}

function handleView(tenant: any) {
  router.push(`/tenant/detail/${tenant.tenant_id}`);
}

function handleEdit(tenant: any) {
  router.push(`/tenant/edit/${tenant.tenant_id}`);
}

async function handleRefresh() {
  await tenantStore.fetchTenantList();
}

async function handleSearch() {
  pagination.current = 1;
  await tenantStore.fetchTenantList();
}

function handleSortChange(_sort: any) {
  // TODO: 实现排序逻辑
  // console.log('Sort change:', sort);
}

async function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.current = 1;
  await tenantStore.fetchTenantList();
}

async function handleCurrentChange(page: number) {
  pagination.current = page;
  await tenantStore.fetchTenantList();
}

async function handleDropdownCommand(command: string, tenant: any) {
  switch (command) {
    case 'activate': {
      await handleStatusChange(tenant, 'active');
      break;
    }
    case 'delete': {
      await handleDelete(tenant);
      break;
    }
    case 'quotas': {
      router.push(`/tenant/quotas/${tenant.tenant_id}`);
      break;
    }
    case 'settings': {
      router.push(`/tenant/settings/${tenant.tenant_id}`);
      break;
    }
    case 'suspend': {
      await handleStatusChange(tenant, 'suspended');
      break;
    }
  }
}

async function handleStatusChange(tenant: any, newStatus: string) {
  try {
    await ElMessageBox.confirm(
      $t('tenant.dialog.statusChangeConfirm', {
        name: tenant.tenant_name,
        status: $t(`tenant.status.${newStatus}`),
      }),
      $t('tenant.dialog.statusChangeTitle'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'warning',
      },
    );

    await tenantStore.changeTenantStatus({
      tenant_id: tenant.tenant_id,
      new_status: newStatus as any,
      reason: 'Manual operation by admin',
    });
  } catch {
    // 用户取消操作
  }
}

async function handleDelete(tenant: any) {
  try {
    await ElMessageBox.confirm(
      $t('tenant.dialog.deleteConfirm', { name: tenant.tenant_name }),
      $t('tenant.dialog.deleteTitle'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'error',
        dangerouslyUseHTMLString: true,
        message: `
          <p>${$t('tenant.dialog.deleteConfirm', { name: tenant.tenant_name })}</p>
          <p style="color: #f56c6c; font-size: 12px; margin-top: 8px;">
            ${$t('tenant.dialog.deleteWarning')}
          </p>
        `,
      },
    );

    await tenantStore.deleteTenant(tenant.tenant_id);
  } catch {
    // 用户取消操作
  }
}

// 初始化
onMounted(async () => {
  await tenantStore.fetchTenantList();
});
</script>

<template>
  <div class="tenant-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('tenant.list') }}</h1>
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            {{ $t('tenant.create') }}
          </el-button>
          <el-button
            :icon="Refresh"
            @click="handleRefresh"
            :loading="listLoading"
          >
            {{ $t('tenant.actions.refresh') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <div class="search-form">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-input
                v-model="searchParams.search"
                :placeholder="$t('tenant.search.placeholder')"
                :prefix-icon="Search"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </el-col>
            <el-col :span="6">
              <el-select
                v-model="searchParams.status"
                :placeholder="$t('tenant.search.statusFilter')"
                clearable
                @change="handleSearch"
              >
                <el-option :label="$t('tenant.search.allStatus')" value="" />
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><Building2 /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalTenants }}</div>
                <div class="stat-label">
                  {{ $t('tenant.statistics.totalTenants') }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ activeTenants.length }}</div>
                <div class="stat-label">
                  {{ $t('tenant.statistics.activeTenants') }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon suspended">
                <el-icon><CirclePause /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ suspendedTenants.length }}</div>
                <div class="stat-label">
                  {{ $t('tenant.statistics.suspendedTenants') }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon users">
                <el-icon><Users /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalUsers }}</div>
                <div class="stat-label">
                  {{ $t('tenant.statistics.totalUsers') }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 租户列表 -->
    <div class="table-section">
      <el-card>
        <el-table
          v-loading="listLoading"
          :data="tenantList"
          stripe
          @sort-change="handleSortChange"
        >
          <el-table-column
            prop="tenant_name"
            :label="$t('tenant.fields.tenantName')"
            min-width="150"
            sortable="custom"
          >
            <template #default="{ row }">
              <div class="tenant-name-cell">
                <div class="tenant-name">{{ row.tenant_name }}</div>
                <div class="tenant-code">{{ row.tenant_code }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="status"
            :label="$t('tenant.fields.status')"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ $t(`tenant.status.${row.status}`) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="current_users"
            :label="$t('tenant.fields.currentUsers')"
            width="120"
            align="center"
          >
            <template #default="{ row }">
              <span>{{ row.current_users }} / {{ row.max_users }}</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="created_at"
            :label="$t('tenant.fields.createdAt')"
            width="180"
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>

          <el-table-column
            :label="$t('common.actions')"
            width="200"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleView(row)"
              >
                {{ $t('tenant.actions.view') }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEdit(row)"
              >
                {{ $t('tenant.actions.edit') }}
              </el-button>
              <el-dropdown
                @command="(command) => handleDropdownCommand(command, row)"
              >
                <el-button type="primary" size="small" text>
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="settings">
                      {{ $t('tenant.actions.settings') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="quotas">
                      {{ $t('tenant.actions.quotas') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status === 'active'"
                      command="suspend"
                    >
                      {{ $t('tenant.actions.suspend') }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.status !== 'active'"
                      command="activate"
                    >
                      {{ $t('tenant.actions.activate') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      {{ $t('tenant.actions.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.tenant-list-page {
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-section {
  margin-bottom: 16px;
}

.search-form {
  padding: 8px 0;
}

.statistics-section {
  margin-bottom: 16px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-right: 16px;
  font-size: 24px;
  color: white;
  border-radius: 8px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.suspended {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.stat-label {
  margin-top: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.table-section {
  margin-bottom: 16px;
}

.tenant-name-cell {
  display: flex;
  flex-direction: column;
}

.tenant-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tenant-code {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
