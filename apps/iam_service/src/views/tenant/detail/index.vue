<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ArrowDown,
  ArrowLeft,
  Edit,
  PieChart,
  User,
  UserFilled,
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { storeToRefs } from 'pinia';

import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';
import { formatDateTime } from '#/utils/date';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const { detailLoading } = tenantStore;
const { currentTenant } = storeToRefs(tenantStore);

// 获取状态标签类型
function getStatusType(status: string) {
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

// 事件处理
function handleBack() {
  router.push('/tenant/list');
}

function handleEdit() {
  if (currentTenant.value) {
    router.push(`/tenant/edit/${currentTenant.value.tenant_id}`);
  }
}

async function handleDropdownCommand(command: string) {
  if (!currentTenant.value) return;

  switch (command) {
    case 'activate': {
      await handleStatusChange('active');
      break;
    }
    case 'delete': {
      await handleDelete();
      break;
    }
    case 'suspend': {
      await handleStatusChange('suspended');
      break;
    }
  }
}

async function handleStatusChange(newStatus: string) {
  if (!currentTenant.value) return;

  try {
    await ElMessageBox.confirm(
      $t('tenant.dialog.statusChangeConfirm', {
        name: currentTenant.value.tenant_name,
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
      tenant_id: currentTenant.value.tenant_id,
      new_status: newStatus as any,
      reason: 'Manual operation by admin',
    });
  } catch {
    // 用户取消操作
  }
}

async function handleDelete() {
  if (!currentTenant.value) return;

  try {
    await ElMessageBox.confirm(
      $t('tenant.dialog.deleteConfirm', {
        name: currentTenant.value.tenant_name,
      }),
      $t('tenant.dialog.deleteTitle'),
      {
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        type: 'error',
        dangerouslyUseHTMLString: true,
        message: `
          <p>${$t('tenant.dialog.deleteConfirm', { name: currentTenant.value.tenant_name })}</p>
          <p style="color: #f56c6c; font-size: 12px; margin-top: 8px;">
            ${$t('tenant.dialog.deleteWarning')}
          </p>
        `,
      },
    );

    await tenantStore.deleteTenant(currentTenant.value.tenant_id);
    router.push('/tenant/list');
  } catch {
    // 用户取消操作
  }
}

// 初始化
onMounted(async () => {
  const tenantId = route.params.id as string;
  if (tenantId) {
    await tenantStore.fetchTenantDetail(tenantId);
  }
});
</script>

<template>
  <div class="tenant-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ $t('common.back') }}
          </el-button>
          <div class="page-title">
            <h1>{{ $t('tenant.detail.title') }}</h1>
            <p v-if="currentTenant" class="page-subtitle">
              {{ currentTenant.tenant_name }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Edit" @click="handleEdit">
            {{ $t('tenant.actions.edit') }}
          </el-button>
          <el-dropdown @command="handleDropdownCommand">
            <el-button>
              {{ $t('common.more') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="activate"
                  v-if="currentTenant?.status === 'suspended'"
                >
                  {{ $t('tenant.actions.activate') }}
                </el-dropdown-item>
                <el-dropdown-item
                  command="suspend"
                  v-if="currentTenant?.status === 'active'"
                >
                  {{ $t('tenant.actions.suspend') }}
                </el-dropdown-item>
                <el-dropdown-item divided command="delete">
                  {{ $t('tenant.actions.delete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-loading="detailLoading" class="page-content">
      <div v-if="currentTenant" class="content-grid">
        <!-- 基本信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <h3>{{ $t('tenant.detail.basicInfo') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <label>{{ $t('tenant.fields.tenantName') }}</label>
                <div class="info-value">{{ currentTenant.tenant_name }}</div>
              </div>
              <div class="info-item">
                <label>{{ $t('tenant.fields.tenantCode') }}</label>
                <div class="info-value">{{ currentTenant.tenant_code }}</div>
              </div>
              <div class="info-item">
                <label>{{ $t('tenant.fields.status') }}</label>
                <div class="info-value">
                  <el-tag :type="getStatusType(currentTenant.status)">
                    {{ $t(`tenant.status.${currentTenant.status}`) }}
                  </el-tag>
                </div>
              </div>
              <div class="info-item full-width">
                <label>{{ $t('tenant.fields.description') }}</label>
                <div class="info-value">
                  {{ currentTenant.description || $t('common.none') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户统计卡片 -->
        <div class="stats-card">
          <div class="card-header">
            <h3>{{ $t('tenant.detail.userStats') }}</h3>
          </div>
          <div class="card-content">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon current">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">
                    {{ currentTenant.current_users }}
                  </div>
                  <div class="stat-label">
                    {{ $t('tenant.fields.currentUsers') }}
                  </div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon max">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ currentTenant.max_users }}</div>
                  <div class="stat-label">
                    {{ $t('tenant.fields.maxUsers') }}
                  </div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon usage">
                  <el-icon><PieChart /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">
                    {{
                      Math.round(
                        (currentTenant.current_users /
                          currentTenant.max_users) *
                          100,
                      )
                    }}%
                  </div>
                  <div class="stat-label">
                    {{ $t('tenant.detail.usageRate') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间信息卡片 -->
        <div class="time-card">
          <div class="card-header">
            <h3>{{ $t('tenant.detail.timeInfo') }}</h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <label>{{ $t('tenant.fields.createdAt') }}</label>
                <div class="info-value">
                  {{ formatDateTime(currentTenant.created_at) }}
                </div>
              </div>
              <div class="info-item">
                <label>{{ $t('tenant.fields.updatedAt') }}</label>
                <div class="info-value">
                  {{ formatDateTime(currentTenant.updated_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty :description="$t('tenant.detail.notFound')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tenant-detail-page {
  min-height: 100vh;
  background-color: #f9fafb;
}

.page-header {
  padding: 1rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 80rem;
  margin: 0 auto;
}

.header-left {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.page-title h1 {
  margin-bottom: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.page-content {
  max-width: 80rem;
  padding: 1.5rem;
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stats-card {
    grid-column: span 2;
  }
}

.info-card,
.stats-card,
.time-card {
  overflow: hidden;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.card-content {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .info-item.full-width {
    grid-column: span 2;
  }
}

.info-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.info-value {
  font-size: 1rem;
  color: #111827;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  font-size: 1.25rem;
  color: white;
  border-radius: 0.5rem;
}

.stat-icon.current {
  background-color: #3b82f6;
}

.stat-icon.max {
  background-color: #10b981;
}

.stat-icon.usage {
  background-color: #8b5cf6;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}
</style>
