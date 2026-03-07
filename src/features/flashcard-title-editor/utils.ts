import {
  BLOCK_ID_ATTRS,
  DEBOUNCE_DELAY,
  MSG_TIMEOUT,
  HEADING_TYPE,
  REVIEW_INTERFACE_ATTR,
  REVIEW_INTERFACE_VALUE,
  EDITOR_INTERFACE_ATTR,
  EDITOR_INTERFACE_VALUE,
  INTERFACE_TYPE
} from './constants';
import type { InterfaceType } from './types';
import { pushMsg, pushErrMsg } from '../../api';

export const debounce = (fn: Function, delay = DEBOUNCE_DELAY) => {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

export const getBlockIdFromCard = (cardElement: HTMLElement): string | null => {
  for (const attr of BLOCK_ID_ATTRS) {
    const id = (cardElement as any).dataset[attr];
    if (id) return id;
  }
  const blockNode = cardElement.closest('.protyle-wysiwyg__block');
  return blockNode ? (blockNode as any).dataset.blockId || null : null;
};

export const isMobileEnv = (): boolean => {
  return /Mobile|Android|iOS|iPad/.test(navigator.userAgent);
};

export const showSiyuanMsg = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (type === 'error') {
    pushErrMsg(msg, MSG_TIMEOUT);
  } else {
    pushMsg(msg, MSG_TIMEOUT);
  }
};

export const filterInvalidChars = (str: string): string => {
  return str.trim();
};

// ========== 闪卡界面标题替换工具函数 ==========

/**
 * 检测元素是否为标题元素
 * @param element 待检测元素
 * @returns 是否为标题元素
 */
export const isHeadingElement = (element: HTMLElement | Element): boolean => {
  return element.getAttribute('data-type') === HEADING_TYPE;
};

/**
 * 获取标题文本元素
 * 注意：标题被锁定时 contenteditable 为 false，所以需要同时匹配 true 和 false
 * @param headingElement 标题元素
 * @returns 标题文本 div 元素
 */
export const getHeadingTextElement = (headingElement: HTMLElement | Element): HTMLElement | null => {
  // 先尝试匹配 contenteditable="true"（未锁定状态）
  let textElement = headingElement.querySelector<HTMLElement>('div[contenteditable="true"]');
  if (textElement) return textElement;
  
  // 再尝试匹配 contenteditable="false"（锁定状态）
  textElement = headingElement.querySelector<HTMLElement>('div[contenteditable="false"]');
  return textElement;
};

/**
 * 获取闪卡的自定义标题
 * @param cardElement 闪卡元素
 * @returns 自定义标题或 null
 */
export const getCustomTitle = (cardElement: HTMLElement): string | null => {
  const title = cardElement.getAttribute('custom-riff-title');
  return title && title.trim() ? title.trim() : null;
};

// ========== 界面判断工具函数 ==========

/**
 * 判断闪卡元素是否在闪卡界面中
 * 通过检查父级元素是否具有 data-key="dialog-opencard" 属性
 * @param cardElement 闪卡元素
 * @returns 是否在闪卡界面中
 */
export const isInReviewInterface = (cardElement: HTMLElement): boolean => {
  // 向上查找父级元素，检查是否存在闪卡界面标识
  let parent = cardElement.parentElement;
  while (parent) {
    if (parent.getAttribute(REVIEW_INTERFACE_ATTR) === REVIEW_INTERFACE_VALUE) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};

/**
 * 判断闪卡元素是否在编辑器界面中
 * 通过检查父级元素是否具有 data-loading="finished" 属性
 * @param cardElement 闪卡元素
 * @returns 是否在编辑器界面中
 */
export const isInEditorInterface = (cardElement: HTMLElement): boolean => {
  // 向上查找父级元素，检查是否存在编辑器界面标识
  let parent = cardElement.parentElement;
  while (parent) {
    if (parent.getAttribute(EDITOR_INTERFACE_ATTR) === EDITOR_INTERFACE_VALUE) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};

// ========== 统一界面判断函数 ==========

/**
 * 获取界面容器
 * @returns layout-tab-container 元素
 */
const getLayoutContainer = (): HTMLElement | null => {
  return document.querySelector('.layout-tab-container.fn__flex-1');
};

/**
 * 判断当前打开的界面类型
 * 基于 layout-tab-container 子元素的 class 特征判断
 * @returns 界面类型
 */
export const getCurrentOpenInterface = (): InterfaceType => {
  const container = getLayoutContainer();
  if (!container) return 'other';

  // 查找打开的编辑界面（有 protyle 类，无 fn__none 类）
  const openEditor = container.querySelector(':scope > .protyle:not(.fn__none)');
  if (openEditor) return 'editor';

  // 查找打开的闪卡界面（有 data-key="dialog-opencard"，无 fn__none 类）
  const openReview = container.querySelector(':scope > [data-key="dialog-opencard"]:not(.fn__none)');
  if (openReview) return 'review';

  return 'other';
};

/**
 * 统一判断元素所属界面类型
 * 先通过 protyle 类区分「编辑/闪卡」界面类型，再通过 fn__none 类判断「打开/未打开」状态
 * @param element 待判断元素
 * @returns 界面类型
 */
export const judgeInterfaceType = (element: HTMLElement): InterfaceType => {
  let parent = element.parentElement;
  while (parent) {
    // 检查是否在闪卡界面容器内（data-key="dialog-opencard" 且无 protyle 类）
    if (parent.getAttribute(REVIEW_INTERFACE_ATTR) === REVIEW_INTERFACE_VALUE) {
      // 确认该容器是否打开（无 fn__none 类）
      if (!parent.classList.contains('fn__none')) {
        return INTERFACE_TYPE.REVIEW as InterfaceType;
      }
    }
    // 检查是否在编辑界面容器内（有 protyle 类）
    if (parent.classList.contains('protyle')) {
      // 确认该容器是否打开（无 fn__none 类）
      if (!parent.classList.contains('fn__none')) {
        return INTERFACE_TYPE.EDITOR as InterfaceType;
      }
    }
    parent = parent.parentElement;
  }
  return INTERFACE_TYPE.OTHER as InterfaceType;
};
