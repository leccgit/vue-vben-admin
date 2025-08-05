<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import {
  CircleCheck,
  OfficeBuilding,
  Plus,
  User,
  VideoPause,
} from '@element-plus/icons-vue';
import { ElButton, ElTag } from 'element-plus';
import { storeToRefs } from 'pinia';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';
import { formatDateTime } from '#/utils/date';

const router = useRouter();
const tenantStore = useTenantStore();
const { tenantList } = storeToRefs(tenantStore);

// 状态选项
const statusOptions = [
  { label: $t('tenant.status.active'), value: 'active' },
  { label: $t('tenant.status.inactive'), value: 'inactive' },
  { label: $t('tenant.status.pending'), value: 'pending' },
  { label: $t('tenant.status.suspended'), value: 'suspended' },
  { label: $t('tenant.status.deleted'), value: 'deleted' },
];

// 获取状态标签类型
function getStatusTagType(status: string) {
  const typeMap: Record<
    string,
    'danger' | 'info' | 'primary' | 'success' | 'warning'
  > = {
    active: 'success',
    inactive: 'info',
    pending: 'primary',
    suspended: 'warning',
    deleted: 'danger',
  };
  return typeMap[status] || 'info';
}

// 操作处理函数
function handleCreate() {
  router.push('/tenant/create');
}

function handleEdit(record: any) {
  router.push(`/tenant/edit/${record.tenant_id}`);
}

function handleView(record: any) {
  router.push(`/tenant/detail/${record.tenant_id}`);
}

async function handleDelete(record: any) {
  await tenantStore.deleteTenant(record.tenant_id);
  gridApi.reload();
}

// 表格配置
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    // 搜索表单配置
    schema: [
      {
        component: 'Input',
        componentProps: {
          placeholder: $t('tenant.search.placeholder'),
        },
        fieldName: 'search',
        label: $t('tenant.search.keyword'),
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: statusOptions,
          placeholder: $t('tenant.search.statusFilter'),
        },
        fieldName: 'status',
        label: $t('tenant.search.status'),
      },
    ],
  },
  gridOptions: {
    // 表格配置
    border: true,
    showHeaderOverflow: true,
    showOverflow: 'tooltip',
    keepSource: true,
    id: 'tenant-list-grid',
    height: 600,
    printConfig: {},
    sortConfig: {
      trigger: 'cell',
      remote: true,
    },
    filterConfig: {
      remote: true,
    },
    pagerConfig: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    },
    toolbarConfig: {
      refresh: true,
      import: false,
      export: false,
      print: false,
      zoom: false,
      custom: true,
      search: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page, form }: { form: any; page: any }) => {
          try {
            const params = {
              limit: page?.pageSize || 20,
              cursor: page?.currentPage > 1 ? 'cursor' : undefined,
              search: form?.search || '',
              status: form?.status || '',
            };

            const result = await tenantStore.fetchTenantList(params);

            const response = {
              result: result?.items || [],
              page: {
                total: result?.total || 0,
              },
            };

            return response;
          } catch (error) {
            console.error('Error in VXE Table query:', error);
            return {
              result: [],
              page: {
                total: 0,
              },
            };
          }
        },
      },
    },
    columns: [
      {
        type: 'seq',
        width: 60,
        fixed: 'left',
      },
      {
        field: 'tenant_name',
        title: $t('tenant.fields.tenantName'),
        minWidth: 200,
        fixed: 'left',
        slots: { default: 'tenant_name_default' },
      },
      {
        field: 'status',
        title: $t('tenant.fields.status'),
        width: 120,
        slots: { default: 'status_default' },
      },
      {
        field: 'current_users',
        title: $t('tenant.fields.currentUsers'),
        width: 120,
        sortable: true,
      },
      {
        field: 'max_users',
        title: $t('tenant.fields.maxUsers'),
        width: 120,
        sortable: true,
      },
      {
        field: 'created_at',
        title: $t('tenant.fields.createdAt'),
        width: 180,
        formatter: ({ cellValue }: { cellValue: any }) =>
          formatDateTime(cellValue),
      },
      {
        field: 'updated_at',
        title: $t('tenant.fields.updatedAt'),
        width: 180,
        formatter: ({ cellValue }: { cellValue: any }) =>
          formatDateTime(cellValue),
      },
      {
        field: 'action',
        title: $t('common.action'),
        width: 200,
        fixed: 'right',
        showOverflow: false,
        slots: { default: 'action_default' },
      },
    ],
  },
});

