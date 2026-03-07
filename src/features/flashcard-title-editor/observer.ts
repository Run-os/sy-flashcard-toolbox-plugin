/**
 * 闪卡标题编辑器 - 统一监听器模块
 * 提供统一的 MutationObserver 初始化和管理
 */

import type { InterfaceType, ObserverConfig } from './types';
import {
  REVIEW_INTERFACE_ATTR,
  REVIEW_INTERFACE_VALUE,
} from './constants';
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
 * 检查元素是否在指定界面内（且界面已打开）
 * 通过 protyle 类区分界面类型，通过 fn__none 类判断打开状态
 * @param element 待检查元素
 * @param interfaceType 目标界面类型
 * @returns 是否在目标界面内且界面已打开
 */
const isElementInTargetInterface = (
  element: HTMLElement | Element,
  interfaceType: InterfaceType
): boolean => {
  let parent = element.parentElement;
  while (parent) {
    if (interfaceType === 'review') {
      // 闪卡界面：有 data-key="dialog-opencard" 属性
      if (parent.getAttribute(REVIEW_INTERFACE_ATTR) === REVIEW_INTERFACE_VALUE) {
        // 检查是否打开（无 fn__none 类）
        return !parent.classList.contains('fn__none');
      }
    } else if (interfaceType === 'editor') {
      // 编辑界面：有 protyle 类
      if (parent.classList.contains('protyle')) {
        // 检查是否打开（无 fn__none 类）
        return !parent.classList.contains('fn__none');
      }
    }
    parent = parent.parentElement;
  }
  return false;
};

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
 * 在开头提前过滤不相关界面的变化，避免无效处理
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

    // ========== 提前过滤：检查变化是否在目标界面内 ==========
    // 对于属性变化，检查 target 是否在目标界面
    if (mutation.type === 'attributes') {
      if (!isElementInTargetInterface(target, interfaceType)) {
        continue; // 跳过不在目标界面内的属性变化
      }
    }
    // 对于子节点变化，检查父节点是否在目标界面
    if (mutation.type === 'childList') {
      if (!isElementInTargetInterface(target, interfaceType)) {
        continue; // 跳过不在目标界面内的子节点变化
      }
    }

    // ========== 以下是具体的业务逻辑判断 ==========

    // 处理子节点变化
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          // 编辑界面：检查是否是编辑器相关元素
          if (interfaceType === 'editor') {
            if (
              node.classList?.contains('protyle-wysiwyg') ||
              node.querySelector?.('.protyle-wysiwyg') ||
              node.hasAttribute?.('custom-riff-decks')
            ) {
              shouldScan = true;
              shouldScanTitle = true;
              break;
            }
          }
          // 闪卡界面：检查是否是闪卡元素
          if (interfaceType === 'review') {
            if (node.hasAttribute?.('custom-riff-decks')) {
              shouldScan = true;
              shouldScanTitle = true;
              break;
            }
            const cardElement = node.querySelector?.('[custom-riff-decks]');
            if (cardElement) {
              shouldScan = true;
              shouldScanTitle = true;
              break;
            }
          }
        }
      }
    }

    // 处理属性变化
    if (mutation.type === 'attributes') {
      // 编辑界面属性变化
      if (interfaceType === 'editor') {
        if (
          mutation.attributeName === 'custom-riff-decks' ||
          mutation.attributeName === 'data-node-id'
        ) {
          shouldScan = true;
          shouldScanTitle = true;
        }
        if (mutation.attributeName === 'custom-riff-title') {
          shouldScanTitle = true;
        }
      }

      // 闪卡界面属性变化
      if (interfaceType === 'review') {
        // 处理标签切换（class 属性变化）
        if (mutation.attributeName === 'class') {
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
        // 处理标题属性变化
        if (mutation.attributeName === 'custom-riff-title') {
          if (target.hasAttribute?.('custom-riff-decks')) {
            shouldScanTitle = true;
          }
        }
      }
    }

    if (shouldScan && shouldScanTitle) break;
  }

  return { shouldScan, shouldScanTitle };
};
