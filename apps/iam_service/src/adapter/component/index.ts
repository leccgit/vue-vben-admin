/**
 * 通用组件共同的使用的基础组件，原先放在 adapter/form 内部，限制了使用范围，这里提取出来，方便其他地方使用
 * 可用于 vben-form、vben-modal、vben-drawer 等组件使用,
 */

import type { Component } from 'vue';

import type { BaseFormComponentType } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { defineAsyncComponent, defineComponent, h, ref } from 'vue';

import { ApiComponent, globalShareState, IconPicker } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElNotification } from 'element-plus';

const ElButton = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/button/index'),
    import('element-plus/es/components/button/style/css'),
  ]).then(([res]) => res.ElButton),
);
const ElCheckbox = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/checkbox/index'),
    import('element-plus/es/components/checkbox/style/css'),
  ]).then(([res]) => res.ElCheckbox),
);
const ElCheckboxButton = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/checkbox/index'),
    import('element-plus/es/components/checkbox-button/style/css'),
  ]).then(([res]) => res.ElCheckboxButton),
);
const ElCheckboxGroup = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/checkbox/index'),
    import('element-plus/es/components/checkbox-group/style/css'),
  ]).then(([res]) => res.ElCheckboxGroup),
);
const ElDatePicker = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/date-picker/index'),
    import('element-plus/es/components/date-picker/style/css'),
  ]).then(([res]) => res.ElDatePicker),
);
const ElDivider = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/divider/index'),
    import('element-plus/es/components/divider/style/css'),
  ]).then(([res]) => res.ElDivider),
);
const ElInput = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/input/index'),
    import('element-plus/es/components/input/style/css'),
  ]).then(([res]) => res.ElInput),
);
const ElInputNumber = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/input-number/index'),
    import('element-plus/es/components/input-number/style/css'),
  ]).then(([res]) => res.ElInputNumber),
);
const ElRadio = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/radio/index'),
    import('element-plus/es/components/radio/style/css'),
  ]).then(([res]) => res.ElRadio),
);
const ElRadioButton = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/radio/index'),
    import('element-plus/es/components/radio-button/style/css'),
  ]).then(([res]) => res.ElRadioButton),
);
const ElRadioGroup = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/radio/index'),
    import('element-plus/es/components/radio-group/style/css'),
  ]).then(([res]) => res.ElRadioGroup),
);
const ElSelectV2 = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/select-v2/index'),
    import('element-plus/es/components/select-v2/style/css'),
  ]).then(([res]) => res.ElSelectV2),
);
const ElSpace = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/space/index'),
    import('element-plus/es/components/space/style/css'),
  ]).then(([res]) => res.ElSpace),
);
const ElSwitch = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/switch/index'),
    import('element-plus/es/components/switch/style/css'),
  ]).then(([res]) => res.ElSwitch),
);
const ElTimePicker = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/time-picker/index'),
    import('element-plus/es/components/time-picker/style/css'),
  ]).then(([res]) => res.ElTimePicker),
);
const ElTreeSelect = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/tree-select/index'),
    import('element-plus/es/components/tree-select/style/css'),
  ]).then(([res]) => res.ElTreeSelect),
);
const ElUpload = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/upload/index'),
    import('element-plus/es/components/upload/style/css'),
  ]).then(([res]) => res.ElUpload),
);

// 添加租户列表页面需要的组件
const ElCard = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/card/index'),
    import('element-plus/es/components/card/style/css'),
  ]).then(([res]) => res.ElCard),
);
const ElRow = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/row/index'),
    import('element-plus/es/components/row/style/css'),
  ]).then(([res]) => res.ElRow),
);
const ElCol = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/col/index'),
    import('element-plus/es/components/col/style/css'),
  ]).then(([res]) => res.ElCol),
);
const ElIcon = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/icon/index'),
    import('element-plus/es/components/icon/style/css'),
  ]).then(([res]) => res.ElIcon),
);
const ElTable = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/table/index'),
    import('element-plus/es/components/table/style/css'),
  ]).then(([res]) => res.ElTable),
);
const ElTableColumn = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/table/index'),
    import('element-plus/es/components/table-column/style/css'),
  ]).then(([res]) => res.ElTableColumn),
);
const ElTag = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/tag/index'),
    import('element-plus/es/components/tag/style/css'),
  ]).then(([res]) => res.ElTag),
);
const ElDropdown = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/dropdown/index'),
    import('element-plus/es/components/dropdown/style/css'),
  ]).then(([res]) => res.ElDropdown),
);
const ElDropdownMenu = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/dropdown/index'),
    import('element-plus/es/components/dropdown-menu/style/css'),
  ]).then(([res]) => res.ElDropdownMenu),
);
const ElDropdownItem = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/dropdown/index'),
    import('element-plus/es/components/dropdown-item/style/css'),
  ]).then(([res]) => res.ElDropdownItem),
);
const ElPagination = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/pagination/index'),
    import('element-plus/es/components/pagination/style/css'),
  ]).then(([res]) => res.ElPagination),
);
const ElOption = defineAsyncComponent(() =>
  Promise.all([
    import('element-plus/es/components/select/index'),
    import('element-plus/es/components/option/style/css'),
  ]).then(([res]) => res.ElOption),
);

const withDefaultPlaceholder = <T extends Component>(
  component: T,
  type: 'input' | 'select',
  componentProps: Recordable<any> = {},
) => {
  return defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup: (props: any, { attrs, expose, slots }) => {
      const placeholder =
        props?.placeholder ||
        attrs?.placeholder ||
        $t(`ui.placeholder.${type}`);
      // 透传组件暴露的方法
      const innerRef = ref();
      expose(
        new Proxy(
          {},
          {
            get: (_target, key) => innerRef.value?.[key],
            has: (_target, key) => key in (innerRef.value || {}),
          },
        ),
      );
      return () =>
        h(
          component,
          { ...componentProps, placeholder, ...props, ...attrs, ref: innerRef },
          slots,
        );
    },
  });
};

