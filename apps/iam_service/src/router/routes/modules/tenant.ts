import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const BasicLayout = () => import('#/layouts/basic.vue');

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:building-2',
      order: 2,
      title: $t('tenant.title'),
    },
    name: 'TenantManagement',
    path: '/tenant',
    component: BasicLayout,
    children: [
      {
        name: 'TenantList',
        path: 'list',
        component: () => import('#/views/tenant/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:list',
          title: $t('tenant.list'),
        },
      },
      {
        name: 'TenantDetail',
        path: 'detail/:id',
        component: () => import('#/views/tenant/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:eye',
          title: $t('tenant.detail.title'),
        },
      },
      {
        name: 'TenantCreate',
        path: 'create',
        component: () => import('#/views/tenant/create/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:plus',
          title: $t('tenant.create'),
        },
      },
      {
        name: 'TenantEdit',
        path: 'edit/:id',
        component: () => import('#/views/tenant/edit/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:edit',
          title: $t('tenant.edit.title'),
        },
      },
      {
        name: 'TenantSettings',
        path: 'settings/:id',
        component: () => import('#/views/tenant/settings/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:settings',
          title: $t('tenant.settings'),
        },
      },
      {
        name: 'TenantQuotas',
        path: 'quotas/:id',
        component: () => import('#/views/tenant/quotas/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:gauge',
          title: $t('tenant.quotas'),
        },
      },
    ],
  },
];

export default routes;
