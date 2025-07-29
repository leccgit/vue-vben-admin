<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';
import { detectLoginType } from '#/utils/device';

defineOptions({ name: 'ForgotPassword' });

const authStore = useAuthStore();
const router = useRouter();

// 表单状态
const step = ref<'input' | 'sent'>('input');
const identifierType = ref<'email' | 'phone'>('email');
const sentTo = ref('');

// 检测标识符类型
function handleIdentifierChange(identifier: string) {
  const type = detectLoginType(identifier);
  if (type === 'email' || type === 'phone') {
    identifierType.value = type;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  if (step.value === 'sent') {
    return [];
  }

  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.tenantCodeTip'),
      },
      fieldName: 'tenantCode',
      label: $t('authentication.tenantCode'),
      rules: z.string().min(1, { message: $t('authentication.tenantCodeTip') }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.emailOrPhoneTip'),
        onInput: (value: string) => handleIdentifierChange(value),
      },
      fieldName: 'identifier',
      label: $t('authentication.emailOrPhone'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailOrPhoneTip') }),
    },
  ];
});

// 处理忘记密码提交
async function handleForgotPassword(values: Record<string, any>) {
  try {
    const result = await authStore.forgotPassword({
      tenantCode: values.tenantCode,
      identifier: values.identifier,
      identifierType: identifierType.value,
    });

    sentTo.value = result.sent_to;
    step.value = 'sent';
  } catch (error) {
    console.error('Forgot password error:', error);
  }
}

// 返回登录页
function goToLogin() {
  router.push('/auth/login');
}

// 重新发送
function resendResetLink() {
  step.value = 'input';
}
</script>

<template>
  <div class="bg-background flex min-h-screen items-center justify-center">
    <div class="w-full max-w-md space-y-6 p-6">
      <!-- 头部 -->
      <div class="text-center">
        <h1 class="text-2xl font-bold">
          {{ $t('authentication.forgotPassword') }}
        </h1>
        <p class="text-muted-foreground mt-2">
          {{
            step === 'input'
              ? $t('authentication.forgotPasswordDesc')
              : $t('authentication.resetLinkSentDesc')
          }}
        </p>
      </div>

      <!-- 输入表单 -->
      <div v-if="step === 'input'">
        <AuthenticationForgetPassword
          :form-schema="formSchema"
          :loading="authStore.passwordResetLoading"
          @submit="handleForgotPassword"
        />

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

      <!-- 发送成功状态 -->
      <div v-else class="space-y-4 text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
        >
          <svg
            class="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div>
          <h3 class="text-lg font-medium">
            {{ $t('authentication.resetLinkSent') }}
          </h3>
          <p class="text-muted-foreground mt-1">
            {{ $t('authentication.resetLinkSentTo', { target: sentTo }) }}
          </p>
        </div>

        <div class="space-y-2">
          <button
            type="button"
            class="btn btn-primary w-full"
            @click="goToLogin"
          >
            {{ $t('authentication.backToLogin') }}
          </button>

          <button
            type="button"
            class="btn btn-outline w-full"
            @click="resendResetLink"
          >
            {{ $t('authentication.resendResetLink') }}
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

.btn-outline {
  @apply border-input bg-background hover:bg-accent hover:text-accent-foreground border;
}
</style>
