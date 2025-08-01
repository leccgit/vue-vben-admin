<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { CreateTenantRequest } from '#/api/core/tenant';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ArrowLeft } from '@element-plus/icons-vue';

import { $t } from '#/locales';
import { useTenantStore } from '#/store/tenant';

const router = useRouter();
const tenantStore = useTenantStore();

const { operationLoading } = tenantStore;

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<CreateTenantRequest>({
  tenant_name: '',
  tenant_code: '',
  description: '',
  max_users: 100,
  create_admin_user: true,
  admin_username: '',
  admin_email: '',
  admin_password: '',
  settings: {},
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
  tenant_code: [
    {
      required: true,
      message: $t('tenant.validation.tenantCodeRequired'),
      trigger: 'blur',
    },
    {
      pattern: /^[\w-]+$/,
      message: $t('tenant.validation.tenantCodeFormat'),
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
  admin_username: [
    {
      required: true,
      message: $t('tenant.validation.adminUsernameRequired'),
      trigger: 'blur',
    },
  ],
  admin_email: [
    {
      required: true,
      message: $t('tenant.validation.adminEmailRequired'),
      trigger: 'blur',
    },
    {
      type: 'email',
      message: $t('tenant.validation.adminEmailFormat'),
      trigger: 'blur',
    },
  ],
  admin_password: [
    {
      required: true,
      message: $t('tenant.validation.adminPasswordRequired'),
      trigger: 'blur',
    },
    {
      min: 8,
      message: $t('tenant.validation.adminPasswordLength'),
      trigger: 'blur',
    },
  ],
};

// 事件处理
function handleBack() {
  router.push('/tenant/list');
}

function handleReset() {
  formRef.value?.resetFields();
}

async function handleSubmit() {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    // 准备提交数据
    const submitData: CreateTenantRequest = {
      tenant_name: formData.tenant_name,
      tenant_code: formData.tenant_code,
      description: formData.description || undefined,
      max_users: formData.max_users,
      create_admin_user: formData.create_admin_user,
      settings: formData.settings,
    };

    // 如果创建管理员用户，添加管理员信息
    if (formData.create_admin_user) {
      submitData.admin_username = formData.admin_username;
      submitData.admin_email = formData.admin_email;
      submitData.admin_password = formData.admin_password;
    }

    // 创建租户
    const newTenant = await tenantStore.createTenant(submitData);

    // 跳转到租户详情页
    router.push(`/tenant/detail/${newTenant.tenant_id}`);
  } catch (error) {
    console.error('Create tenant error:', error);
  }
}
</script>

<template>
  <div class="tenant-create-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ $t('common.back') }}
          </el-button>
          <h1 class="page-title">{{ $t('tenant.create') }}</h1>
        </div>
      </div>
    </div>

    <!-- 创建表单 -->
    <div class="form-container">
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
              <el-form-item
                :label="$t('tenant.fields.tenantCode')"
                prop="tenant_code"
              >
                <el-input
                  v-model="formData.tenant_code"
                  :placeholder="$t('tenant.form.tenantCodePlaceholder')"
                  clearable
                />
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
              :min="1"
              :max="100000"
              :step="1"
              :placeholder="$t('tenant.form.maxUsersPlaceholder')"
              style="width: 200px"
            />
          </el-form-item>

          <el-divider content-position="left">
            {{ $t('tenant.form.adminUserSettings') }}
          </el-divider>

          <el-form-item>
            <el-checkbox v-model="formData.create_admin_user">
              {{ $t('tenant.form.createAdminUser') }}
            </el-checkbox>
          </el-form-item>

          <template v-if="formData.create_admin_user">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item
                  :label="$t('tenant.form.adminUsername')"
                  prop="admin_username"
                >
                  <el-input
                    v-model="formData.admin_username"
                    :placeholder="$t('tenant.form.adminUsernamePlaceholder')"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  :label="$t('tenant.form.adminEmail')"
                  prop="admin_email"
                >
                  <el-input
                    v-model="formData.admin_email"
                    :placeholder="$t('tenant.form.adminEmailPlaceholder')"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item
              :label="$t('tenant.form.adminPassword')"
              prop="admin_password"
            >
              <el-input
                v-model="formData.admin_password"
                type="password"
                :placeholder="$t('tenant.form.adminPasswordPlaceholder')"
                show-password
                clearable
              />
            </el-form-item>
          </template>

          <el-form-item>
            <el-button
              type="primary"
              :loading="operationLoading"
              @click="handleSubmit"
            >
              {{ $t('tenant.create') }}
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
  </div>
</template>

<style scoped>
.tenant-create-page {
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

.form-container {
  max-width: 800px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-divider__text) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
