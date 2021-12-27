<template>
  <div
    :class="['tree-row', {
      top: isTop,
      bottom: isBottom
    }]"
  >
    <div 
      v-if="pageSize"
      :class="['tree-main', sideClass]"
    >
      <span
        v-if="overflow"
        :class="['direction-wrap left', {disabled: leftIndex <= -1}]"
        :style="{
          'min-width': `${spaceConfig.btnWidth}px`,
          'margin-right': `${spaceConfig.btnMargin}px`
        }"
      >
        <i @click="move('left')" class="direction left"/>
      </span>
      <span
        v-else-if="!parentMiddle && placeholder > 0 && data.length"
        class="placeholder"
        :style="{width: `${placeholder * unitSpace}px`}"
      />
      <div
        v-for="item in showData"
        :key="item.id"
        :class="['item-wrap', {
          'plus': expandedId === item.id && item.children?.length,
          'focus': focusId && focusId === item.id
        }]"
        :style="{
          margin: `0 ${spaceConfig.cardMargin}px`,
          width: `${spaceConfig.cardWidth}px`
        }"
      >
        <div
          v-if="!isTop"
          class="connect-line"
          :style="{
            left:`${-spaceConfig.cardMargin}px`,
            width: `calc(100% + ${spaceConfig.cardMargin * 2}px)`
          }"
        />
        <div class="card-wrap">
          <slot :data="item"/>
          <i
            v-if="item[childFlagKey]"
            @mousedown.prevent
            @click="expandedChange(item)"
            :class="['show-btn', {
              minus: expandedId === item.id,
              add: expandedId !== item.id
            }]"
          />
        </div>
      </div>
      <span
        v-if="overflow"
        :class="['direction-wrap right', {disabled: leftIndex >= data.length - pageSize - 1}]"
        :style="{
          'min-width': `${spaceConfig.btnWidth}px`,
          'margin-left': `${spaceConfig.btnMargin}px`
        }"
      >
        <i @click="move('right')" class="direction right"/>
      </span>
      <span
        v-else-if="!parentMiddle && placeholder < 0 && data.length"
        class="placeholder"
        :style="{width: `${-placeholder * unitSpace}px`}"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {computed, toRef, PropType, ref, watch, toRefs, inject, watchEffect} from 'vue';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import type {Tree} from '../../types';

