/**
 * 闪卡标题编辑器 - 主入口
 * 统一管理编辑界面和闪卡界面的监听与处理
 */

import { Dialog } from 'siyuan';
import type { InterfaceType } from './types';
import {
  TIP_BLOCK_ID_MISSING,
  DIALOG_TITLE,
  SAVE_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TIP_SAVE_SUCCESS,
  TIP_SAVE_FAILED,
  FLASHCARD_TITLE_ATTR
} from './constants';
import {
  isMobileEnv,
  showSiyuanMsg,
  filterInvalidChars
} from './utils';
import { getBlockAttrs, setBlockAttrs } from '../../api';
import { createDebugLogger } from '@/utils/debug';
import {
  initCommonObserver,
  shouldScanFromMutations
} from './observer';
import { scanFlashcardElements, isReviewInterfaceOpen } from './scanner';
import {
  handleFlashcardTitle,
  cleanupProcessedElements,
  unmarkElementProcessed
} from './handler';

// 使用带前缀的调试日志器
const debug = createDebugLogger('FlashcardTitle');

// 监听器实例
let editorObserver: MutationObserver | null = null;
let reviewObserver: MutationObserver | null = null;
let currentDialog: Dialog | null = null;
let isDialogOpening = false; // 防止重复打开对话框的标志
let isEditButtonListenerSetup = false; // 防止重复注册事件监听器

// 保存事件处理函数的引用，用于移除监听器
const editButtonHandler = ((e: Event) => {
  const customEvent = e as CustomEvent<{ blockId: string }>;
  debug.log('收到 flashcard-title-edit 事件', customEvent.detail);
  const { blockId } = customEvent.detail;
  openEditDialog(blockId);
}) as EventListener;

/**
 * 插件初始化入口
 */
export const init = (plugin: any) => {
  setTimeout(() => {
    // 初始化编辑界面监听
    editorObserver = initCommonObserver(
      {
        interfaceType: 'editor',
        attributeFilter: ['custom-riff-decks', 'data-node-id', 'custom-riff-title']
      },
      handleMutationCallback
    );

    // 初始化闪卡界面监听
    reviewObserver = initCommonObserver(
      {
        interfaceType: 'review',
        attributeFilter: ['custom-riff-title', 'class']
      },
      handleMutationCallback
    );

    // 首次扫描
    performInitialScan();

    // 监听编辑按钮点击事件
    setupEditButtonListener();
  }, 1000);

  if (plugin && typeof plugin.onunload === 'function') {
    plugin.onunload(() => cleanup());
  }
};

/**
 * 统一的 Mutation 回调处理
 */
const handleMutationCallback = (
  mutations: MutationRecord[],
  interfaceType: InterfaceType
) => {
  const { shouldScan, shouldScanTitle } = shouldScanFromMutations(
    mutations,
    interfaceType
  );

  if (shouldScan || shouldScanTitle) {
    const elements = scanFlashcardElements(interfaceType);
    elements.forEach((el) => {
      // 闪卡界面：如果标题属性变化，先移除已处理标记
      if (interfaceType === 'review') {
        for (const mutation of mutations) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'custom-riff-title' &&
            mutation.target === el
          ) {
            unmarkElementProcessed(el);
            break;
          }
        }
      }
      handleFlashcardTitle(interfaceType, el);
    });
  }
};

/**
 * 执行首次扫描
 */
const performInitialScan = () => {
  debug.log('执行首次扫描');

  // 扫描编辑界面
  const editorElements = scanFlashcardElements('editor');
  editorElements.forEach((el) => handleFlashcardTitle('editor', el));

  // 扫描闪卡界面（如果已打开)
  if (isReviewInterfaceOpen()) {
    const reviewElements = scanFlashcardElements('review');
    reviewElements.forEach((el) => handleFlashcardTitle('review', el));
  }
};

/**
 * 设置编辑按钮点击监听
 */
