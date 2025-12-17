
/**
 * Twikoo懒加载优化 - 增强版
 * 集成错误处理和自动修复功能
 */
class TwikooLazyLoader {
  constructor() {
    this.loaded = false;
    this.observer = null;
    this.errorHandler = null;
    this.init();
  }

  init() {
    // 检查是否有评论容器
    const commentContainer = document.getElementById('tcomment');
    if (!commentContainer) return;

    // 等待错误处理器加载
    this.waitForErrorHandler().then(() => {
      this.setupObserver(commentContainer);
    });
  }

  waitForErrorHandler() {
    return new Promise((resolve) => {
      const checkHandler = () => {
        if (window.twikooErrorHandler) {
          this.errorHandler = window.twikooErrorHandler;
          resolve();
        } else {
          setTimeout(checkHandler, 100);
        }
      };
      checkHandler();
    });
  }

  setupObserver(commentContainer) {
    // 创建Intersection Observer
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loaded) {
            this.loadTwikoo();
          }
        });
      }, {
        rootMargin: '200px 0px' // 提前200px开始加载
      });

      this.observer.observe(commentContainer);
    } else {
      // 降级处理：延迟加载
      setTimeout(() => this.loadTwikoo(), 2000);
    }
  }

  loadTwikoo() {
    if (this.loaded) return;
    
    console.log('🔄 开始加载Twikoo评论系统...');
    
    // 使用错误处理器的加载方法
    if (this.errorHandler) {
      this.errorHandler.loadTwikooWithRetry();
    } else {
      // 降级到原始加载方法
      this.fallbackLoad();
    }

    this.loaded = true;
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  fallbackLoad() {
    // 静默模式：不显示错误界面，仅在控制台记录并继续尝试
    console.log('⚠️ Twikoo懒加载失败，静默重试中...');
    
    // 延迟后重试
    setTimeout(() => {
      this.loadTwikoo();
    }, 5000);
  }

  loadTwikooScript() {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (window.twikoo) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.39/dist/twikoo.all.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }

  initTwikoo() {
    if (!window.twikoo) {
      console.error('Twikoo脚本未正确加载');
      return;
    }

    try {
      twikoo.init({
        envId: 'https://super-gelato-2c17f4.netlify.app/.netlify/functions/twikoo',
        el: '#tcomment',
        lang: 'zh-CN',
        region: 'ap-shanghai'
      }).then(() => {
        console.log('✅ Twikoo评论系统加载完成');
      }).catch(error => {
        console.error('Twikoo初始化失败:', error);
      });
    } catch (error) {
      console.error('Twikoo初始化出错:', error);
    }
  }
}

// 初始化懒加载
document.addEventListener('DOMContentLoaded', () => {
  new TwikooLazyLoader();
});
