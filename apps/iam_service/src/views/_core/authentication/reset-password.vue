<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenForm } from '#/adapter/form';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ResetPassword' });

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// 表单状态
const resetToken = ref('');
const isValidToken = ref(false);
const isLoading = ref(true);

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
  ];
});

// 创建表单
// eslint-disable-next-line no-unused-vars
const [Form, _formApi] = useVbenForm({
  schema: formSchema,
  handleSubmit: handleResetPassword,
});

// 验证重置令牌
async function validateResetToken() {
  const token = route.query.token as string;

  if (!token) {
    router.replace('/auth/login');
    return;
  }

  resetToken.value = token;

  // 这里可以添加令牌验证逻辑
  // 目前假设令牌有效
  isValidToken.value = true;
  isLoading.value = false;
}

// 处理密码重置提交
async function handleResetPassword(values: Record<string, any>) {
  // 验证密码确认
  if (values.newPassword !== values.confirmPassword) {
    throw new Error($t('authentication.passwordMismatch'));
  }

  try {
    await authStore.resetPassword({
      resetToken: resetToken.value,
      newPassword: values.newPassword,
    });

    // 重置成功后会自动导航到登录页
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

// 返回登录页
function goToLogin() {
  router.push('/auth/login');
}

onMounted(() => {
  validateResetToken();
});
</script>

<template>
  <div class="bg-background flex min-h-screen items-center justify-center">
    <div class="w-full max-w-md space-y-6 p-6">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center">
        <div
          class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"
        ></div>
        <p class="text-muted-foreground mt-2">
          {{ $t('authentication.validatingToken') }}
        </p>
      </div>

      <!-- 无效令牌 -->
      <div v-else-if="!isValidToken" class="space-y-4 text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
        >
          <svg
            class="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-medium">
            {{ $t('authentication.invalidResetToken') }}
          </h3>
          <p class="text-muted-foreground mt-1">
            {{ $t('authentication.invalidResetTokenDesc') }}
          </p>
        </div>

        <button type="button" class="btn btn-primary w-full" @click="goToLogin">
          {{ $t('authentication.backToLogin') }}
        </button>
      </div>

      <!-- 重置密码表单 -->
      <div v-else>
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold">
            {{ $t('authentication.resetPassword') }}
          </h1>
          <p class="text-muted-foreground mt-2">
            {{ $t('authentication.resetPasswordDesc') }}
          </p>
        </div>

        <Form>
          <template #submit>
            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="authStore.passwordResetLoading"
            >
              <span
                v-if="authStore.passwordResetLoading"
                class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"
              ></span>
              {{
                authStore.passwordResetLoading
                  ? $t('authentication.resetting')
                  : $t('authentication.resetPassword')
              }}
            </button>
          </template>
        </Form>

        <div class="mt-4 text-center">
          <button
            type="button"
            class="text-primary hover:text-primary-600 text-sm"
            @click="goToLogin"
          >
            {{ $t('authentication.backToLogin') }}
          </button>
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
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}
</style>
