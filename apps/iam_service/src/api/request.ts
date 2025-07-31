/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 自定义响应拦截器 - 统一处理后端 BaseResponse 架构
  client.addResponseInterceptor({
    fulfilled: (response) => {
      const { config, data: responseData } = response;

      // 如果是原始响应模式，直接返回
      if (config?.responseReturn === 'raw') {
        return response;
      }
      //
      // // 检查 HTTP 状态码
      // if (status < 200 || status >= 400) {
      //   // HTTP 错误状态，让后续拦截器处理
      //   return response;
      // }

      // 检查响应数据格式
      if (
        !responseData ||
        typeof responseData !== 'object' ||
        !responseData.status
      ) {
        // 如果不是 BaseResponse 格式，按原逻辑处理
        if (config?.responseReturn === 'body') {
          return responseData;
        } else if (config?.responseReturn === 'data') {
          // 如果没有 data 字段，返回整个响应数据
          return responseData?.data || responseData;
        }
        return response;
      }

      // 处理后端的 BaseResponse 格式
      if (responseData.status === 'success') {
        // 成功响应 - 根据配置返回数据
        if (config?.responseReturn === 'body') {
          return responseData;
        } else if (config?.responseReturn === 'data') {
          return responseData.data;
        }
        return response;
      }

      if (responseData.status === 'fail') {
        // 客户端错误 (4xx) - 参数校验失败等
        const errorMessage = responseData.message || '请求参数错误';
        const errors = responseData.errors || [];

        // 构造详细错误信息
        let detailedMessage = errorMessage;
        if (errors.length > 0) {
          const errorDetails = errors.map((err: any) => err.message).join('; ');
          detailedMessage = `${errorMessage}: ${errorDetails}`;
        }

        // 抛出包含详细信息的错误
        const error = new Error(detailedMessage);
        (error as any).type = 'validation_error';
        (error as any).code = responseData.code;
        (error as any).errors = errors;
        (error as any).response = response;
        throw error;
      }

      if (responseData.status === 'error') {
        // 服务器错误 (5xx) - 系统异常
        const errorMessage = responseData.message || '服务器内部错误';
        const errors = responseData.errors || [];

        // 构造详细错误信息
        let detailedMessage = errorMessage;
        if (errors.length > 0) {
          const errorDetails = errors.map((err: any) => err.message).join('; ');
          detailedMessage = `${errorMessage}: ${errorDetails}`;
        }

        // 抛出包含详细信息的错误
        const error = new Error(detailedMessage);
        (error as any).type = 'server_error';
        (error as any).code = responseData.code;
        (error as any).errors = errors;
        (error as any).response = response;
        throw error;
      }

      // 对于其他情况，返回原始响应
      return response;
    },
  });

  // token过期的处理 - 需要检查 401 状态码
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理 - 适配后端错误格式
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 优先使用自定义错误信息
      if (error?.message) {
        ElMessage.error(error.message);
        return;
      }

      // 处理后端返回的错误格式
      const responseData = error?.response?.data ?? {};
      let errorMessage = '';

      // 按优先级获取错误信息
      if (responseData?.message) {
        errorMessage = responseData.message;

        // 如果有详细错误信息，追加显示
        if (
          responseData?.errors &&
          Array.isArray(responseData.errors) &&
          responseData.errors.length > 0
        ) {
          const errorDetails = responseData.errors
            .map((err: any) => err.message)
            .join('; ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
      } else {
        // 兜底使用默认错误信息
        errorMessage = msg;
      }

      // 根据错误类型显示不同的消息样式
      if (error?.type === 'validation_error') {
        ElMessage.warning(errorMessage);
      } else {
        ElMessage.error(errorMessage);
      }
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
