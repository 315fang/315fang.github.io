
/**
 * Twikoo资源加载优化
 */
class TwikooResourceOptimizer {
  constructor() {
    this.preloadEnabled = true;
    this.cacheEnabled = true;
  }

  init() {
    this.setupPreloading();
    this.setupCaching();
    this.optimizeCSS();
  }

  setupPreloading() {
    if (!this.preloadEnabled) return;

    // 预加载Twikoo相关资源
    const preloadResources = [
      {
        href: 'https://cdn.jsdelivr.net/npm/twikoo@1.6.39/dist/twikoo.all.min.js',
        as: 'script'
      }
    ];

    preloadResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    console.log('✅ Twikoo资源预加载已启用');
  }

  setupCaching() {
    if (!this.cacheEnabled || !('serviceWorker' in navigator)) return;

    // 注册Service Worker进行缓存
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('✅ Service Worker注册成功，Twikoo资源将被缓存');
    }).catch(error => {
      console.log('Service Worker注册失败:', error);
    });
  }

  optimizeCSS() {
    // 添加Twikoo相关的CSS优化
    const style = document.createElement('style');
    style.textContent = `
      /* Twikoo性能优化CSS */
      #tcomment {
        min-height: 200px;
        transition: opacity 0.3s ease;
      }
      
      .twikoo-loading {
        opacity: 0.8;
      }
      
      .tk-comments-container {
        will-change: transform;
      }
      
      /* 懒加载占位符优化 */
      .tk-comment {
        contain: layout style paint;
      }
      
      /* 减少重排重绘 */
      .tk-avatar {
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }
}

// 初始化资源优化
document.addEventListener('DOMContentLoaded', () => {
  const optimizer = new TwikooResourceOptimizer();
  optimizer.init();
});
