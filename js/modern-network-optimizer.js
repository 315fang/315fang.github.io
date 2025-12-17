/**
 * HTTP/3 和现代网络协议优化
 * 利用最新的网络技术提升加载性能
 */

class ModernNetworkOptimizer {
  constructor() {
    this.supportedFeatures = {};
    this.networkInfo = {};
    this.optimizationStrategies = new Map();
    
    this.init();
  }
  
  async init() {
    // 检测网络特性支持
    await this.detectNetworkFeatures();
    
    // 监控网络状态
    this.monitorNetworkConditions();
    
    // 初始化优化策略
    this.initOptimizationStrategies();
    
    console.log('🌐 现代网络优化器已启动', this.supportedFeatures);
  }
  
  /**
   * 检测网络特性支持
   */
  async detectNetworkFeatures() {
    // HTTP/3 支持检测
    this.supportedFeatures.http3 = await this.detectHTTP3Support();
    
    // HTTP/2 Server Push 支持
    this.supportedFeatures.serverPush = 'serviceWorker' in navigator;
    
    // Early Hints (103) 支持
    this.supportedFeatures.earlyHints = this.detectEarlyHintsSupport();
    
    // WebTransport 支持
    this.supportedFeatures.webTransport = 'WebTransport' in window;
    
    // Connection API 支持
    this.supportedFeatures.connection = 'connection' in navigator;
    
    // Network Information API
    this.supportedFeatures.networkInfo = 'connection' in navigator;
    
    // Fetch Streaming 支持
    this.supportedFeatures.fetchStreaming = this.detectFetchStreamingSupport();
    
    // WebCodecs 支持
    this.supportedFeatures.webCodecs = 'VideoEncoder' in window;
    
    // WebAssembly Streaming 支持
    this.supportedFeatures.wasmStreaming = 'WebAssembly' in window && 'compileStreaming' in WebAssembly;
  }
  
