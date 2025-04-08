/**
 * 懒加载脚本
 * 用于延迟加载非关键资源，提升页面加载速度
 */

const LazyLoader = {
  // 配置
  config: {
    enabled: true,
    threshold: 200,          // 预加载阈值（像素）
    throttleDelay: 250,      // 滚动事件节流延迟（毫秒）
    fadeInDuration: 300,     // 淡入动画持续时间（毫秒）
    placeholderColor: '#f1f1f1', // 占位符颜色
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded'
  },

  // 存储所有需要懒加载的元素
  elements: [],
  
  // 存储IntersectionObserver实例
  observer: null,

  /**
   * 初始化懒加载
   */
  init: function() {
    if (!this.config.enabled) return;
    
    // 收集所有需要懒加载的元素
    this.collectElements();
    
    // 设置懒加载
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      this.setupLegacyLazyLoad();
    }
    
    console.log(`LazyLoader initialized with ${this.elements.length} elements`);
  },

  /**
   * 收集所有需要懒加载的元素
   */
  collectElements: function() {
    // 收集图片
    const lazyImages = Array.from(document.querySelectorAll('img[data-src], img[data-srcset]'));
    
    // 收集iframe（如视频）
    const lazyIframes = Array.from(document.querySelectorAll('iframe[data-src]'));
    
    // 收集背景图片
    const lazyBackgrounds = Array.from(document.querySelectorAll('[data-background]'));
    
    // 收集需要延迟加载的脚本
    const lazyScripts = Array.from(document.querySelectorAll('script[data-src]'));
    
    // 合并所有元素
    this.elements = [...lazyImages, ...lazyIframes, ...lazyBackgrounds, ...lazyScripts];
    
    // 为每个元素添加加载中的类
    this.elements.forEach(el => {
      if (!el.classList.contains(this.config.loadingClass) && 
          !el.classList.contains(this.config.loadedClass)) {
        el.classList.add(this.config.loadingClass);
        
        // 为图片添加占位符
        if (el.tagName.toLowerCase() === 'img' && !el.src) {
          this.setPlaceholder(el);
        }
        
        // 设置淡入效果
        el.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
        el.style.opacity = '0';
      }
    });
  },

  /**
   * 为图片设置占位符
   * @param {HTMLImageElement} img - 图片元素
   */
  setPlaceholder: function(img) {
    const width = img.getAttribute('width') || 800;
    const height = img.getAttribute('height') || 600;
    
    // 创建SVG占位符
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='${this.config.placeholderColor.replace('#', '%23')}'/%3E%3C/svg%3E`;
    
    img.src = placeholder;
  },

  /**
   * 设置IntersectionObserver进行懒加载
   */
  setupIntersectionObserver: function() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: `${this.config.threshold}px 0px`,
      threshold: 0.01
    });
    
    // 开始观察所有元素
    this.elements.forEach(el => {
      this.observer.observe(el);
    });
  },

  /**
   * 设置传统的懒加载（用于不支持IntersectionObserver的浏览器）
   */
  setupLegacyLazyLoad: function() {
    // 立即加载视口中的元素
    this.checkElementsInViewport();
    
    // 添加滚动事件监听器（使用节流优化）
    let throttleTimer;
    const scrollHandler = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          this.checkElementsInViewport();
          throttleTimer = null;
        }, this.config.throttleDelay);
      }
    };
    
    // 监听滚动和调整大小事件
    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('resize', scrollHandler);
    window.addEventListener('orientationchange', scrollHandler);
  },

  /**
   * 检查元素是否在视口中
   */
  checkElementsInViewport: function() {
    // 过滤出尚未加载的元素
    const unloadedElements = this.elements.filter(el => 
      !el.classList.contains(this.config.loadedClass)
    );
    
    // 如果没有未加载的元素，移除事件监听器
    if (unloadedElements.length === 0) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
      window.removeEventListener('orientationchange', this.scrollHandler);
      return;
    }
    
    // 检查每个元素是否在视口中
    unloadedElements.forEach(el => {
      if (this.isInViewport(el)) {
        this.loadElement(el);
      }
    });
  },

  /**
   * 检查元素是否在视口中
   * @param {HTMLElement} el - 要检查的元素
   * @returns {boolean} 元素是否在视口中
   */
  isInViewport: function(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= (window.innerHeight + this.config.threshold) &&
      rect.left <= (window.innerWidth + this.config.threshold)
    );
  },

  /**
   * 加载元素
   * @param {HTMLElement} el - 要加载的元素
   */
  loadElement: function(el) {
    // 防止重复加载
    if (el.classList.contains(this.config.loadedClass)) return;
    
    const tagName = el.tagName.toLowerCase();
    
    // 根据元素类型进行不同的加载处理
    switch (tagName) {
      case 'img':
        this.loadImage(el);
        break;
      case 'iframe':
        this.loadIframe(el);
        break;
      case 'script':
        this.loadScript(el);
        break;
      default:
        // 处理背景图片
        if (el.dataset.background) {
          el.style.backgroundImage = `url('${el.dataset.background}')`;
          this.markAsLoaded(el);
        }
    }
  },

  /**
   * 加载图片
   * @param {HTMLImageElement} img - 图片元素
   */
  loadImage: function(img) {
    // 设置加载完成的回调
    const onLoad = () => {
      this.markAsLoaded(img);
      img.removeEventListener('load', onLoad);
    };
    
    img.addEventListener('load', onLoad);
    
    // 设置srcset（如果有）
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
    }
    
    // 设置sizes（如果有）
    if (img.dataset.sizes) {
      img.sizes = img.dataset.sizes;
    }
    
    // 最后设置src，触发加载
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  },

  /**
   * 加载iframe
   * @param {HTMLIFrameElement} iframe - iframe元素
   */
  loadIframe: function(iframe) {
    iframe.src = iframe.dataset.src;
    iframe.addEventListener('load', () => {
      this.markAsLoaded(iframe);
    });
  },

  /**
   * 加载脚本
   * @param {HTMLScriptElement} script - 脚本元素
   */
  loadScript: function(script) {
    const newScript = document.createElement('script');
    
    // 复制所有属性
    Array.from(script.attributes).forEach(attr => {
      if (attr.name !== 'data-src') {
        newScript.setAttribute(attr.name, attr.value);
      }
    });
    
    newScript.src = script.dataset.src;
    newScript.addEventListener('load', () => {
      this.markAsLoaded(newScript);
    });
    
    // 替换原始脚本
    script.parentNode.replaceChild(newScript, script);
  },

  /**
   * 标记元素为已加载
   * @param {HTMLElement} el - 要标记的元素
   */
  markAsLoaded: function(el) {
    el.classList.remove(this.config.loadingClass);
    el.classList.add(this.config.loadedClass);
    el.style.opacity = '1';
    
    // 移除data属性以释放内存
    if (el.dataset.src) delete el.dataset.src;
    if (el.dataset.srcset) delete el.dataset.srcset;
    if (el.dataset.sizes) delete el.dataset.sizes;
    if (el.dataset.background) delete el.dataset.background;
  },

  /**
   * 手动加载特定元素
   * @param {HTMLElement|string} element - 元素或选择器
   */
  load: function(element) {
    if (typeof element === 'string') {
      document.querySelectorAll(element).forEach(el => {
        this.loadElement(el);
      });
    } else if (element instanceof HTMLElement) {
      this.loadElement(element);
    }
  },

  /**
   * 刷新懒加载（重新收集元素并开始观察）
   */
  refresh: function() {
    // 如果使用IntersectionObserver，先断开连接
    if (this.observer) {
      this.elements.forEach(el => {
        if (!el.classList.contains(this.config.loadedClass)) {
          this.observer.unobserve(el);
        }
      });
    }
    
    // 重新收集元素
    this.collectElements();
    
    // 重新设置观察
    if (this.observer) {
      this.elements.forEach(el => {
        if (!el.classList.contains(this.config.loadedClass)) {
          this.observer.observe(el);
        }
      });
    } else {
      this.checkElementsInViewport();
    }
  }
};

// 在DOM加载完成后初始化懒加载
document.addEventListener('DOMContentLoaded', () => {
  LazyLoader.init();
});

// 导出给全局使用
window.LazyLoader = LazyLoader;