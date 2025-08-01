<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { UpdateTenantRequest } from '#/api/core/tenant';

import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft } from '@element-plus/icons-vue';
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
          <h1 class="page-title">{{ $t('tenant.edit') }}</h1>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="detailLoading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 编辑表单 -->
    <div v-else-if="currentTenant" class="form-container">
      <el-card>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          @submit.prevent="handleSubmit"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item
                :label="$t('tenant.fields.tenantName')"
                prop="tenant_name"
              >
                <el-input
                  v-model="formData.tenant_name"
                  :placeholder="$t('tenant.form.tenantNamePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('tenant.fields.tenantCode')">
                <el-input
                  :value="currentTenant.tenant_code"
                  disabled
                  readonly
                />
                <div class="form-tip">租户编码创建后不可修改</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item
            :label="$t('tenant.fields.description')"
            prop="description"
          >
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('tenant.form.descriptionPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('tenant.fields.maxUsers')" prop="max_users">
            <el-input-number
              v-model="formData.max_users"
              :min="currentTenant.current_users"
              :max="100000"
              :step="1"
              style="width: 200px"
            />
            <div class="form-tip">
              当前用户数：{{
                currentTenant.current_users
              }}，最大用户数不能小于当前用户数
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="operationLoading"
              @click="handleSubmit"
            >
              {{ $t('common.save') }}
            </el-button>
            <el-button @click="handleReset">
              {{ $t('common.reset') }}
            </el-button>
            <el-button @click="handleBack">
              {{ $t('common.cancel') }}
            </el-button>
          </el-form-item>
        </el-form>
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
.tenant-edit-page {
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

.loading-container {
  padding: 24px;
}

.form-container {
  max-width: 800px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
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
