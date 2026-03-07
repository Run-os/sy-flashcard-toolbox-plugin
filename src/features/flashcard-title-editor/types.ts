/**
 * 闪卡标题编辑器 - 类型定义
 */

/**
 * 界面类型枚举
 * - editor: 编辑界面
 * - review: 闪卡界面
 * - other: 其他界面
 */
export type InterfaceType = 'editor' | 'review' | 'other';

/**
 * 监听器配置接口
 */
export interface ObserverConfig {
  /** 界面类型 */
  interfaceType: InterfaceType;
  /** 属性过滤列表 */
  attributeFilter: string[];
}

/**
 * 处理结果接口
 */
export interface ProcessResult {
  /** 是否成功 */
  success: boolean;
  /** 处理的元素 */
  element: HTMLElement;
  /** 界面类型 */
  interfaceType: InterfaceType;
}