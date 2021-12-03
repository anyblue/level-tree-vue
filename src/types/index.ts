import type {DefineComponent, ComputedOptions, MethodOptions, ComponentOptionsMixin, PropType} from 'vue';
export declare const LevelTree: DefineComponent<{
  data: {
    type: PropType<Tree>,
    required: true,
    default: () => null
  },
  maxLevel: {
    type: NumberConstructor,
    required: true,
    default: 0
  },
  rootId: {
    type: StringConstructor,
    required: true,
    default: ''
  },
  spaceConfig: {
    type: PropType<{
      btnWidth?: number;
      btnMargin?: number;
      cardMargin?: number;
      cardWidth?: number;
    }>,
    required: false,
    default: () => (Record<string, number>)
  },
  childFlagKey: {
    type: StringConstructor,
    required: false,
    default: 'childFlag'
  },
  focusId: {
    type: StringConstructor,
    required: false,
    default: ''
  },
  frameSide: {
    type: PropType<'center'|'left'|'right'>,
    required: false,
    default: 'center'
  }
}, void, unknown, ComputedOptions, MethodOptions, ComponentOptionsMixin, ComponentOptionsMixin, ['update:focusId', 'itemFetch', 'globalFetch']>;
export interface Tree {
  pid?: string;
  childFlag?: boolean;
  id: string;
  children: Tree[];
  [key: string]: unknown;
}

export default LevelTree;
