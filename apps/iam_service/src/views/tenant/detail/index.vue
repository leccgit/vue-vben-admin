<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ArrowDown,
  ArrowLeft,
  Avatar,
  Edit,
  Key,
  User,
  UserFilled,
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';
import { formatDateTime } from '#/utils/date';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const { currentTenant, detailLoading } = tenantStore;

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

// 获取使用率颜色
function getUsageColor(ratio: number) {
  if (ratio < 0.7) return '#67c23a';
  if (ratio < 0.9) return '#e6a23c';
  return '#f56c6c';
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
    case 'quotas': {
      router.push(`/tenant/quotas/${currentTenant.value.tenant_id}`);
      break;
    }
    case 'settings': {
      router.push(`/tenant/settings/${currentTenant.value.tenant_id}`);
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
          <h1 class="page-title">{{ $t('tenant.detail') }}</h1>
        </div>
        <div class="header-actions">
          <el-button type="primary" :icon="Edit" @click="handleEdit">
            {{ $t('tenant.actions.edit') }}
          </el-button>
          <el-dropdown @command="handleDropdownCommand">
            <el-button>
              {{ $t('common.more')
              }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
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
                  v-if="currentTenant?.status === 'active'"
                  command="suspend"
                >
                  {{ $t('tenant.actions.suspend') }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="currentTenant?.status !== 'active'"
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
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="detailLoading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 租户详情内容 -->
    <div v-else-if="currentTenant" class="detail-content">
      <!-- 基本信息卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ $t('common.basicInfo') }}</span>
            <el-tag :type="getStatusTagType(currentTenant.status)" size="large">
              {{ $t(`tenant.status.${currentTenant.status}`) }}
            </el-tag>
          </div>
        </template>

        <el-row :gutter="24">
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.tenantName')
              }}</label>
              <div class="info-value">{{ currentTenant.tenant_name }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.tenantCode')
              }}</label>
              <div class="info-value">{{ currentTenant.tenant_code }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.tenantId')
              }}</label>
              <div class="info-value">{{ currentTenant.tenant_id }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.maxUsers')
              }}</label>
              <div class="info-value">{{ currentTenant.max_users }}</div>
            </div>
          </el-col>
          <el-col :span="24">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.description')
              }}</label>
              <div class="info-value">
                {{ currentTenant.description || '-' }}
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.createdAt')
              }}</label>
              <div class="info-value">
                {{ formatDateTime(currentTenant.created_at) }}
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label class="info-label">{{
                $t('tenant.fields.updatedAt')
              }}</label>
              <div class="info-value">
                {{ formatDateTime(currentTenant.updated_at) }}
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 统计信息卡片 -->
      <el-card class="statistics-card">
        <template #header>
          <span class="card-title">{{ $t('tenant.statistics.overview') }}</span>
        </template>

        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-icon users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ currentTenant.statistics.user_count }}
                </div>
                <div class="stat-label">
                  {{ $t('tenant.fields.userCount') }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-icon active-users">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ currentTenant.statistics.active_user_count }}
                </div>
                <div class="stat-label">
                  {{ $t('tenant.fields.activeUserCount') }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-icon roles">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ currentTenant.statistics.role_count }}
                </div>
                <div class="stat-label">
                  {{ $t('tenant.fields.roleCount') }}
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-icon permissions">
                <el-icon><Key /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ currentTenant.statistics.permission_count }}
                </div>
                <div class="stat-label">
                  {{ $t('tenant.fields.permissionCount') }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 用户使用情况 -->
      <el-card class="usage-card">
        <template #header>
          <span class="card-title">{{ $t('tenant.statistics.usage') }}</span>
        </template>

        <div class="usage-progress">
          <div class="usage-info">
            <span class="usage-label">{{
              $t('tenant.fields.currentUsers')
            }}</span>
            <span class="usage-value">
              {{ currentTenant.current_users }} / {{ currentTenant.max_users }}
            </span>
          </div>
          <el-progress
            :percentage="
              Math.round(
                (currentTenant.current_users / currentTenant.max_users) * 100,
              )
            "
            :color="
              getUsageColor(
                currentTenant.current_users / currentTenant.max_users,
              )
            "
            :stroke-width="8"
          />
        </div>
      </el-card>
    </div>

    <!-- 未找到租户 -->
    <div v-else class="not-found">
      <el-empty :description="$t('tenant.notFound')" :image-size="200">
        <el-button type="primary" @click="handleBack">
          {{ $t('common.back') }}
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.tenant-detail-page {
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

.header-left {
  display: flex;
  gap: 16px;
  align-items: center;
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

.loading-container {
  padding: 24px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 20px;
  color: white;
  border-radius: 8px;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active-users {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.roles {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.permissions {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.usage-progress {
  padding: 8px 0;
}

.usage-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.usage-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.usage-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
