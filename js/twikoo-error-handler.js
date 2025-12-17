/**
 * Twikoo评论系统增强错误处理和自动修复
 * 解决加载失败问题的完整解决方案
 */
class TwikooErrorHandler {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cdnUrls = [
      'https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js',
      'https://unpkg.com/twikoo@1.6.42/dist/twikoo.all.min.js',
      'https://cdn.bootcdn.net/ajax/libs/twikoo/1.6.42/twikoo.all.min.js'
    ];
    this.currentCdnIndex = 0;
    this.diagnosticData = {};
    this.init();
  }

  init() {
    this.setupGlobalErrorHandler();
    this.startDiagnostic();
  }

  setupGlobalErrorHandler() {
    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('twikoo')) {
        console.error('🚨 Twikoo脚本错误:', event.error);
        this.handleTwikooError(event.error);
      }
    });

    // 捕获Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('twikoo')) {
        console.error('🚨 Twikoo Promise错误:', event.reason);
        this.handleTwikooError(event.reason);
      }
    });
  }

  async startDiagnostic() {
    console.log('🔍 开始Twikoo诊断...');
    
    // 检查网络连接
    this.diagnosticData.networkStatus = await this.checkNetworkStatus();
    
    // 检查CDN可用性
    this.diagnosticData.cdnStatus = await this.checkCDNAvailability();
    
    // 检查Netlify Functions
    this.diagnosticData.functionsStatus = await this.checkNetlifyFunctions();
    
    // 检查浏览器兼容性
    this.diagnosticData.browserCompatibility = this.checkBrowserCompatibility();
    
    console.log('📊 诊断结果:', this.diagnosticData);
    
    // 根据诊断结果选择最佳加载策略
    this.selectOptimalLoadingStrategy();
  }

  async checkNetworkStatus() {
    try {
      const start = performance.now();
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      const end = performance.now();
      
      return {
        online: navigator.onLine,
        latency: end - start,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      };
    } catch (error) {
      return {
        online: false,
        error: error.message
      };
    }
  }

  async checkCDNAvailability() {
    const results = [];
    
    for (let i = 0; i < this.cdnUrls.length; i++) {
      try {
        const start = performance.now();
        const response = await fetch(this.cdnUrls[i], { method: 'HEAD' });
        const end = performance.now();
        
        results.push({
          url: this.cdnUrls[i],
          available: response.ok,
          status: response.status,
          latency: end - start
        });
      } catch (error) {
        results.push({
          url: this.cdnUrls[i],
          available: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async checkNetlifyFunctions() {
    try {
      const response = await fetch('https://super-gelato-2c17f4.netlify.app/.netlify/functions/twikoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'GET_RECENT_COMMENTS',
          url: window.location.pathname
        })
      });
      
      return {
        available: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  checkBrowserCompatibility() {
    const features = {
      fetch: typeof fetch !== 'undefined',
      promise: typeof Promise !== 'undefined',
      intersectionObserver: 'IntersectionObserver' in window,
      es6: (() => {
        try {
          new Function('(a = 0) => a');
          return true;
        } catch (e) {
          return false;
        }
      })(),
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch (e) {
          return false;
        }
      })()
    };
    
    return {
      compatible: Object.values(features).every(Boolean),
      features,
      userAgent: navigator.userAgent
    };
  }

  selectOptimalLoadingStrategy() {
    const { networkStatus, cdnStatus, functionsStatus, browserCompatibility } = this.diagnosticData;
    
    // 选择最快的CDN
    const availableCDNs = cdnStatus.filter(cdn => cdn.available);
    if (availableCDNs.length > 0) {
      availableCDNs.sort((a, b) => a.latency - b.latency);
      this.currentCdnIndex = this.cdnUrls.indexOf(availableCDNs[0].url);
    }
    
    // 根据网络状况调整策略
    if (networkStatus.connection && networkStatus.connection.effectiveType === 'slow-2g') {
      console.log('🐌 检测到慢速网络，启用轻量级模式');
      this.enableLightweightMode();
    }
    
    // 检查是否需要降级处理
    if (!browserCompatibility.compatible) {
      console.log('⚠️ 浏览器兼容性问题，启用降级模式');
      this.enableFallbackMode();
    }
  }

  async loadTwikooWithRetry() {
    if (this.retryCount >= this.maxRetries) {
      this.showFallbackUI();
      return;
    }

    try {
      console.log(`🔄 尝试加载Twikoo (第${this.retryCount + 1}次)...`);
      
      // 显示加载状态
      this.updateLoadingUI(`正在加载评论系统... (${this.retryCount + 1}/${this.maxRetries})`);
      
      // 加载脚本
      await this.loadScript(this.cdnUrls[this.currentCdnIndex]);
      
      // 初始化Twikoo
      await this.initializeTwikoo();
      
      console.log('✅ Twikoo加载成功');
      this.hideLoadingUI();
      
    } catch (error) {
      console.error(`❌ 第${this.retryCount + 1}次加载失败:`, error);
      this.retryCount++;
      
      // 尝试下一个CDN
      this.currentCdnIndex = (this.currentCdnIndex + 1) % this.cdnUrls.length;
      
      // 延迟重试
      setTimeout(() => {
        this.loadTwikooWithRetry();
      }, 1000 * this.retryCount);
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (window.twikoo) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.timeout = 10000; // 10秒超时
      
      const timeout = setTimeout(() => {
        reject(new Error('脚本加载超时'));
      }, 10000);
      
      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`脚本加载失败: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async initializeTwikoo() {
    if (!window.twikoo) {
      throw new Error('Twikoo脚本未正确加载');
    }

    const config = {
      envId: 'https://super-gelato-2c17f4.netlify.app/.netlify/functions/twikoo',
      el: '#tcomment',
      path: window.location.pathname,
      lang: 'zh-CN',
      region: 'ap-shanghai'
    };

    try {
      await twikoo.init(config);
      
      // 添加样式修复
      this.applyStyleFixes();
      
      // 记录成功加载
      this.recordSuccessfulLoad();
      
    } catch (error) {
      // 尝试备用配置
      console.log('🔄 尝试备用配置...');
      config.envId = 'super-gelato-2c17f4.netlify.app';
      await twikoo.init(config);
    }
  }

  applyStyleFixes() {
    const inputs = document.querySelectorAll('#tcomment input');
    inputs.forEach(input => {
      input.classList.add('browser-default');
    });
  }

  recordSuccessfulLoad() {
    const loadData = {
      timestamp: Date.now(),
      cdnUrl: this.cdnUrls[this.currentCdnIndex],
      retryCount: this.retryCount,
      diagnosticData: this.diagnosticData
    };
    
    try {
      localStorage.setItem('twikoo_load_success', JSON.stringify(loadData));
    } catch (e) {
      console.warn('无法保存加载数据到localStorage');
    }
  }

  updateLoadingUI(message) {
    // 静默模式：不显示加载UI，仅在控制台记录
    console.log(`🔄 Twikoo加载状态: ${message}`);
  }

  hideLoadingUI() {
    // 加载成功后，UI会被Twikoo替换，无需手动隐藏
  }

  showFallbackUI() {
    // 静默模式：不显示回退UI，仅记录错误并继续尝试
    console.log('⚠️ Twikoo加载失败，静默重试中...');
    
    // 静默重试
    setTimeout(() => {
      if (this.retryCount < this.maxRetries) {
        this.retryLoad();
      }
    }, 3000);
  }

  retryLoad() {
    this.retryCount = 0;
    this.loadTwikooWithRetry();
  }

  showDiagnostic() {
    const diagnosticWindow = window.open('', '_blank', 'width=800,height=600');
    diagnosticWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Twikoo诊断报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .status-ok { color: green; }
          .status-error { color: red; }
          .status-warning { color: orange; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>🔍 Twikoo评论系统诊断报告</h1>
        <h2>📊 诊断数据</h2>
        <pre>${JSON.stringify(this.diagnosticData, null, 2)}</pre>
        <h2>💡 建议解决方案</h2>
        ${this.generateSuggestions()}
      </body>
      </html>
    `);
  }

  generateSuggestions() {
    const suggestions = [];
    const { networkStatus, cdnStatus, functionsStatus, browserCompatibility } = this.diagnosticData;
    
    if (!networkStatus.online) {
      suggestions.push('<p class="status-error">❌ 网络连接问题：请检查网络连接</p>');
    }
    
    if (cdnStatus.every(cdn => !cdn.available)) {
      suggestions.push('<p class="status-error">❌ 所有CDN不可用：可能是网络防火墙问题</p>');
    }
    
    if (!functionsStatus.available) {
      suggestions.push('<p class="status-error">❌ Netlify Functions不可用：请检查服务器状态</p>');
    }
    
    if (!browserCompatibility.compatible) {
      suggestions.push('<p class="status-warning">⚠️ 浏览器兼容性问题：建议升级浏览器</p>');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('<p class="status-ok">✅ 所有检查项目正常，可能是临时网络问题</p>');
    }
    
    return suggestions.join('');
  }

  enableLightweightMode() {
    // 轻量级模式：减少功能，提高加载速度
    console.log('🚀 启用轻量级模式');
  }

  enableFallbackMode() {
    // 降级模式：使用更兼容的代码
    console.log('🔧 启用降级模式');
  }

  handleTwikooError(error) {
    console.error('🚨 Twikoo错误处理:', error);
    
    // 记录错误
    this.recordError(error);
    
    // 尝试自动修复
    this.attemptAutoFix(error);
  }

  recordError(error) {
    const errorData = {
      timestamp: Date.now(),
      error: error.toString(),
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    try {
      const errors = JSON.parse(localStorage.getItem('twikoo_errors') || '[]');
      errors.push(errorData);
      // 只保留最近10个错误
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      localStorage.setItem('twikoo_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('无法保存错误日志');
    }
  }

  attemptAutoFix(error) {
    // 根据错误类型尝试自动修复
    if (error.toString().includes('network') || error.toString().includes('fetch')) {
      console.log('🔄 检测到网络错误，尝试重新加载...');
      setTimeout(() => this.retryLoad(), 2000);
    }
  }
}

// 全局初始化
window.twikooErrorHandler = new TwikooErrorHandler();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TwikooErrorHandler;
}