// 统计数据
const statistics = computed(() => {
  const tenants = tenantList.value || [];
  return {
    total: tenants.length,
    active: tenants.filter((t: any) => t.status === 'active').length,
    suspended: tenants.filter((t: any) => t.status === 'suspended').length,
    totalUsers: tenants.reduce(
      (sum: number, t: any) => sum + (t.current_users || 0),
      0,
    ),
  };
});
</script>

<template>
  <div class="tenant-list-page">
    <!-- 统计卡片 -->
    <div class="statistics-section mb-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">
                {{ $t('tenant.statistics.totalTenants') }}
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.active }}</div>
              <div class="stat-label">
                {{ $t('tenant.statistics.activeTenants') }}
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon suspended">
              <el-icon><VideoPause /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.suspended }}</div>
              <div class="stat-label">
                {{ $t('tenant.statistics.suspendedTenants') }}
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalUsers }}</div>
              <div class="stat-label">
                {{ $t('tenant.statistics.totalUsers') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <component :is="Grid">
      <!-- 工具栏操作按钮 -->
      <template #toolbar-actions>
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          {{ $t('tenant.actions.create') }}
        </el-button>
        <!-- <el-button type="info" @click="testApiCall"> 测试 API </el-button> -->
      </template>

      <!-- 租户名称列 -->
      <template #tenant_name_default="{ row }">
        <div class="tenant-name-cell">
          <div class="tenant-name font-medium">{{ row.tenant_name }}</div>
          <div class="tenant-code text-sm text-gray-500">
            {{ row.tenant_code }}
          </div>
        </div>
      </template>

      <!-- 状态列 -->
      <template #status_default="{ row }">
        <ElTag :type="getStatusTagType(row.status)">
          {{ $t(`tenant.status.${row.status}`) }}
        </ElTag>
      </template>

      <!-- 操作列 -->
      <template #action_default="{ row }">
        <div class="flex items-center space-x-2">
          <ElButton size="small" type="primary" @click="handleView(row)">
            查看
          </ElButton>
          <ElButton size="small" type="success" @click="handleEdit(row)">
            编辑
          </ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row)">
            删除
          </ElButton>
        </div>
      </template>
    </component>
  </div>
</template>

<style scoped>
.tenant-list-page {
  @apply p-4;
}

.statistics-section {
  @apply mb-6;
}

.stat-card {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md;
}

.stat-content {
  @apply flex items-center justify-between;
}

.stat-info {
  @apply flex-1;
}

.stat-value {
  @apply mb-1 text-2xl font-bold text-gray-900;
}

.stat-label {
  @apply text-sm text-gray-500;
}

.stat-icon {
  @apply flex h-12 w-12 items-center justify-center rounded-lg text-xl text-white;
}

.stat-icon.total {
  @apply bg-blue-500;
}

.stat-icon.active {
  @apply bg-green-500;
}

.stat-icon.suspended {
  @apply bg-orange-500;
}

.stat-icon.users {
  @apply bg-purple-500;
}

.tenant-name-cell {
  @apply space-y-1;
}

.tenant-name {
  @apply text-gray-900;
}

.tenant-code {
  @apply text-xs text-gray-500;
}

/* Dark mode support */
.dark .stat-card {
  @apply border-gray-700 bg-gray-800;
}

.dark .stat-value {
  @apply text-gray-100;
}

.dark .stat-label {
  @apply text-gray-400;
}

.dark .tenant-name {
  @apply text-gray-100;
}

.dark .tenant-code {
  @apply text-gray-400;
}
</style>
