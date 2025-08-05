<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { UpdateTenantRequest } from '#/api/core/tenant';

import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';

import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const { detailLoading, operationLoading } = tenantStore;
const { currentTenant } = storeToRefs(tenantStore);

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<Omit<UpdateTenantRequest, 'tenant_id'>>({
  tenant_name: '',
  description: '',
  max_users: 100,
});

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

// 表单验证规则
const formRules: FormRules = {
  tenant_name: [
    {
      required: true,
      message: $t('tenant.validation.tenantNameRequired'),
      trigger: 'blur',
    },
  ],
  max_users: [
    {
      required: true,
      message: $t('tenant.validation.maxUsersRequired'),
      trigger: 'blur',
    },
    {
      type: 'number',
      min: 1,
      max: 100_000,
      message: $t('tenant.validation.maxUsersRange'),
      trigger: 'blur',
    },
  ],
};

// 监听当前租户变化，更新表单数据
watch(
  currentTenant,
  (tenant) => {
    if (tenant) {
      formData.tenant_name = tenant.tenant_name;
      formData.description = tenant.description || '';
      formData.max_users = tenant.max_users;
    }
  },
  { immediate: true },
);

// 事件处理
function handleBack() {
  const tenantId = route.params.id as string;
  if (tenantId) {
    router.push(`/tenant/detail/${tenantId}`);
  } else {
    router.push('/tenant/list');
  }
}

function handleReset() {
  if (currentTenant.value) {
    formData.tenant_name = currentTenant.value.tenant_name;
    formData.description = currentTenant.value.description || '';
    formData.max_users = currentTenant.value.max_users;
  }
}

async function handleSubmit() {
  if (!formRef.value || !currentTenant.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    // 准备提交数据
    const submitData: UpdateTenantRequest = {
      tenant_id: currentTenant.value.tenant_id,
      tenant_name: formData.tenant_name,
      description: formData.description || undefined,
      max_users: formData.max_users,
    };

    // 更新租户
    await tenantStore.updateTenant(submitData);

    // 显示成功消息
    ElMessage.success($t('tenant.updateSuccess'));

    // 跳转到租户详情页
    router.push(`/tenant/detail/${currentTenant.value.tenant_id}`);
  } catch (error) {
    console.error('Update tenant error:', error);
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
  <div class="tenant-edit-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ $t('common.back') }}
          </el-button>
          <div class="page-title">
            <h1>{{ $t('tenant.edit.title') }}</h1>
            <p v-if="currentTenant" class="page-subtitle">
              {{ currentTenant.tenant_name }}
            </p>
          </div>
        </div>
        <div class="header-actions">
          <el-button @click="handleReset">
            {{ $t('common.reset') }}
          </el-button>
          <el-button
            type="primary"
            :loading="operationLoading"
            @click="handleSubmit"
          >
            <el-icon><Check /></el-icon>
            {{ $t('common.save') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <!-- 加载状态 -->
      <div v-if="detailLoading" class="loading-container">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- 编辑表单 -->
      <div v-else-if="currentTenant" class="form-container">
        <div class="form-card">
          <div class="card-header">
            <h3>{{ $t('tenant.edit.basicInfo') }}</h3>
            <p class="card-description">
              {{ $t('tenant.edit.basicInfoDesc') }}
            </p>
          </div>
          <div class="card-content">
            <el-form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-width="120px"
              class="form-grid"
              @submit.prevent="handleSubmit"
            >
              <div class="form-row">
                <el-form-item
                  :label="$t('tenant.fields.tenantName')"
                  prop="tenant_name"
                  class="form-item"
                >
                  <el-input
                    v-model="formData.tenant_name"
                    :placeholder="$t('tenant.form.tenantNamePlaceholder')"
                    size="large"
                    clearable
                  />
                </el-form-item>

                <el-form-item
                  :label="$t('tenant.fields.tenantCode')"
                  class="form-item"
                >
                  <el-input
                    :value="currentTenant.tenant_code"
                    size="large"
                    disabled
                    readonly
                  />
                  <div class="form-tip">
                    {{ $t('tenant.form.tenantCodeTip') }}
                  </div>
                </el-form-item>
              </div>

              <el-form-item
                :label="$t('tenant.fields.description')"
                prop="description"
                class="form-item full-width"
              >
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="4"
                  size="large"
                  :placeholder="$t('tenant.form.descriptionPlaceholder')"
                />
              </el-form-item>

              <div class="form-row">
                <el-form-item
                  :label="$t('tenant.fields.maxUsers')"
                  prop="max_users"
                  class="form-item"
                >
                  <el-input-number
                    v-model="formData.max_users"
                    :min="currentTenant.current_users"
                    :max="100000"
                    :step="1"
                    size="large"
                    style="width: 100%"
                  />
                  <div class="form-tip">
                    {{
                      $t('tenant.form.maxUsersTip', {
                        current: currentTenant.current_users,
                      })
                    }}
                  </div>
                </el-form-item>

                <el-form-item
                  :label="$t('tenant.fields.status')"
                  class="form-item"
                >
                  <el-tag
                    :type="getStatusType(currentTenant.status)"
                    size="large"
                  >
                    {{ $t(`tenant.status.${currentTenant.status}`) }}
                  </el-tag>
                  <div class="form-tip">{{ $t('tenant.form.statusTip') }}</div>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 未找到租户 -->
      <div v-else class="empty-state">
        <el-empty :description="$t('tenant.detail.notFound')" :image-size="200">
          <el-button type="primary" @click="handleBack">
            {{ $t('common.back') }}
          </el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.tenant-edit-page {
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
  max-width: 64rem;
  padding: 1.5rem;
  margin: 0 auto;
}

.form-card {
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
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.card-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.card-content {
  padding: 1.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }

  .form-item.full-width {
    grid-column: span 2;
  }
}

.form-tip {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.loading-container {
  padding: 1.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-container {
  max-width: 800px;
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
