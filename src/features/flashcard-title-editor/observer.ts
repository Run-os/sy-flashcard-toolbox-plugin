/**
 * 闪卡标题编辑器 - 统一监听器模块
 * 提供统一的 MutationObserver 初始化和管理
 */

import type { InterfaceType, ObserverConfig } from './types';
import { createDebugLogger } from '@/utils/debug';

const debug = createDebugLogger('FlashcardTitle:Observer');

/**
 * 统一的 MutationObserver 回调类型
 */
export type MutationCallback = (
  mutations: MutationRecord[],
  interfaceType: InterfaceType
) => void;

/**
 * 初始化统一的 MutationObserver
 * @param config 监听器配置
 * @param callback 变化回调函数
 * @returns MutationObserver 实例
 */
export const initCommonObserver = (
  config: ObserverConfig,
  callback: MutationCallback
): MutationObserver => {
  debug.log(`初始化 ${config.interfaceType} 界面监听器`);

  const observer = new MutationObserver((mutations) => {
    callback(mutations, config.interfaceType);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: config.attributeFilter
  });

  return observer;
};

/**
 * 判断是否需要从 mutations 触发扫描
 * 简化逻辑：只要有 custom-riff-decks 相关变化就触发扫描
 * @param mutations MutationRecord 数组
 * @param interfaceType 界面类型
 * @returns 是否需要扫描
 */
export const shouldScanFromMutations = (
  mutations: MutationRecord[],
  interfaceType: InterfaceType
): { shouldScan: boolean; shouldScanTitle: boolean } => {
  let shouldScan = false;
  let shouldScanTitle = false;

  for (const mutation of mutations) {
    const target = mutation.target as HTMLElement;

    // 处理子节点变化
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          // 检查是否是闪卡元素或包含闪卡元素
          if (
            node.hasAttribute?.('custom-riff-decks') ||
            node.querySelector?.('[custom-riff-decks]') ||
            node.classList?.contains('protyle-wysiwyg')
          ) {
            shouldScan = true;
            shouldScanTitle = true;
            break;
          }
        }
      }
    }

    // 处理属性变化
    if (mutation.type === 'attributes') {
      // custom-riff-decks 或 data-node-id 变化时触发扫描
      if (
        mutation.attributeName === 'custom-riff-decks' ||
        mutation.attributeName === 'data-node-id'
      ) {
        shouldScan = true;
        shouldScanTitle = true;
      }
      // custom-riff-title 变化时仅更新标题
      if (mutation.attributeName === 'custom-riff-title') {
        shouldScanTitle = true;
      }

      // 闪卡界面：处理标签切换（class 属性变化）
      if (interfaceType === 'review' && mutation.attributeName === 'class') {
        if (
          target.classList?.contains('item') &&
          target.hasAttribute?.('data-type') &&
          target.getAttribute('data-type') === 'tab-header' &&
          target.classList.contains('item--focus')
        ) {
          debug.log('检测到标签切换到:', target.getAttribute('aria-label'));
          shouldScan = true;
          shouldScanTitle = true;
        }
      }
    }

    if (shouldScan && shouldScanTitle) break;
  }

  return { shouldScan, shouldScanTitle };
};
