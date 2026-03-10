/**
 * 闪卡标题编辑器 - 统一扫描模块
 * 提供统一的闪卡元素扫描功能
 */

import type { InterfaceType } from './types';
import {
  FLASHCARD_SELECTOR,
  REVIEW_INTERFACE_ATTR,
  REVIEW_INTERFACE_VALUE
} from './constants';
import { createDebugLogger } from '@/utils/debug';

const debug = createDebugLogger('FlashcardTitle:Scanner');

/**
 * 统一扫描闪卡元素
 * 无论在哪个界面，扫描所有带 custom-riff-decks 属性的元素
 * @param interfaceType 界面类型（仅用于日志）
 * @returns 扫描到的闪卡元素数组
 */
export const scanFlashcardElements = (
  interfaceType: InterfaceType
): HTMLElement[] => {

  debug.log(`=============================================  分界线  =============================================`);
  debug.log(`扫描 ${interfaceType} 界面闪卡元素...`);

  // 统一扫描所有带 custom-riff-decks 属性的元素
  const allCards = document.querySelectorAll<HTMLElement>(FLASHCARD_SELECTOR);
  const elements = Array.from(allCards);

  debug.log(`找到 ${elements.length} 个闪卡`);
  return elements;
};

/**
 * 检查闪卡界面是否打开
 * 通过检查容器存在且无 fn__none 类判断
 * @returns 闪卡界面是否打开
 */
export const isReviewInterfaceOpen = (): boolean => {
  return !!document.querySelector(
    `[${REVIEW_INTERFACE_ATTR}="${REVIEW_INTERFACE_VALUE}"]:not(.fn__none)`
  );
};
