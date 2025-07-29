<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenForm } from '#/adapter/form';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ChangePassword' });

const authStore = useAuthStore();

// 密码强度验证
const passwordSchema = z
  .string()
  .min(8, { message: $t('authentication.passwordMinLength') })
  .regex(/[A-Z]/, { message: $t('authentication.passwordRequireUppercase') })
  .regex(/[a-z]/, { message: $t('authentication.passwordRequireLowercase') })
  .regex(/\d/, { message: $t('authentication.passwordRequireNumber') })
  .regex(/[!@#$%^&*(),.?":{}|<>]/, {
    message: $t('authentication.passwordRequireSpecial'),
  });

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.currentPassword'),
      },
      fieldName: 'oldPassword',
      label: $t('authentication.currentPassword'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.currentPasswordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.newPassword'),
        showPasswordStrength: true,
      },
      fieldName: 'newPassword',
      label: $t('authentication.newPassword'),
      rules: passwordSchema,
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword'),
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.confirmPasswordTip') }),
    },
    {
      component: 'VbenCheckbox',
      componentProps: {
        label: $t('authentication.logoutOtherSessions'),
      },
      fieldName: 'logoutOtherSessions',
      label: '',
      rules: z.boolean().optional().default(true),
    },
  ];
});

// 创建表单
const [Form, formApi] = useVbenForm({
  schema: formSchema,
  handleSubmit: handleChangePassword,
});

// 处理密码修改提交
async function handleChangePassword(values: Record<string, any>) {
  // 验证密码确认
  if (values.newPassword !== values.confirmPassword) {
    throw new Error($t('authentication.passwordMismatch'));
  }

  // 验证新密码与旧密码不同
  if (values.oldPassword === values.newPassword) {
    throw new Error($t('authentication.newPasswordSameAsOld'));
  }

  try {
    await authStore.changePassword({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
      logoutOtherSessions: values.logoutOtherSessions,
    });

    // 重置表单
    formApi.resetForm();
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6 p-6">
    <!-- 头部 -->
    <div class="text-center">
      <h1 class="text-2xl font-bold">
        {{ $t('authentication.changePassword') }}
      </h1>
      <p class="text-muted-foreground mt-2">
        {{ $t('authentication.changePasswordDesc') }}
      </p>
    </div>

    <!-- 密码强度提示 -->
    <div class="bg-muted/50 space-y-2 rounded-lg p-4">
      <h3 class="text-sm font-medium">
        {{ $t('authentication.passwordRequirements') }}
      </h3>
      <ul class="text-muted-foreground space-y-1 text-xs">
        <li>• {{ $t('authentication.passwordMinLength') }}</li>
        <li>• {{ $t('authentication.passwordRequireUppercase') }}</li>
        <li>• {{ $t('authentication.passwordRequireLowercase') }}</li>
        <li>• {{ $t('authentication.passwordRequireNumber') }}</li>
        <li>• {{ $t('authentication.passwordRequireSpecial') }}</li>
      </ul>
    </div>

    <!-- 修改密码表单 -->
    <Form>
      <template #submit>
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="authStore.passwordChangeLoading"
        >
          <span
            v-if="authStore.passwordChangeLoading"
            class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"
          ></span>
          {{
            authStore.passwordChangeLoading
              ? $t('authentication.changing')
              : $t('authentication.changePassword')
          }}
        </button>
      </template>
    </Form>

    <!-- 安全提示 -->
    <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div class="flex">
        <svg
          class="mr-2 h-5 w-5 flex-shrink-0 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div class="text-sm">
          <h4 class="font-medium text-yellow-800">
            {{ $t('authentication.securityTip') }}
          </h4>
          <p class="mt-1 text-yellow-700">
            {{ $t('authentication.changePasswordSecurityTip') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-md px-4 py-2 font-medium transition-colors;
}

.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