const setupEditButtonListener = () => {
  // 防止重复注册事件监听器
  if (isEditButtonListenerSetup) {
    debug.log('事件监听器已注册，跳过');
    return;
  }

  document.addEventListener('flashcard-title-edit', editButtonHandler);
  isEditButtonListenerSetup = true;
  debug.log('事件监听器注册成功');
};

/**
 * 打开编辑对话框
 */
const openEditDialog = async (blockId: string) => {
  if (!blockId) {
    showSiyuanMsg(TIP_BLOCK_ID_MISSING, 'error');
    return;
  }

  // 防止重复点击:如果正在打开对话框，直接返回
  if (isDialogOpening) {
    debug.log('对话框正在打开中,忽略重复点击');
    return;
  }
  isDialogOpening = true;

  // 关闭当前对话框（如果存在）
  if (currentDialog) {
    try {
      currentDialog.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    currentDialog = null;
  }

  // 移除页面上所有残留的 b3-dialog--open 元素
  const existingDialogs = document.querySelectorAll('.b3-dialog--open');
  debug.log(`发现 ${existingDialogs.length} 个残留对话框`);
  existingDialogs.forEach((dialog) => {
    dialog.remove();
  });

  let inputTitle = '';

  try {
    const attrs = await getBlockAttrs(blockId);
    inputTitle = attrs[FLASHCARD_TITLE_ATTR] || '';
  } catch (error) {
    showSiyuanMsg('加载标题失败', 'error');
    isDialogOpening = false; // 重置标志
    return;
  }

  const isMobile = isMobileEnv();

  currentDialog = new Dialog({
    title: DIALOG_TITLE,
    content: `
      <div class="b3-dialog__content" style="padding: 24px;">
        <input
          id="ft-editor-title-input"
          type="text"
          class="b3-text-field fn__block"
          placeholder="请输入闪卡标题"
          value="${inputTitle.replace(/"/g, '"')}"
          style="width: 100%; padding: 8px 12px;"
        />
      </div>
      <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="ft-editor-cancel-btn">${CANCEL_BUTTON_TEXT}</button>
        <button class="b3-button b3-button--text" id="ft-editor-save-btn">${SAVE_BUTTON_TEXT}</button>
      </div>
    `,
    width: isMobile ? '90vw' : '400px',
    destroyCallback: () => {
      currentDialog = null;
      isDialogOpening = false; // 重置标志
    }
  });

  // 对话框创建成功，重置标志
  isDialogOpening = false;

  const inputEl = currentDialog.element.querySelector(
    '#ft-editor-title-input'
  ) as HTMLInputElement;
  const cancelBtn = currentDialog.element.querySelector('#ft-editor-cancel-btn');
  const saveBtn = currentDialog.element.querySelector('#ft-editor-save-btn');

  const handleSave = async () => {
    const title = filterInvalidChars(inputEl.value);

    try {
      await setBlockAttrs(blockId, { [FLASHCARD_TITLE_ATTR]: title });
      showSiyuanMsg(TIP_SAVE_SUCCESS, 'success');
      currentDialog?.destroy();
      currentDialog = null;
    } catch (error) {
      showSiyuanMsg(TIP_SAVE_FAILED, 'error');
    }
  };

  const handleCancel = () => {
    currentDialog?.destroy();
    currentDialog = null;
  };

  inputEl?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSave();
  });

  cancelBtn?.addEventListener('click', handleCancel);
  saveBtn?.addEventListener('click', handleSave);

  inputEl?.focus();
};

/**
 * 清理函数
 */
export const cleanup = () => {
  editorObserver?.disconnect();
  editorObserver = null;

  reviewObserver?.disconnect();
  reviewObserver = null;

  if (currentDialog) {
    currentDialog.destroy();
    currentDialog = null;
  }

  // 清理所有处理痕迹
  cleanupProcessedElements();

  // 移除事件监听器（使用正确的引用)
  if (isEditButtonListenerSetup) {
    document.removeEventListener('flashcard-title-edit', editButtonHandler);
    isEditButtonListenerSetup = false;
  }

  // 重置对话框状态标志
  isDialogOpening = false;
};