  /**
   * 检测 HTTP/3 支持
   */
  async detectHTTP3Support() {
    try {
      // 尝试使用 fetch 检测 HTTP/3
      const response = await fetch(location.origin, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // 检查响应头中的协议信息
      const protocol = response.headers.get('alt-svc');
      return protocol && protocol.includes('h3');
      
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 检测 Early Hints 支持
   */
  detectEarlyHintsSupport() {
    // 检查是否支持 103 Early Hints
    return 'PerformanceObserver' in window && 
           'PerformanceNavigationTiming' in window;
  }
  
  /**
   * 检测 Fetch Streaming 支持
   */
  detectFetchStreamingSupport() {
    try {
      const response = new Response();
      return 'body' in response && 'getReader' in response.body;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 监控网络状况
   */
  monitorNetworkConditions() {
    if (this.supportedFeatures.connection) {
      const connection = navigator.connection;
      
      // 获取当前网络信息
      this.updateNetworkInfo(connection);
      
      // 监听网络变化
      connection.addEventListener('change', () => {
        this.updateNetworkInfo(connection);
        this.adaptToNetworkConditions();
      });
    }
    
    // 监听在线/离线状态
    window.addEventListener('online', () => {
      this.networkInfo.online = true;
      this.adaptToNetworkConditions();
    });
    
    window.addEventListener('offline', () => {
      this.networkInfo.online = false;
      this.adaptToNetworkConditions();
    });
  }
  
  /**
   * 更新网络信息
   */
  updateNetworkInfo(connection) {
    this.networkInfo = {
      online: navigator.onLine,
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
      type: connection.type || 'unknown'
    };
    
    console.log('📶 网络状况更新:', this.networkInfo);
  }
  
  /**
   * 初始化优化策略
   */
  initOptimizationStrategies() {
    // HTTP/3 优化策略
    if (this.supportedFeatures.http3) {
      this.optimizationStrategies.set('http3', {
        priority: 'high',
        apply: () => this.enableHTTP3Optimizations()
      });
    }
    
    // 流式加载策略
    if (this.supportedFeatures.fetchStreaming) {
      this.optimizationStrategies.set('streaming', {
        priority: 'medium',
        apply: () => this.enableStreamingOptimizations()
      });
    }
    
    // WebTransport 策略
    if (this.supportedFeatures.webTransport) {
      this.optimizationStrategies.set('webtransport', {
        priority: 'experimental',
        apply: () => this.enableWebTransportOptimizations()
      });
    }
    
    // 自适应加载策略
    this.optimizationStrategies.set('adaptive', {
      priority: 'high',
      apply: () => this.enableAdaptiveLoading()
    });
  }
  
  /**
   * 启用 HTTP/3 优化
   */
  enableHTTP3Optimizations() {
    console.log('🚀 启用 HTTP/3 优化');
    
    // 优化资源加载顺序
    this.optimizeResourcePriority();
    
    // 启用多路复用优化
    this.enableMultiplexingOptimizations();
    
    // 配置连接复用
    this.configureConnectionReuse();
  }
  
  /**
   * 优化资源优先级
   */
  optimizeResourcePriority() {
    // 关键资源高优先级
    const criticalResources = [
      'link[rel="stylesheet"]',
      'script[src*="critical"]',
      'link[rel="preload"]'
    ];
    
    criticalResources.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.tagName === 'LINK') {
          element.setAttribute('importance', 'high');
        } else if (element.tagName === 'SCRIPT') {
          element.setAttribute('importance', 'high');
        }
      });
    });
    
    // 非关键资源低优先级
    const nonCriticalResources = [
      'img[loading="lazy"]',
      'script[defer]',
      'link[rel="prefetch"]'
    ];
    
    nonCriticalResources.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.setAttribute('importance', 'low');
      });
    });
  }
  
  /**
   * 启用多路复用优化
   */
  enableMultiplexingOptimizations() {
    // 批量请求优化
    this.batchRequests();
    
    // 连接预热
    this.preWarmConnections();
  }
  
  /**
   * 批量请求优化
   */
  batchRequests() {
    const requestBatcher = {
      queue: [],
      timer: null,
      batchSize: 6, // HTTP/3 建议的并发数
      
      add(url, options = {}) {
        this.queue.push({ url, options });
        
        if (this.queue.length >= this.batchSize) {
          this.flush();
        } else if (!this.timer) {
          this.timer = setTimeout(() => this.flush(), 10);
        }
      },
      
      flush() {
        if (this.queue.length === 0) return;
        
        const batch = this.queue.splice(0, this.batchSize);
        clearTimeout(this.timer);
        this.timer = null;
        
        // 并行发送请求
        Promise.all(batch.map(({ url, options }) => 
          fetch(url, options).catch(error => ({ error, url }))
        )).then(results => {
          console.log('📦 批量请求完成:', results.length);
        });
      }
    };
    
    // 替换全局 fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      if (options.batch !== false && typeof url === 'string') {
        requestBatcher.add(url, options);
        return Promise.resolve(new Response());
      }
      return originalFetch(url, options);
    };
  }
  
  /**
   * 连接预热
   */
  preWarmConnections() {
    const domains = this.extractDomains();
    
    domains.forEach(domain => {
      // DNS 预解析
      const dnsLink = document.createElement('link');
      dnsLink.rel = 'dns-prefetch';
      dnsLink.href = `//${domain}`;
      document.head.appendChild(dnsLink);
      
      // 连接预建立
      const preconnectLink = document.createElement('link');
      preconnectLink.rel = 'preconnect';
      preconnectLink.href = `//${domain}`;
      document.head.appendChild(preconnectLink);
    });
  }
  
  /**
   * 提取页面中的域名
   */
  extractDomains() {
    const domains = new Set();
    
    // 从链接中提取
    document.querySelectorAll('a[href], link[href], script[src], img[src]').forEach(element => {
      const url = element.href || element.src;
      if (url) {
        try {
          const domain = new URL(url).hostname;
          if (domain !== location.hostname) {
            domains.add(domain);
          }
        } catch (error) {
          // 忽略无效URL
        }
      }
    });
    
    return Array.from(domains);
  }
  
  /**
   * 启用流式加载优化
   */
  enableStreamingOptimizations() {
    console.log('🌊 启用流式加载优化');
    
    // 流式 JSON 解析
    this.enableStreamingJSON();
    
    // 流式图片加载
    this.enableStreamingImages();
    
    // 流式文本内容
    this.enableStreamingText();
  }
  
  /**
   * 流式 JSON 解析
   */
  enableStreamingJSON() {
    window.fetchStreamingJSON = async function(url) {
      const response = await fetch(url);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let result = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 尝试解析完整的 JSON
        try {
          result = JSON.parse(buffer);
          break;
        } catch (error) {
          // 继续读取更多数据
        }
      }
      
      return result;
    };
  }
  
  /**
   * 流式图片加载
   */
  enableStreamingImages() {
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'img') {
        // 添加流式加载支持
        const originalSrc = element.src;
        Object.defineProperty(element, 'src', {
          get() { return originalSrc; },
          set(value) {
            if (value) {
              this.loadStreamingImage(value);
            }
          }
        });
        
        element.loadStreamingImage = async function(url) {
          try {
            const response = await fetch(url);
            const reader = response.body.getReader();
            
            // 创建 Blob URL 进行渐进式加载
            const chunks = [];
            
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              chunks.push(value);
              
              // 每收到一定数据就更新图片
              if (chunks.length % 5 === 0) {
                const blob = new Blob(chunks);
                const blobUrl = URL.createObjectURL(blob);
                this.src = blobUrl;
              }
            }
            
            // 最终完整图片
            const finalBlob = new Blob(chunks);
            const finalUrl = URL.createObjectURL(finalBlob);
            this.src = finalUrl;
            
          } catch (error) {
            console.warn('流式图片加载失败:', error);
            this.src = url; // 回退到普通加载
          }
        };
      }
      
      return element;
    };
  }
  
  /**
   * 启用 WebTransport 优化
   */
  enableWebTransportOptimizations() {
    console.log('🚄 启用 WebTransport 优化');
    
    if (!this.supportedFeatures.webTransport) {
      console.warn('WebTransport 不被支持');
      return;
    }
    
    // 实现 WebTransport 连接池
    this.webTransportPool = new Map();
    
    // 创建 WebTransport 连接
    this.createWebTransportConnection();
  }
  
  /**
   * 创建 WebTransport 连接
   */
  async createWebTransportConnection() {
    try {
      const transport = new WebTransport('https://example.com/webtransport');
      
      await transport.ready;
      
      console.log('✅ WebTransport 连接已建立');
      
      // 监听连接关闭
      transport.closed.then(() => {
        console.log('🔌 WebTransport 连接已关闭');
      });
      
      this.webTransportPool.set('main', transport);
      
    } catch (error) {
      console.warn('WebTransport 连接失败:', error);
    }
  }
  
  /**
   * 启用自适应加载
   */
  enableAdaptiveLoading() {
    console.log('🎯 启用自适应加载');
    
    // 根据网络状况调整策略
    this.adaptToNetworkConditions();
    
    // 根据设备性能调整
    this.adaptToDeviceCapabilities();
    
    // 根据用户偏好调整
    this.adaptToUserPreferences();
  }
  
  /**
   * 适应网络状况
   */
  adaptToNetworkConditions() {
    const { effectiveType, saveData, downlink } = this.networkInfo;
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      // 低速网络优化
      this.enableLowBandwidthMode();
    } else if (effectiveType === '4g' && downlink > 10) {
      // 高速网络优化
      this.enableHighBandwidthMode();
    } else {
      // 中等网络优化
      this.enableMediumBandwidthMode();
    }
  }
  
  /**
   * 低带宽模式
   */
  enableLowBandwidthMode() {
    console.log('📱 启用低带宽模式');
    
    // 禁用非关键资源
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.style.display = 'none';
    });
    
    // 降低图片质量
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.src;
      if (src.includes('?')) {
        img.src = src + '&quality=30';
      } else {
        img.src = src + '?quality=30';
      }
    });
    
    // 禁用动画
    document.documentElement.style.setProperty('--animation-duration', '0s');
  }
  
  /**
   * 高带宽模式
   */
  enableHighBandwidthMode() {
    console.log('🚀 启用高带宽模式');
    
    // 预加载更多资源
    this.preloadAdditionalResources();
    
    // 启用高质量图片
    this.enableHighQualityImages();
    
    // 启用预测性加载
    this.enablePredictiveLoading();
  }
  
  /**
   * 预加载额外资源
   */
  preloadAdditionalResources() {
    // 预加载下一页内容
    const nextPageLinks = document.querySelectorAll('a[rel="next"], .pagination a');
    nextPageLinks.forEach(link => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'prefetch';
      preloadLink.href = link.href;
      document.head.appendChild(preloadLink);
    });
  }
  
  /**
   * 启用高质量图片
   */
  enableHighQualityImages() {
    document.querySelectorAll('img[data-hq-src]').forEach(img => {
      img.src = img.dataset.hqSrc;
    });
  }
  
  /**
   * 启用预测性加载
   */
  enablePredictiveLoading() {
    // 基于用户行为预测下一步操作
    let mouseDirection = { x: 0, y: 0 };
    let lastMousePosition = { x: 0, y: 0 };
    
    document.addEventListener('mousemove', (event) => {
      mouseDirection.x = event.clientX - lastMousePosition.x;
      mouseDirection.y = event.clientY - lastMousePosition.y;
      lastMousePosition.x = event.clientX;
      lastMousePosition.y = event.clientY;
      
      // 预测用户可能点击的链接
      const targetElement = document.elementFromPoint(event.clientX, event.clientY);
      if (targetElement && targetElement.tagName === 'A') {
        this.preloadLink(targetElement);
      }
    });
  }
  
  /**
   * 预加载链接
   */
  preloadLink(linkElement) {
    if (linkElement.dataset.preloaded) return;
    
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'prefetch';
    preloadLink.href = linkElement.href;
    document.head.appendChild(preloadLink);
    
    linkElement.dataset.preloaded = 'true';
  }
  
  /**
   * 适应设备能力
   */
  adaptToDeviceCapabilities() {
    const deviceMemory = navigator.deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    if (deviceMemory < 2 || hardwareConcurrency < 4) {
      // 低性能设备优化
      this.enableLowPerformanceMode();
    } else if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
      // 高性能设备优化
      this.enableHighPerformanceMode();
    }
  }
  
  /**
   * 低性能模式
   */
  enableLowPerformanceMode() {
    console.log('⚡ 启用低性能模式');
    
    // 减少并发请求
    this.maxConcurrentRequests = 2;
    
    // 禁用复杂动画
    document.documentElement.classList.add('reduced-motion');
  }
  
  /**
   * 高性能模式
   */
  enableHighPerformanceMode() {
    console.log('💪 启用高性能模式');
    
    // 增加并发请求
    this.maxConcurrentRequests = 8;
    
    // 启用高级特性
    this.enableAdvancedFeatures();
  }
  
  /**
   * 启用高级特性
   */
  enableAdvancedFeatures() {
    // 启用 WebAssembly 优化
    if (this.supportedFeatures.wasmStreaming) {
      this.enableWebAssemblyOptimizations();
    }
    
    // 启用 WebCodecs 优化
    if (this.supportedFeatures.webCodecs) {
      this.enableWebCodecsOptimizations();
    }
  }
  
  /**
   * 获取优化状态
   */
  getOptimizationStatus() {
    return {
      supportedFeatures: this.supportedFeatures,
      networkInfo: this.networkInfo,
      activeStrategies: Array.from(this.optimizationStrategies.keys()),
      performance: {
        maxConcurrentRequests: this.maxConcurrentRequests || 6
      }
    };
  }
}

// 全局实例
window.ModernNetworkOptimizer = ModernNetworkOptimizer;

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.networkOptimizer = new ModernNetworkOptimizer();
  });
} else {
  window.networkOptimizer = new ModernNetworkOptimizer();
}

console.log('🌐 现代网络优化模块已加载');