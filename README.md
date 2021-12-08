# level-tree-vue

> 一个基于Vue3.2+的树组件

<img src="https://github.com/anyblue/level-tree-vue/blob/main/src/assets/images/preview.png" alt="预览" style="zoom:70%;" />

+ 只能展开同源节点（无法同时展开多个兄弟节点）。
+ 支持动态加载
+ 自适应容器布局
+ 可定制视口默认位置

## Install
```shell
npm install level-tree-vue --save
```

## Demo
```html
<div id="root">
    <LevelTree
        :data="tree"
        :max-level="4"
        root-id="root"
        @item-fetch="itemFetch"
        @global-fetch="globalFetch"
    >
        <template #default="{data}">
        {{ data.id }}
        </template>
    </LevelTree>
</div>
```
```html
<script lang="ts" setup>
import {LevelTree, Tree} from 'level-tree-vue';

const tree = ref<Tree>({
    id: '0',
    children: [
        {
            id: '0-0',
            children: [
                {
                    id: '0-0-0',
                    children: [],
                    childFlag: false
                }
            ],
            childFlag: true // 非叶子节点
        },
        {
            id: '0-1',
            children: [],
            childFlag: true // 非叶子节点-动态获取子
        },
        {
            id: '0-2',
            children: [],
            childFlag: false // 叶子节点
        }
    ],
    childFlag: true
});
const itemFetch = (
    id: string, // 展开的节点 id
    index: number, // 展开的节点在兄弟中的索引
    cb: (node: Partial<Tree>) => void // 更新回调
) => {
    // 获取由当前 id 开始的节点树
    // cb(node); // 将子树传入回调
};
const globalFetch = (
    id: string, // 节点id
    direction: 'up'|'down' // 刷新视图的方向：上翻、下钻
) => {
    if (direction === 'up') {
        // 获取当前 id 节点的父节点开始的节点树
    } else {
        // 获取当前 id 节点开始的节点树
    }
    // 赋值 tree ，重新渲染 LevelTree
}
</script>
```

## API

### 属性

| 名称               | 类型                          | 默认值                                                       | 描述                                                         |
| ------------------ | ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ```data```         | ```Tree```                    | ```-```                                                      | 必填，树型结构，渲染视图的依据                               |
| ```maxLevel```     | ```number```                  | ```-```                                                      | 必填，最大的展开层数。展开超过该值将触发```global-fetch```事件 |
| ```rootId```       | ```string```                  | ```-```                                                      | 必填，容器元素的id，用于自适应容器宽度                       |
| ```spaceConfig```  | ```Space```                   | ```{ btnWidth: 12, btnMargin: 18, cardMargin: 10, cardWidth: 170 }``` | 描述按钮、卡片横向尺寸（单位：px）                           |
| ```childFlagKey``` | ```string```                  | ```childFlag```                                              | ```data```中是否包含子节点的key                              |
| ```focusId```      | ```string```                  | ```''```                                                     | ```v-modal```，聚焦节点的id。可使用```.item-wrap.focus```选中聚焦节点。 |
| ```frameSide```    | ```'center'\|'left'\|'right'``` | ```'center'```                                               | 视口默认位置，比如置为```'left'```后，将默认从子序列的最左侧展示。 |

#### Tree

```typescript
interface Tree {
  pid?: string;
  id: string;
  children: Tree[];
  childFlag?: boolean;
  [key: string]: unknown;
}
```

+ pid、id、children 以及 childFlagKey配置的 key 为树型结构的必要字段。
+ 其他内容可依据卡片展示的内容自行添加。

#### Space

```typescript
interface Space {
  btnWidth?: number;
  btnMargin?: number;
  cardWidth?: number;
  cardMargin?: number;
}
```

+ 缺省的配置项将沿用默认值。

### 插槽

| 名称    | 描述                                                   |
| ------- | ------------------------------------------------------ |
| default | ```data```是```Tree```结构数据，用于获取每个节点的数据 |

### 事件

| 名称              | 类型                                                         | 描述                       |
| ----------------- | ------------------------------------------------------------ | -------------------------- |
| ```itemFetch```   | ```(id: string, index: number, cb: (node: Partial<Tree>) => void) => unknown ``` | 用于动态加载节点           |
| ```globalFetch``` | ```(id: string, direction: 'up'\|'down') => unknown ```       | 用于下钻、上翻，整体更新树 |

## History
