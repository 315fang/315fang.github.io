
/**
 * 智能资源预加载
 */
class ResourcePreloader {
  constructor() {
    this.preloadQueue = [];
    this.preloadedResources = new Set();
    this.init();
  }

  init() {
    // 预加载关键字体
    this.preloadFonts();
    
    // 预加载关键图片
    this.preloadCriticalImages();
    
    // 智能预加载链接
    this.setupIntelligentPreloading();
  }

  preloadFonts() {
    const fonts = [
      '/libs/awesome/webfonts/fa-solid-900.woff2',
      '/libs/awesome/webfonts/fa-regular-400.woff2',
      '/libs/awesome/webfonts/fa-brands-400.woff2'
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });
  }

  preloadCriticalImages() {
    const criticalImages = [
      '/medias/avatar.jpg',
      '/medias/banner/1.jpg'
    ];

    criticalImages.forEach(image => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = image;
      document.head.appendChild(link);
    });
  }

  setupIntelligentPreloading() {
    // 基于用户行为的智能预加载
    let mouseIdleTimer;
    
    document.addEventListener('mousemove', () => {
      clearTimeout(mouseIdleTimer);
      mouseIdleTimer = setTimeout(() => {
        this.preloadVisibleLinks();
      }, 500);
    });

    // 基于滚动位置的预加载
    let scrollTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.preloadNearbyContent();
      }, 200);
    });
  }

  preloadVisibleLinks() {
    const links = document.querySelectorAll('a[href^="/"]');
    const viewportHeight = window.innerHeight;
    
    links.forEach(link => {
      const rect = link.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= viewportHeight) {
        this.preloadPage(link.href);
      }
    });
  }

  preloadNearbyContent() {
    const images = document.querySelectorAll('img[data-src]');
    const viewportHeight = window.innerHeight;
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top <= viewportHeight + 200 && rect.bottom >= -200) {
        this.preloadImage(img.dataset.src);
      }
    });
  }

  preloadPage(href) {
    if (this.preloadedResources.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    this.preloadedResources.add(href);
  }

  preloadImage(src) {
    if (this.preloadedResources.has(src)) return;
    
    const img = new Image();
    img.src = src;
    
    this.preloadedResources.add(src);
  }
}

// 初始化资源预加载器
document.addEventListener('DOMContentLoaded', () => {
  new ResourcePreloader();
});
