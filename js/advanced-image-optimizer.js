
/**
 * 高级图片懒加载和优化
 */
class AdvancedImageOptimizer {
  constructor() {
    this.observer = null;
    this.imageQueue = [];
    this.loadedImages = new Set();
    this.init();
  }

  init() {
    // 创建Intersection Observer
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }

    // 初始化现有图片
    this.setupExistingImages();
    
    // 监听新添加的图片
    this.observeNewImages();
    
    // 预加载关键图片
    this.preloadCriticalImages();
  }

  setupExistingImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => this.processImage(img));
  }

  processImage(img) {
    // 如果图片已经加载，跳过
    if (this.loadedImages.has(img.src)) return;

    // 设置懒加载
    if (img.src && !img.dataset.src) {
      img.dataset.src = img.src;
      img.src = this.generatePlaceholder(img.width || 300, img.height || 200);
    }

    // 添加加载状态类
    img.classList.add('lazy-loading');
    
    // 开始观察
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // 降级处理
      this.loadImage(img);
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    if (!img.dataset.src) return;

    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = img.dataset.src;
      img.classList.remove('lazy-loading');
      img.classList.add('loaded');
      this.loadedImages.add(img.dataset.src);
      
      // 触发自定义事件
      img.dispatchEvent(new CustomEvent('imageLoaded', { detail: { src: img.dataset.src } }));
    };

    tempImg.onerror = () => {
      img.src = this.generateErrorPlaceholder();
      img.classList.remove('lazy-loading');
      img.classList.add('error');
    };

    tempImg.src = img.dataset.src;
  }

  generatePlaceholder(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(0.5, '#e0e0e0');
    gradient.addColorStop(1, '#f0f0f0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL();
  }

  generateErrorPlaceholder() {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">图片加载失败</text>
      </svg>
    `);
  }

  preloadCriticalImages() {
    // 预加载首屏关键图片
    const criticalImages = document.querySelectorAll('.hero img, .featured-image img');
    criticalImages.forEach(img => {
      if (img.dataset.src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.dataset.src;
        document.head.appendChild(link);
      }
    });
  }

  observeNewImages() {
    // 使用MutationObserver监听新添加的图片
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
            images.forEach(img => this.processImage(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 初始化图片优化器
document.addEventListener('DOMContentLoaded', () => {
  new AdvancedImageOptimizer();
});
