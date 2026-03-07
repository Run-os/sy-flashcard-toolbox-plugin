import {
  Plugin,
} from "siyuan";
import { createApp } from 'vue'
import App from './App.vue'
import { init as initFlashcardTitleEditor, cleanup as cleanupFlashcardTitleEditor } from './features/flashcard-title-editor/index';
import { debugLog, debugError } from '@/utils/debug';

let plugin = null
export function usePlugin(pluginProps?: Plugin): Plugin {
  //debugLog('usePlugin', pluginProps, plugin)
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    debugError('need bind plugin')
  }
  return plugin;
}


let app = null;
let appDiv: HTMLDivElement | null = null;

export function init(plugin: Plugin) {
  // bind plugin hook
  usePlugin(plugin);

  appDiv = document.createElement('div');
  appDiv.classList.add('sy-flashcard-toolbox-plugin-app');
  appDiv.id = 'sy-flashcard-toolbox-plugin-app';
  app = createApp(App);
  app.mount(appDiv);
  document.body.appendChild(appDiv);

  // 初始化闪卡标题编辑器功能
  initFlashcardTitleEditor(plugin);
}

export function destroy() {
  // 清理闪卡标题编辑器资源
  cleanupFlashcardTitleEditor();

  // 清理 Vue 应用
  if (app) {
    app.unmount();
    app = null;
  }

  // 移除 DOM 元素
  if (appDiv && appDiv.parentNode) {
    appDiv.parentNode.removeChild(appDiv);
    appDiv = null;
  }
}
