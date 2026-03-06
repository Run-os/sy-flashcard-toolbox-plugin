import { Dialog } from 'siyuan';
import {
  EDIT_BUTTON_CLASS,
  EDIT_BUTTON_ICON,
  EDIT_BUTTON_TOOLTIP,
  TIP_BLOCK_ID_MISSING,
  EDITOR_FLASHCARD_SELECTOR,
  DIALOG_TITLE,
  SAVE_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TIP_TITLE_EMPTY,
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

let observer: MutationObserver | null = null;
let editorObserver: MutationObserver | null = null;
let currentDialog: Dialog | null = null;

export const init = (plugin: any) => {
  setTimeout(() => {
    initMutationObserver();
    scanEditorFlashcards();
  }, 1000);
  
  if (plugin && typeof plugin.onunload === 'function') {
    plugin.onunload(() => cleanup());
  }
};

const initMutationObserver = () => {
  // 监听整个 body，捕获所有编辑器视图的变化
  editorObserver = new MutationObserver((mutations) => {
    // 检查是否有新的 protyle-wysiwyg 元素出现
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // 检查是否是编辑器相关元素
            if (node.classList?.contains('protyle-wysiwyg') || 
                node.querySelector?.('.protyle-wysiwyg') ||
                node.hasAttribute?.('custom-riff-decks')) {
              shouldScan = true;
              break;
            }
          }
        }
      }
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'custom-riff-decks' || 
           mutation.attributeName === 'data-node-id')) {
        shouldScan = true;
      }
      if (shouldScan) break;
    }
    if (shouldScan) {
      scanEditorFlashcards();
    }
  });

  // 监听整个文档
  editorObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['custom-riff-decks', 'data-node-id']
  });

  // 立即扫描一次
  scanEditorFlashcards();
};

const scanEditorFlashcards = () => {
  const cardElements = document.querySelectorAll<HTMLElement>(EDITOR_FLASHCARD_SELECTOR);
  
  cardElements.forEach((cardElement) => {
    const blockId = cardElement.getAttribute('data-node-id');
    if (!blockId) return;

    // 找到闪卡的最后一个 .protyle-attr（控制栏在这里）
    const allProtyleAttrs = cardElement.querySelectorAll<HTMLElement>(':scope > .protyle-attr');
    if (allProtyleAttrs.length === 0) return;
    
    const protyleAttr = allProtyleAttrs[allProtyleAttrs.length - 1];
    
    // 检查按钮是否已存在
    if (protyleAttr.querySelector(`.${EDIT_BUTTON_CLASS}`)) return;

    // 创建按钮（使用思源的 protyle-attr__btn 样式）
    const editButton = createEditButton(blockId);
    protyleAttr.appendChild(editButton);
  });
};

const createEditButton = (blockId: string): HTMLElement => {
  const button = document.createElement('button');
  button.className = `svelte-5zv9mq ${EDIT_BUTTON_CLASS}`;
  button.textContent = '✍️';
  button.title = EDIT_BUTTON_TOOLTIP;

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditDialog(blockId);
  });

  return button;
};

const openEditDialog = async (blockId: string) => {
  if (!blockId) {
    showSiyuanMsg(TIP_BLOCK_ID_MISSING, 'error');
    return;
  }

  if (currentDialog) {
    currentDialog.destroy();
    currentDialog = null;
  }

  let inputTitle = '';
  
  try {
    const attrs = await getBlockAttrs(blockId);
    inputTitle = attrs[FLASHCARD_TITLE_ATTR] || '';
  } catch (error) {
    showSiyuanMsg('加载标题失败', 'error');
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
          value="${inputTitle.replace(/"/g, '&quot;')}"
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
    }
  });

  const inputEl = currentDialog.element.querySelector('#ft-editor-title-input') as HTMLInputElement;
  const cancelBtn = currentDialog.element.querySelector('#ft-editor-cancel-btn');
  const saveBtn = currentDialog.element.querySelector('#ft-editor-save-btn');

  const handleSave = async () => {
    const title = filterInvalidChars(inputEl.value);
    if (!title) {
      showSiyuanMsg(TIP_TITLE_EMPTY, 'error');
      return;
    }

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

export const cleanup = () => {
  observer?.disconnect();
  observer = null;

  editorObserver?.disconnect();
  editorObserver = null;

  if (currentDialog) {
    currentDialog.destroy();
    currentDialog = null;
  }

  document.querySelectorAll(`.${EDIT_BUTTON_CLASS}`).forEach((btn) => btn.remove());
};