// 获取列表相对视口对齐的起始索引
const getViewLeft = (length: number, size: number, side = 'center') => {
  if (side === 'left') {
    return -1;
  }
  if (side === 'right') {
    return (length - size) - 1;
  }
  return Math.floor((length - size) / 2) - 1;
};
const useRowInit = (props: {
  parentCount: number;
  parentOffset: number;
  pageSize: number;
  defaultIndex: number;
  defaultExpandedId: string;
  data: Tree[];
  childFlagKey: string;
  frameSide: string;
}) => {
  const {data, parentOffset, parentCount, pageSize, defaultIndex, defaultExpandedId, frameSide} = toRefs(props);
  const parentMiddle = computed(() => (!parentCount.value
            || (parentOffset.value * 2 === parentCount.value - 1)));
  const parentLeft = computed(() => 2 * parentOffset.value + 1 + pageSize.value - parentCount.value);

  const expandedId = ref('');
  const placeholder = ref(0);
  const leftIndex = ref(0);
  watchEffect(() => {
    // 当可视区域右边缘溢出数组，以数组末端为右边缘倒推 leftIndex ，适应 resize
    if (leftIndex.value + pageSize.value > data.value.length - 1) {
      leftIndex.value = Math.max(data.value.length - 1 - pageSize.value, -1);
    }
  });
  const legalLeftIndex = (index: number) => {
    if (index < -1) {
      index = -1;
    }
    else if (index > data.value.length - pageSize.value - 1) {
      index = data.value.length - pageSize.value - 1;
    }
    return index;
  };
  const matchPlaceholder = (parentLeft: number, {count, length}: {count: number; length: number}) => {
    let toLeft = parentLeft - length;
    let toRight = 2 * (count - length) - toLeft;
    if (toLeft < 0) {
      toLeft = 0;
      toRight = 2 * (count - length) - toLeft;
    }
    else if (toRight < 0) {
      toRight = 0;
      toLeft = 2 * (count - length) - toRight;
    }
    return toLeft - toRight; // 占位的单位距离，正值左占位，负值右占位。
  };

  const leftIndexReset = () => {
    let left = getViewLeft(data.value.length, pageSize.value, frameSide.value); // 读取的首个元素前一个元素
    if (!isNaN(props.defaultIndex)) {
      left = legalLeftIndex(defaultIndex.value - Math.round(pageSize.value / 2));
    }
    leftIndex.value = left;
  };

  const positionReset = () => {
    if (!parentMiddle.value) {
      placeholder.value = matchPlaceholder(parentLeft.value, {
        count: pageSize.value,
        length: data.value.length
      });
    }
    else {
      placeholder.value = 0;
    }
    expandedId.value = defaultExpandedId.value || '';
  };
  const initFlag = computed(() => ({
    // 只监听 data 的浅层变更，防止 children 变更重置父级
    data: data.value.map(item => pick(item, ['pid', 'id', props.childFlagKey])),
    parentOffset: parentOffset.value,
    parentCount: parentCount.value
  }));
  watch(initFlag, (value, oldValue) => {
    if (isEqual(value, oldValue)) {
      return;
    }
    if (!isEqual(value.data, oldValue?.data)) {
      // data 修改触发位移重置
      leftIndexReset();
    }
    positionReset();
  }, {immediate: true, deep: true});
  return {parentMiddle, parentLeft, expandedId, placeholder, leftIndex, legalLeftIndex};
};
</script>
<script lang="ts" setup>
const props = defineProps({
  data: {
    type: Array as PropType<Tree[]>,
    required: true,
    default: () => []
  },
  pageSize: {
    type: Number,
    required: true,
    default: 0
  },
  parentCount: {
    type: Number,
    required: false,
    default: 0
  },
  parentOffset: {
    type: Number,
    required: false,
    default: 0
  },
  defaultIndex: {
    type: Number,
    required: false,
    default: NaN
  },
  steper: {
    type: Number,
    required: false,
    default: NaN
  },
  defaultExpandedId: {
    type: String,
    required: false,
    default: ''
  },
  isTop: {
    type: Boolean,
    required: false,
    default: false
  },
  isBottom: {
    type: Boolean,
    required: false,
    default: false
  },
  childFlagKey: {
    type: String,
    required: false,
    default: 'childFlag'
  },
  focusId: {
    type: String,
    required: false,
    default: ''
  },
  frameSide: {
    type: String as PropType<'center'|'left'|'right'>,
    required: false,
    default: 'center'
  }
});

const emit = defineEmits(['expandedChange', 'change']);

const spaceConfig = inject('spaceConfig', {
  btnWidth: 0,
  btnMargin: 0,
  cardWidth: 0,
  cardMargin: 0
});
const unitSpace = spaceConfig.cardWidth / 2 + spaceConfig.cardMargin;

const pageSize = toRef(props, 'pageSize');
const overflow = computed(() => props.data.length > pageSize.value);

const {
  expandedId,
  leftIndex,
  legalLeftIndex,
  parentLeft,
  parentMiddle,
  placeholder
} = useRowInit(props);


const findTarget = () => {
  const count = overflow.value ? pageSize.value : props.data.length;
  const point = overflow.value ? leftIndex.value : -1;
  let result;
  for (let i = 0; i <= count - 1; i++) {
    const index = i + point + 1;
    if (props.data[index]?.id === expandedId.value) {
      result = {
        target: props.data[index],
        count: count,
        index: i
      };
      if (overflow.value) {
        return result;
      }
      break;
    }
  }
  if (!result) {
    return {target: null};
  }
  if (placeholder.value > 0) {
    result.index += placeholder.value / 2;
  }
  result.count += Math.abs(placeholder.value) / 2;
  return result;
};
let targetStatus: {
  target: Tree|null;
  count?: number;
  index?: number;
} = {target: null};
watch([leftIndex, expandedId, placeholder, pageSize], () => {
  const localStatus = findTarget();
  if (!isEqual(localStatus, targetStatus)) {
    targetStatus = localStatus;
    emit('change', localStatus);
  }
}, {immediate: true});