// 这里需要自行根据业务组件库进行适配，需要用到的组件都需要在这里类型说明
export type ComponentType =
  | 'ApiSelect'
  | 'ApiTreeSelect'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'Divider'
  | 'IconPicker'
  | 'Input'
  | 'InputNumber'
  | 'RadioGroup'
  | 'Select'
  | 'Space'
  | 'Switch'
  | 'TimePicker'
  | 'TreeSelect'
  | 'Upload'
  | BaseFormComponentType;

async function initComponentAdapter() {
  const components: Partial<Record<ComponentType, Component>> = {
    // 如果你的组件体积比较大，可以使用异步加载
    // Button: () =>
    // import('xxx').then((res) => res.Button),
    ApiSelect: withDefaultPlaceholder(
      {
        ...ApiComponent,
        name: 'ApiSelect',
      },
      'select',
      {
        component: ElSelectV2,
        loadingSlot: 'loading',
        visibleEvent: 'onVisibleChange',
      },
    ),
    ApiTreeSelect: withDefaultPlaceholder(
      {
        ...ApiComponent,
        name: 'ApiTreeSelect',
      },
      'select',
      {
        component: ElTreeSelect,
        props: { label: 'label', children: 'children' },
        nodeKey: 'value',
        loadingSlot: 'loading',
        optionsPropName: 'data',
        visibleEvent: 'onVisibleChange',
      },
    ),
    Checkbox: ElCheckbox,
    CheckboxGroup: (props, { attrs, slots }) => {
      let defaultSlot;
      if (Reflect.has(slots, 'default')) {
        defaultSlot = slots.default;
      } else {
        const { options, isButton } = attrs;
        if (Array.isArray(options)) {
          defaultSlot = () =>
            options.map((option) =>
              h(isButton ? ElCheckboxButton : ElCheckbox, option),
            );
        }
      }
      return h(
        ElCheckboxGroup,
        { ...props, ...attrs },
        { ...slots, default: defaultSlot },
      );
    },
    // 自定义默认按钮
    DefaultButton: (props, { attrs, slots }) => {
      return h(ElButton, { ...props, attrs, type: 'info' }, slots);
    },
    // 自定义主要按钮
    PrimaryButton: (props, { attrs, slots }) => {
      return h(ElButton, { ...props, attrs, type: 'primary' }, slots);
    },
    Divider: ElDivider,
    IconPicker: withDefaultPlaceholder(IconPicker, 'select', {
      iconSlot: 'append',
      modelValueProp: 'model-value',
      inputComponent: ElInput,
    }),
    Input: withDefaultPlaceholder(ElInput, 'input'),
    InputNumber: withDefaultPlaceholder(ElInputNumber, 'input'),
    RadioGroup: (props, { attrs, slots }) => {
      let defaultSlot;
      if (Reflect.has(slots, 'default')) {
        defaultSlot = slots.default;
      } else {
        const { options } = attrs;
        if (Array.isArray(options)) {
          defaultSlot = () =>
            options.map((option) =>
              h(attrs.isButton ? ElRadioButton : ElRadio, option),
            );
        }
      }
      return h(
        ElRadioGroup,
        { ...props, ...attrs },
        { ...slots, default: defaultSlot },
      );
    },
    Select: (props, { attrs, slots }) => {
      return h(ElSelectV2, { ...props, attrs }, slots);
    },
    Space: ElSpace,
    Switch: ElSwitch,
    TimePicker: (props, { attrs, slots }) => {
      const { name, id, isRange } = props;
      const extraProps: Recordable<any> = {};
      if (isRange) {
        if (name && !Array.isArray(name)) {
          extraProps.name = [name, `${name}_end`];
        }
        if (id && !Array.isArray(id)) {
          extraProps.id = [id, `${id}_end`];
        }
      }
      return h(
        ElTimePicker,
        {
          ...props,
          ...attrs,
          ...extraProps,
        },
        slots,
      );
    },
    DatePicker: (props, { attrs, slots }) => {
      const { name, id, type } = props;
      const extraProps: Recordable<any> = {};
      if (type && type.includes('range')) {
        if (name && !Array.isArray(name)) {
          extraProps.name = [name, `${name}_end`];
        }
        if (id && !Array.isArray(id)) {
          extraProps.id = [id, `${id}_end`];
        }
      }
      return h(
        ElDatePicker,
        {
          ...props,
          ...attrs,
          ...extraProps,
        },
        slots,
      );
    },
    TreeSelect: withDefaultPlaceholder(ElTreeSelect, 'select'),
    Upload: ElUpload,
    // 添加租户列表页面需要的组件
    Card: ElCard,
    Row: ElRow,
    Col: ElCol,
    Icon: ElIcon,
    Table: ElTable,
    TableColumn: ElTableColumn,
    Tag: ElTag,
    Dropdown: ElDropdown,
    DropdownMenu: ElDropdownMenu,
    DropdownItem: ElDropdownItem,
    Pagination: ElPagination,
    Option: ElOption,
  };

  // 将组件注册到全局共享状态中
  globalShareState.setComponents(components);

  // 定义全局共享状态中的消息提示
  globalShareState.defineMessage({
    // 复制成功消息提示
    copyPreferencesSuccess: (title, content) => {
      ElNotification({
        title,
        message: content,
        position: 'bottom-right',
        duration: 0,
        type: 'success',
      });
    },
  });
}

export { initComponentAdapter };
