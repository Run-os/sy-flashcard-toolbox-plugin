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
import { judgeInterfaceType } from './utils';
import { createDebugLogger } from '@/utils/debug';

const debug = createDebugLogger('FlashcardTitle:Scanner');

/**
 * 统一扫描闪卡元素
 * 根据界面类型执行不同的扫描策略
 * @param interfaceType 界面类型
 * @returns 扫描到的闪卡元素数组
 */
export const scanFlashcardElements = (
  interfaceType: InterfaceType
): HTMLElement[] => {

  debug.log(`=============================================  分界线  =============================================`);
  debug.log(`扫描 ${interfaceType} 界面闪卡元素...`);

  let elements: HTMLElement[] = [];

  if (interfaceType === 'editor') {
    // 编辑界面：扫描所有在编辑界面内的闪卡
    const allCards = document.querySelectorAll<HTMLElement>(FLASHCARD_SELECTOR);
    elements = Array.from(allCards).filter(
      (el) => judgeInterfaceType(el) === 'editor'
    );
    debug.log(`编辑界面找到 ${elements.length} 个闪卡`);
  } else if (interfaceType === 'review') {
    // 闪卡界面：仅扫描当前显示的闪卡
    const container = document.querySelector(
      `[${REVIEW_INTERFACE_ATTR}="${REVIEW_INTERFACE_VALUE}"]`
    );
    if (container) {
      elements = Array.from(
        container.querySelectorAll<HTMLElement>('[custom-riff-decks]')
      );
      debug.log(`闪卡界面找到 ${elements.length} 个闪卡`);
    } else {
      debug.log('未找到闪卡界面容器');
    }
  }

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
