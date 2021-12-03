<template>
  <div
    v-if="data && pageSize"
    class="tree-wrap"
  >
    <div
      v-if="showUp"
      class="go-top"
      @click="$emit('globalFetch', data.id, 'up')"
    />
    <TreeRow
      v-for="(item, index) in levelData"
      :key="index"
      :class="{'level-center': isCenterLevel(index)}"
      @expandedChange="expandedChange($event, index)"
      @change="parentChange($event, index)"
      :data="item"
      :default-expanded-id="expandedList[index]"
      :default-index="defaultIndex[index]"
      :is-top="index === 0"
      :parent-count="offsetList[index] ? offsetList[index][0] : 0"
      :parent-offset="offsetList[index] ? offsetList[index][1] : 0"
      :page-size="pageSize"
      :child-flag-key="childFlagKey"
      :focus-id="localFocusId"
      :frame-side="frameSide"
    >
      <template #default="{data}">
        <slot :data="data"/>
      </template>
    </TreeRow>
  </div>
</template>

<script lang="ts">
import {ref, toRefs, nextTick} from 'vue';
import type {Ref} from 'vue';
import resize from 'element-resize-event';
import debounce from 'lodash/debounce';
import type {Tree} from '../../types';

const defaultSpaceConfig = {
  btnWidth: 12,
  btnMargin: 18,
  cardMargin: 10,
  cardWidth: 170
};

const findExpandedPath = (tree: Tree, focusId: string): string[]|null => {
  if (!focusId || tree.id !== focusId && !tree.children.length) {
    return null;
  }
  const stack = [{
    node: tree,
    index: 0,
    done: false
  }];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const next = stack[stack.length - 2];
    if (top.node.id === focusId) {
      break;
    }
    if (top.node.children.length && !top.done) {
      stack.push({
        node: top.node.children[0],
        index: 0,
        done: false
      });
      top.done = true;
    }
    else {
      stack.pop();
      if (next && (next.node.children.length - 1 !== top.index)) {
        stack.push({
          node: next.node.children[top.index + 1],
          index: top.index + 1,
          done: false
        });
      }
            
    }

  }
  let path = stack.map(item => item.node.id).reverse();
  console.log('path', path);
    
  return path.length ? path : null;
};
// 获取列表相对视口对齐的中间索引
const getViewCenter = (length: number, size: number, side = 'center') => {
  if (side === 'left') {
    return Math.floor(Math.min(length, size) / 2);
  }
  if (side === 'right') {
    return length < size ? Math.floor(length / 2)
      : Math.floor(Math.min(length, size) / 2 + length - size);
  }
  return Math.floor(length / 2);
};

const useResize = (rootId: string, spaceConfig: typeof defaultSpaceConfig) => {
  const pageSize = ref(0);
    
  nextTick(() => {
    const element = document.getElementById(rootId) || document.body;
    let elementWidth = 0;
    const checkPageSize = () => {
      if (!element || element.offsetWidth === elementWidth) {
        return;
      }
      const content = element.offsetWidth - 2
                * (spaceConfig.btnWidth + spaceConfig.btnMargin);

      const card = spaceConfig.cardWidth + spaceConfig.cardMargin * 2;
      const newSize = Math.floor(content / card);
      if (newSize !== pageSize.value) {
        pageSize.value = newSize;
      }
      elementWidth = element.offsetWidth;
    };
    checkPageSize();
    resize(element, debounce(checkPageSize));
  });
  return {pageSize};
};
const useTreeInit = (
  data: Ref<Tree>,
  pageSize: Ref<number>,
  props: {focusId: string, maxLevel: number, frameSide: string}
) => {
  const {focusId: defaultFocusId, maxLevel, frameSide} = toRefs(props);
  const levelData = ref<Tree[][]>([[data.value]]);
  const expandedList = ref<string[]>([]);
  const defaultIndex = ref<number[]>([]);
  const defaultExpandedPath = findExpandedPath(data.value, defaultFocusId.value);
    
  let readList = [data.value];
  let finish = false;
  let index = 0;
  let level = 0;
  while (!finish) {
    if (index >= readList.length || level >= maxLevel.value) {
      finish = true;
      continue;
    }
    const target = readList[index];
    const isFocus = defaultFocusId.value && target.id === defaultFocusId.value;
    const isNormalLeaf = !target.children.length && !isFocus;
    const isNormalBranch = target.children.length
            && defaultExpandedPath?.length
            && !defaultExpandedPath.includes(target.id);
            
    if (isNormalLeaf || isNormalBranch) {
      index++;
      continue;
    }
        
    if (target.children.length) {
      levelData.value.push(target.children);
    }
    // 匹配到 focusId
    //     - 将聚焦节点及其展开路径交换到每层中间
    // 未匹配到 focusId
    //     - 将第一个有子节点的节点交换到中间
    readList.splice(index, 1);
    const viewCenter = getViewCenter(readList.length, pageSize.value - 1, frameSide.value);
        
    readList.splice(viewCenter, 0, target);
    expandedList.value.push(target.children.length ? target.id : '');
    defaultIndex.value[expandedList.value.length - 1] = readList.indexOf(target);
    readList = target.children;
    index = 0;
    level++;
    finish = !target.children.length;
  }
  const localFocusId = ref(defaultExpandedPath ? defaultFocusId.value
    : expandedList.value[expandedList.value.length - 1]);
  return {
    expandedList,
    localFocusId,
    defaultIndex,
    levelData
  };
};
</script>

