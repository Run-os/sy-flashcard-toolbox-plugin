import {
  Plugin,
  getFrontend,
  Dialog,
  showMessage,
} from "siyuan";
import "@/index.scss";
import PluginInfoString from '@/../plugin.json'
import { destroy, init } from '@/main'
import { setDebugMode, debugLog } from '@/utils/debug'

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  // 插件信息解析错误，不使用调试模式输出
  console.log('Plugin info parse error: ', err)
}
const {
  version,
} = PluginInfo

export default class PluginSample extends Plugin {
  // Run as mobile
  public isMobile: boolean
  // Run in browser
  public isBrowser: boolean
  // Run as local
  public isLocal: boolean
  // Run in Electron
  public isElectron: boolean
  // Run in window
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version
  private configDialog: Dialog | null = null

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    // 初始化调试模式
    await this.initDebugMode()

    debugLog('Plugin loaded, the plugin is ', this)

    init(this)
  }

  /**
   * 初始化调试模式
   * 从插件配置中读取调试模式开关状态
   */
  async initDebugMode() {
    try {
      const config = await this.loadData('config');
      const debugMode = config?.debugMode ?? false;
      setDebugMode(debugMode);
      debugLog('调试模式配置已加载:', debugMode);
    } catch (err) {
      // 配置加载失败时默认关闭调试模式
      setDebugMode(false);
    }
  }

  onunload() {
    destroy()
  }

  /**
   * 打开设置面板
   */
  openSetting(): void {
    // 先销毁已有面板（避免重复打开）
    if (this.configDialog) {
      this.configDialog.destroy();
    }

    // 获取当前配置
    this.loadData('config').then((config) => {
      const debugMode = config?.debugMode ?? false;

      // 创建设置面板
      this.configDialog = new Dialog({
        title: "闪卡工具箱设置",
        width: "500px",
        height: "300px",
        content: `
          <div style="padding: 20px; width: 100%; height: 100%; box-sizing: border-box;">
            <h3 style="margin: 0 0 20px 0;">基础设置</h3>
            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="debugMode" ${debugMode ? "checked" : ""}/>
                <span>调试模式</span>
              </label>
              <div style="color: #666; font-size: 12px; margin-top: 4px; margin-left: 24px;">
                启用后在控制台输出调试日志，方便排查问题
              </div>
            </div>
            <div style="margin-top: 24px;">
              <button id="saveBtn" style="padding: 8px 16px; background: #4096ff; color: white; border: none; border-radius: 4px; cursor: pointer;">保存设置</button>
            </div>
          </div>
        `,
      });

      // 绑定保存按钮事件
      setTimeout(() => {
        const saveBtn = document.getElementById("saveBtn");
        const debugModeCheckbox = document.getElementById("debugMode") as HTMLInputElement;

        if (saveBtn && debugModeCheckbox) {
          saveBtn.onclick = async () => {
            const newDebugMode = debugModeCheckbox.checked;
            
            // 保存配置
            await this.saveData('config', {
              ...config,
              debugMode: newDebugMode,
            });

            // 更新调试模式状态
            setDebugMode(newDebugMode);

            // 提示保存成功
            this.showMsg("设置保存成功");

            // 关闭面板
            this.configDialog?.destroy();
          };
        }
      }, 100);
    }).catch((err) => {
      debugLog('加载配置失败:', err);
    });
  }

  /**
   * 显示提示消息
   */
  private showMsg(text: string) {
    showMessage(text, 2000, "info");
  }
}
