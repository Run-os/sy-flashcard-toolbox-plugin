import { BLOCK_ID_ATTRS, DEBOUNCE_DELAY, MSG_TIMEOUT } from './constants';
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
  return str.trim().replace(/[<>\/\\:"*?|]/g, '');
};
