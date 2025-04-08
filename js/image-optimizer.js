/**
 * 图片优化器
 * 用于优化网站图片加载性能，支持响应式图片和WebP格式
 */

const ImageOptimizer = {
  // 配置
  config: {
    enabled: true,
    webpSupport: false,          // 是否支持WebP格式（将在初始化时检测）
    lazyLoadThreshold: 200,      // 懒加载阈值
    responsiveSizes: [320, 768, 1024, 1920], // 响应式图片尺寸
    defaultQuality: 80,          // 默认图片质量
    lowQualityPreview: true,     // 是否启用低质量图片预览
    previewQuality: 10,          // 预览图片质量
    placeholderColor: '#f5f5f5', // 占位符颜色
    fadeInDuration: 300          // 图片淡入时间（毫秒）
  },

  /**
   * 初始化图片优化器
   */
  init: function() {
    // 检测WebP支持
    this.detectWebpSupport();
    
    // 处理所有图片
    this.processAllImages();
    
    // 设置懒加载
    this.setupLazyLoading();
    
    // 监听窗口大小变化，以便调整响应式图片
    this.setupResizeHandler();
    
    console.log('ImageOptimizer initialized. WebP support:', this.config.webpSupport);
  },

  /**
   * 检测浏览器是否支持WebP格式
   */
  detectWebpSupport: function() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      // 尝试将canvas转换为WebP格式
      this.config.webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  },

  /**
   * 处理所有图片
   */
  processAllImages: function() {
    // 处理文章内容中的图片
    const contentImages = document.querySelectorAll('#articleContent img, .article-entry img, .card img');
    contentImages.forEach(img => {
      this.prepareForLazyLoad(img);
      this.makeResponsive(img);
    });
    
    // 处理特色图片
    const featureImages = document.querySelectorAll('.post-cover img, .cover-image');
    featureImages.forEach(img => {
      this.makeResponsive(img, true); // 特色图片优先加载
    });
  },

  /**
   * 准备图片进行懒加载
   * @param {HTMLImageElement} img - 图片元素
   */
  prepareForLazyLoad: function(img) {
    // 跳过已处理的图片
    if (img.classList.contains('lazyload-processed')) return;
    
    // 保存原始图片URL
    const originalSrc = img.src;
    if (!originalSrc || originalSrc.startsWith('data:')) return;
    
    // 设置data-src属性并清除src
    img.dataset.src = originalSrc;
    
    // 创建低质量预览或占位符
    if (this.config.lowQualityPreview) {
      // 使用低质量版本作为预览
      const previewUrl = this.getOptimizedImageUrl(originalSrc, 20, 10);
      img.src = previewUrl;
    } else {
      // 使用颜色占位符
      img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${img.width || 800} ${img.height || 500}'%3E%3Crect width='100%25' height='100%25' fill='${this.config.placeholderColor.replace('#', '%23')}'/%3E%3C/svg%3E`;
    }
    
    // 添加淡入效果的CSS
    img.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
    img.style.opacity = '0';
    
    // 标记为已处理
    img.classList.add('lazyload-processed');
  },

  /**
   * 使图片响应式
   * @param {HTMLImageElement} img - 图片元素
   * @param {boolean} priority - 是否优先加载
   */
  makeResponsive: function(img, priority = false) {
    // 跳过已处理的图片
    if (img.classList.contains('responsive-processed')) return;
    
    const originalSrc = img.dataset.src || img.src;
    if (!originalSrc || originalSrc.startsWith('data:')) return;
    
    // 创建srcset
    let srcset = '';
    this.config.responsiveSizes.forEach(size => {
      const optimizedUrl = this.getOptimizedImageUrl(originalSrc, size);
      srcset += `${optimizedUrl} ${size}w, `;
    });
    
    // 设置srcset和sizes属性
    if (srcset) {
      img.dataset.srcset = srcset.slice(0, -2); // 移除最后的逗号和空格
      img.dataset.sizes = 'auto';
      
      // 如果是优先加载的图片，直接设置srcset
      if (priority) {
        img.srcset = img.dataset.srcset;
        img.sizes = img.dataset.sizes;
      }
    }
    
    // 标记为已处理
    img.classList.add('responsive-processed');
  },

  /**
   * 获取优化后的图片URL
   * @param {string} originalUrl - 原始图片URL
   * @param {number} width - 目标宽度
   * @param {number} quality - 图片质量
   * @returns {string} 优化后的URL
   */
  getOptimizedImageUrl: function(originalUrl, width, quality = this.config.defaultQuality) {
    // 如果是外部URL或已经是优化过的URL，直接返回
    if (originalUrl.includes('cdn.jsdelivr.net') || originalUrl.startsWith('http') && !originalUrl.includes(window.location.hostname)) {
      return originalUrl;
    }
    
    // 检查是否是本地图片
    if (originalUrl.startsWith('/')) {
      // 构建优化参数
      const format = this.config.webpSupport ? 'webp' : 'jpg';
      
      // 如果使用了CDN，可以利用CDN的图片处理功能
      if (window.jsDelivr && window.jsDelivr.url) {
        // 使用jsDelivr的图片处理
        const cdnUrl = window.jsDelivr.url;
        return `${cdnUrl}${originalUrl}?width=${width}&quality=${quality}&format=${format}`;
      } else {
        // 本地图片，无法动态调整大小，返回原始URL
        return originalUrl;
      }
    }
    
    return originalUrl;
  },

  /**
   * 设置懒加载
   */
  setupLazyLoading: function() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // 加载实际图片
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            
            // 加载响应式图片
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              img.sizes = img.dataset.sizes || 'auto';
            }
            
            // 淡入显示
            img.onload = () => {
              img.style.opacity = '1';
            };
            
            // 停止观察已加载的图片
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: `${this.config.lazyLoadThreshold}px 0px`,
        threshold: 0.01
      });
      
      // 观察所有懒加载图片
      document.querySelectorAll('img.lazyload-processed').forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // 回退方案：简单的延迟加载
      setTimeout(() => {
        document.querySelectorAll('img.lazyload-processed').forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.sizes = img.dataset.sizes || 'auto';
          }
          img.style.opacity = '1';
        });
      }, 1000);
    }
  },

  /**
   * 设置窗口大小变化处理
   */
  setupResizeHandler: function() {
    // 使用防抖函数优化resize事件
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // 更新响应式图片的sizes属性
        document.querySelectorAll('img[data-sizes="auto"]').forEach(img => {
          img.sizes = `${img.getBoundingClientRect().width}px`;
        });
      }, 250);
    });
  }
};

// 在DOM加载完成后初始化图片优化器
document.addEventListener('DOMContentLoaded', () => {
  ImageOptimizer.init();
});

// 导出给全局使用
window.ImageOptimizer = ImageOptimizer;