<script lang="ts" setup>
import {computed, provide, watch} from 'vue';
import type {PropType} from 'vue';
import omit from 'lodash/omit';
import TreeRow from './TreeRow.vue';
const props = defineProps({
  data: {
    type: Object as PropType<Tree>,
    required: true,
    default: () => null
  },
  maxLevel: {
    type: Number,
    required: true,
    default: 0
  },
  rootId: {
    type: String,
    required: true,
    default: ''
  },
  spaceConfig: {
    type: Object as PropType<{
      btnWidth?: number;
      btnMargin?: number;
      cardMargin?: number;
      cardWidth?: number;
    }>,
    required: false,
    default: () => ({})
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

const emit = defineEmits(['update:focusId', 'itemFetch', 'globalFetch']);

const showUp = computed(() => !!props.data?.pid);

const isCenterLevel = (index: number) => (index !== props.maxLevel - 1) && index;

const {data, maxLevel} = toRefs(props);

const spaceConfig = {...defaultSpaceConfig, ...props.spaceConfig};
provide('spaceConfig', spaceConfig);
const {pageSize} = useResize(props.rootId, spaceConfig);
const {
  expandedList,
  localFocusId,
  defaultIndex,
  levelData
}  = useTreeInit(data as Ref<Tree>, pageSize, props);
watch(localFocusId, value => {
  emit('update:focusId', value);
}, {immediate: true});

const offsetList = ref<[number, number][]>(new Array(maxLevel.value).fill([0, 0], 2)); // 前两行无需记录父节点偏移

const expandedChange = ({target, status}: {target: Tree; status: boolean}, index: number) => {
  localFocusId.value = target.id;
  expandedList.value[index] = status && target ? target.id : '';
  if (status && !target.children.length && index < maxLevel.value - 1) {
    emit('itemFetch',
      target.id,
      index,
      (node: Partial<Tree>) => {
        target.children.splice(0, target.children.length, ...(node.children || []));
        Object.assign(target, omit(node, 'children'));
      }
    );
  }
};
const removeLevel = (index: number) => {
  levelData.value = levelData.value.slice(0, index);
};
const addLevel = (parent: Tree, index: number) => {
  // if (isEqual(parent.children, levelData.value[index])) {
  //     return;
  // }
  removeLevel(index);
  levelData.value[index] = parent.children;
  let readList = parent.children;
  let finish;
  let point = 0;
  // 展开树时，如果下层有展开过的缓存也放入 levelData 展开
  while (!finish) {
    if (point >= readList.length || !expandedList.value[index]) {
      finish = true;
      continue;
    }
    if (readList[point].id !== expandedList.value[index]) {
      point++;
      continue;
    }
    levelData.value[index + 1] = readList[point].children;
    readList = readList[point].children;
    point = 0;
    index++;
  }
};
const parentChange = (
  description: {target: null}|{target: Tree; count: number; index: number},
  index: number
) => {
  if (!description.target) {
    removeLevel(index + 1);
  }
  else if (index === maxLevel.value - 1) {
    emit('globalFetch', description.target.id, 'down');
  }
  else {
    addLevel(description.target, index + 1);
    if (offsetList.value[index + 1]) {
      offsetList.value[index + 1] = [description.count, description.index];
    }
  }
};
</script>

<style lang="less">
@top-btn-width: 24px;
@top-btn-height: 16px;
.tree-wrap {
    * {
        box-sizing: border-box;
    }
    .go-top {
        display: block;
        width: @top-btn-width;
        height: @top-btn-height;
        cursor: pointer;
        margin: 0 auto;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background-image: url('../../assets/images/top.svg');
    }
    .tree-row {
        &.top {
            margin-top: 0;
        }
    }
}
</style>
