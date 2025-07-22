/**
 * 浏览器端错误处理和监控系统
 * 这个文件应该放在主题的js目录中，在浏览器端运行
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.performance = {};
    this.init();
  }

  init() {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined') return;

    // 全局错误捕获
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'JavaScript Error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Promise 错误捕获
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.logError({
          type: 'Resource Load Error',
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: new Date().toISOString()
        });
      }
    }, true);
  }

  logError(error) {
    this.errors.push(error);
    console.error('Error logged:', error);
    
    // 发送到分析服务（可选）
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  // 性能监控
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.performance[name] = {
      duration: end - start,
      timestamp: new Date().toISOString()
    };
    
    return result;
  }

  // 获取错误报告
  getErrorReport() {
    return {
      errors: this.errors,
      performance: this.performance,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
}

// 在浏览器环境中初始化
if (typeof window !== 'undefined') {
  window.ErrorHandler = new ErrorHandler();
}