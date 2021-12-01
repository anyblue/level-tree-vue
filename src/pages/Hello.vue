<script setup lang="ts">
console.log('blue-template.');
</script>

<template>
  <div class="blue-template">
    blue-template
  </div>
</template>

<style lang="less">
@import url('src/assets/css/mixins.less');

.blue-template {
  width: 100%;
  height: 100%;
  font-size: 64px;
}
</style>