const move = (direction: string) => {
  let offset = direction === 'left' ? -1
    : direction === 'right' ? 1 : 0;
  offset *= isNaN(props.steper) ? props.pageSize : props.steper;
  leftIndex.value = legalLeftIndex(leftIndex.value + offset);
};
const expandedChange = (target: Tree) => {
  const toExpand = target.id !== expandedId.value;
  emit('expandedChange', {target, status: toExpand});
  if (!props.isBottom) {
    expandedId.value = toExpand ? target.id : '';
  }
};

const showData = computed(() => {
  if (overflow.value) {
    return props.data.slice(leftIndex.value + 1, leftIndex.value + props.pageSize + 1);
  }
  return props.data;
});
const sideClass = computed(() => ({
  'left-side': parentLeft.value === 1,
  'right-side': parentLeft.value === 2 * pageSize.value - 1
}));

</script>


<style lang="less">
@level-gap: 50px;
@button-height: 22px;
@item-height: 140px;
@show-btn-size: 15px;
@connect-line-color: #ccc;

.tree-row {
    margin-top: @level-gap;
    display: flex;
    justify-content: center;
    width: 100%;
    .tree-main {
        display: flex;
        align-items: center;
        &.left-side .item-wrap{
            &:first-of-type .connect-line::after {
                border-top-left-radius: 0;
                margin-left: -1px;
            }
        }
        &.right-side .item-wrap:last-of-type .connect-line::before {
            border-top-right-radius: 0;
        }
    }
    .direction {
        display: block;
        height: 100%;
        cursor: pointer;
        background-image: url('../../assets/images/left.svg');
        background-repeat: no-repeat;
        background-size: 100% 100%;
        &-wrap {
            line-height: 0;
            height: @button-height;
            &.disabled {
                .direction {
                    display: none;
                }
            }
        }
        &.right {
            transform: rotate(180deg);
        }
    }
    .placeholder {
        display: inline-block;
    }
    .item-wrap {
        flex-shrink: 0;
        height: @item-height;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        &.plus::after {
            content: '';
            flex-grow: 1;
            border-left: 1px solid @connect-line-color;
            margin-left: -1px;
            margin-bottom: -@level-gap / 2;
        }
        .card-wrap {
            position: relative;
            width: 100%;
            height: 100%;
            .card-content {
                width: 100%;
                height: 100%;
            }
            .show-btn {
                flex-shrink: 0;
                width: @show-btn-size;
                height: @show-btn-size;
                cursor: pointer;
                border-radius: 50%;
                position: absolute;
                bottom: -@show-btn-size / 2;
                left: 50%;
                transform: translateX(-50%);
                background-size: 100% 100%;
                background-repeat: no-repeat;
                z-index: 9;
                &.add {
                    background-image: url('../../assets/images/add.svg');
                }
                &.minus {
                    background-image: url('../../assets/images/minus.svg');
                }
            }
        }
        .connect-line {
            position: absolute;
            top: -@level-gap / 2;
            height: @level-gap / 2;
            pointer-events: none;
            &::before,
            &::after {
                content: ' ';
                height: 100%;
                width: 50%;
                position: absolute;
                top: 0;
            }
            &::before {
                right: 50%;
                border-right: 1px solid @connect-line-color;
                border-top: 1px solid @connect-line-color;
            }
            &::after {
                left: 50%;
                border-top: 1px solid @connect-line-color;
            }
        }
        &:last-of-type .connect-line::after,
        &:first-of-type .connect-line::before {
            content: none;
        }
        &:last-of-type .connect-line::before {
            border-top-right-radius: 8px;
        }
        &:first-of-type {
            .connect-line::after {
                border-left: 1px solid @connect-line-color;
                border-top-left-radius: 8px;
            }
            &:last-of-type .connect-line::before {
                content: ' ';
                border-top: 0;
                border-top-right-radius: 0;
                margin-top: -1px;
                height: calc(~"100% + 1px");
            }
        }
    }
}
</style>

