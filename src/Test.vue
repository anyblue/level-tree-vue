<template>
  <div id="root">
    <p v-if="loading">
      loading...
    </p>
    <LevelTree
      v-else
      :data="tree"
      :max-level="4"
      focus-id="0-0-0"
      root-id="root"
      @item-fetch="itemFetch"
      @global-fetch="globalFetch"
    >
      <template #default="{data}">
        {{ data.id }}
      </template>
    </LevelTree>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, ref} from 'vue';
import LevelTree from './components/LevelTree/Index.vue';
import type {Tree} from './types';

const setChildren = (node: Tree) => {
  const childrenLength = Math.round(Math.random() * 10 + 4);
  node.children = [];
  for (let i = 0; i < childrenLength; i++) {
    node.children.push({
      pid: node.id,
      id: `${node.id}-${i}`,
      children: [],
      childFlag: !!Math.round(Math.random())
    });
  }
};
const loading = ref(false);
const tree = ref<Tree>({
  id: '0',
  children: [],
  childFlag: true
});
setChildren(tree.value);
const target = tree.value.children.find(item => item.childFlag);
if (target) {
  setChildren(target);
}
const itemFetch = (id: string, index: number, cb: (node: Partial<Tree>) => void) => {
  const node = {
    pid: id.replace(/-\d+$/, ''),
    id,
    children: [],
    childFlag: true
  };
  setChildren(node);
  console.log(node);
  cb(node);
};
const globalFetch = (id: string, direction = 'up') => {
  loading.value = true;
  nextTick(() => {
    loading.value = false;
  });
  let node: Tree;
  if (direction === 'up') {
    const pid = id.replace(/-\d+$/, '');
    node = {
      pid: pid.includes('-') ? pid.replace(/-\d+$/, '') : '',
      id: pid,
      children: [],
      childFlag: true
    };
  }
  else {
    node = {
      pid: id.replace(/-\d+$/, ''),
      id,
      children: [],
      childFlag: true
    };
  }
  setChildren(node);
  tree.value = node;
  console.log(';;;;', node, id);
};
</script>

<style lang="less">
#root {
  width: 90%;
  margin: 0 auto;
}
.item-wrap {
  &.focus .card-wrap {
    border: 1px solid blue;
  }
  .card-wrap {
    border: 1px solid #ccc;
    border-radius: 4px;
    text-align: center;
  }
}

</style>