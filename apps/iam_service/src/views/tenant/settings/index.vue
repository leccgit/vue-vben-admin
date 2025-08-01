<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft } from '@element-plus/icons-vue';

import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

function handleBack() {
  const tenantId = route.params.id as string;
  if (tenantId) {
    router.push(`/tenant/detail/${tenantId}`);
  } else {
    router.push('/tenant/list');
  }
}
</script>

<template>
  <div class="tenant-settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ $t('common.back') }}
          </el-button>
          <h1 class="page-title">{{ $t('tenant.settings') }}</h1>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <el-card>
        <div class="coming-soon">
          <el-empty description="租户配置功能开发中..." :image-size="200">
            <el-button type="primary" @click="handleBack">
              {{ $t('common.back') }}
            </el-button>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.tenant-settings-page {
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

.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
