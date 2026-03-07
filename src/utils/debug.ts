/**
 * 调试模式工具模块
 * 提供可控的日志输出功能，只有在调试模式开启时才输出日志
 */

/** 调试模式开关状态 */
let debugModeEnabled = false;

/** 调试日志前缀 */
const DEBUG_PREFIX = '[闪卡工具箱]';

/**
 * 设置调试模式开关
 * @param enabled 是否启用调试模式
 */
export function setDebugMode(enabled: boolean): void {
  debugModeEnabled = enabled;
  if (enabled) {
    console.log(DEBUG_PREFIX, '✅调试模式已启用');
  }
}

/**
 * 获取调试模式状态
 * @returns 是否启用调试模式
 */
export function isDebugMode(): boolean {
  return debugModeEnabled;
}

/**
 * 调试日志输出，只有在调试模式开启时才会输出
 * @param args 要输出的内容
 */
export function debugLog(...args: any[]): void {
  if (debugModeEnabled) {
    console.log(DEBUG_PREFIX, ...args);
  }
}

/**
 * 调试信息输出，只有在调试模式开启时才会输出
 * @param args 要输出的内容
 */
export function debugInfo(...args: any[]): void {
  if (debugModeEnabled) {
    console.info(DEBUG_PREFIX, ...args);
  }
}

/**
 * 调试警告输出，只有在调试模式开启时才会输出
 * @param args 要输出的内容
 */
export function debugWarn(...args: any[]): void {
  if (debugModeEnabled) {
    console.warn(DEBUG_PREFIX, ...args);
  }
}

/**
 * 调试错误输出，只有在调试模式开启时才会输出
 * @param args 要输出的内容
 */
export function debugError(...args: any[]): void {
  if (debugModeEnabled) {
    console.error(DEBUG_PREFIX, ...args);
  }
}

/**
 * 创建带自定义前缀的调试日志函数
 * @param prefix 自定义前缀
 * @returns 调试日志函数
 */
export function createDebugLogger(prefix: string) {
  return {
    log: (...args: any[]) => debugLog(`[${prefix}]`, ...args),
    info: (...args: any[]) => debugInfo(`[${prefix}]`, ...args),
    warn: (...args: any[]) => debugWarn(`[${prefix}]`, ...args),
    error: (...args: any[]) => debugError(`[${prefix}]`, ...args),
  };
}