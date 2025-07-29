<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, markRaw, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';
import { detectLoginType } from '#/utils/device';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

// 表单状态
const showMfaInput = ref(false);
const loginType = ref<'email' | 'phone' | 'username'>('username');

// 检测标识符类型并更新登录类型
function handleIdentifierChange(identifier: string) {
  loginType.value = detectLoginType(identifier);
}

const formSchema = computed((): VbenFormSchema[] => {
  const baseSchema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.identifierTip'),
        onInput: (value: string) => handleIdentifierChange(value),
      },
      fieldName: 'identifier',
      label: $t('authentication.identifier'),
      rules: z.string().min(1, { message: $t('authentication.identifierTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenCheckbox',
      componentProps: {
        label: $t('authentication.rememberMe'),
      },
      fieldName: 'rememberMe',
      label: '',
      rules: z.boolean().optional().default(false),
    },
  ];

  // 如果需要MFA，添加MFA输入框
  if (showMfaInput.value) {
    baseSchema.splice(2, 0, {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mfaCodeTip'),
        maxlength: 6,
      },
      fieldName: 'mfaCode',
      label: $t('authentication.mfaCode'),
      rules: z.string().min(6, { message: $t('authentication.mfaCodeTip') }),
    });
  }

  // 添加滑块验证
  baseSchema.push({
    component: markRaw(SliderCaptcha),
    fieldName: 'captcha',
    rules: z.boolean().refine((value) => value, {
      message: $t('authentication.verifyRequiredTip'),
    }),
  });

  return baseSchema;
});

// 处理登录提交
async function handleLogin(values: Record<string, any>) {
  try {
    await authStore.authLogin({
      identifier: values.identifier,
      password: values.password,
      rememberMe: values.rememberMe,
      mfaCode: values.mfaCode,
    });
  } catch (error: any) {
    // 检查是否需要MFA
    if (error.type === 'mfa_required') {
      showMfaInput.value = true;
    }
    throw error;
  }
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleLogin"
  >
    <template #extra>
      <div class="flex justify-between text-sm">
        <router-link
          to="/auth/forgot-password"
          class="text-primary hover:text-primary-600"
        >
          {{ $t('authentication.forgotPassword') }}
        </router-link>
        <span class="text-muted-foreground">
          {{ $t('authentication.loginType') }}:
          <span class="capitalize">{{ loginType }}</span>
        </span>
      </div>
    </template>
  </AuthenticationLogin>
</template>
