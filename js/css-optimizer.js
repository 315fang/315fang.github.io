
/**
 * CSS资源优化加载器
 */
class CSSOptimizer {
  constructor() {
    this.loadedCSS = new Set();
    this.init();
  }

  init() {
    // 延迟加载非关键CSS
    this.loadNonCriticalCSS();
    
    // 预加载下一页面的CSS
    this.preloadNextPageCSS();
    
    // 移除未使用的CSS
    this.removeUnusedCSS();
  }

  loadNonCriticalCSS() {
    const nonCriticalCSS = [
      '/css/highlight.css',
      '/css/gallery.css',
      '/css/comments.css',
      '/libs/awesome/css/all.min.css'
    ];

    // 延迟加载
    setTimeout(() => {
      nonCriticalCSS.forEach(href => this.loadCSS(href));
    }, 100);
  }

  loadCSS(href) {
    if (this.loadedCSS.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    
    document.head.appendChild(link);
    this.loadedCSS.add(href);
  }

  preloadNextPageCSS() {
    // 预加载可能访问的页面CSS
    const links = document.querySelectorAll('a[href^="/"]');
    const preloadedPages = new Set();

    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href');
        if (!preloadedPages.has(href)) {
          this.preloadPageResources(href);
          preloadedPages.add(href);
        }
      });
    });
  }

  preloadPageResources(href) {
    // 预加载页面的CSS资源
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  removeUnusedCSS() {
    // 检测并移除未使用的CSS规则
    setTimeout(() => {
      const stylesheets = Array.from(document.styleSheets);
      
      stylesheets.forEach(stylesheet => {
        try {
          const rules = Array.from(stylesheet.cssRules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.STYLE_RULE) {
              const selector = rule.selectorText;
              if (selector && !document.querySelector(selector)) {
                // 标记未使用的规则（实际项目中可能需要更复杂的逻辑）
                rule.style.display = 'none';
              }
            }
          });
        } catch (e) {
          // 跨域样式表无法访问
        }
      });
    }, 2000);
  }
}

// 初始化CSS优化器
document.addEventListener('DOMContentLoaded', () => {
  new CSSOptimizer();
});
