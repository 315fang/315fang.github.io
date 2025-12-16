// 现代化JavaScript优化 - 性能和用户体验提升

// 性能监控和优化
class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupServiceWorker();
    this.setupPreloading();
    this.setupIntersectionObserver();
  }

  // 图片懒加载优化
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // WebP图片支持检测
  setupImageOptimization() {
    const supportsWebP = () => {
      return new Promise(resolve => {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
          resolve(webP.height === 2);
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });
    };

    supportsWebP().then(supported => {
      if (supported) {
        document.documentElement.classList.add('webp');
      }
    });
  }

  // Service Worker注册
  setupServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const meta = document.querySelector('meta[name="fox-sw-enabled"]');
    if (meta && meta.content !== 'true') return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }

  // 关键资源预加载
  setupPreloading() {
    const criticalResources = [
      '/css/matery.css',
      '/js/matery.js',
      '/libs/jquery/jquery-3.6.0.min.js'
    ];

    criticalResources.forEach(resource => {
      if (document.head.querySelector(`link[rel="preload"][href="${resource}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      document.head.appendChild(link);
    });
  }

  // 交叉观察器优化
  setupIntersectionObserver() {
    const animateOnScroll = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      animateOnScroll.observe(el);
    });
  }
}

// 搜索功能优化
class SearchOptimizer {
  constructor() {
    this.searchData = null;
    this.searchIndex = null;
    this.init();
  }

  async init() {
    await this.loadSearchData();
    this.setupSearchUI();
  }

  async loadSearchData() {
    try {
      const response = await fetch('/search.xml');
      const text = await response.text();
      this.parseSearchData(text);
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  }

  parseSearchData(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.querySelectorAll('entry');
    
    this.searchData = Array.from(entries).map(entry => ({
      title: entry.querySelector('title')?.textContent || '',
      content: entry.querySelector('content')?.textContent || '',
      url: entry.querySelector('url')?.textContent || '',
      date: entry.querySelector('date')?.textContent || ''
    }));
  }

  setupSearchUI() {
    const searchInput = document.querySelector('#search-input');
    const searchResults = document.querySelector('#search-results');
    
    if (!searchInput || !searchResults) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value, searchResults);
      }, 300);
    });
  }

  performSearch(query, resultsContainer) {
    if (!query.trim() || !this.searchData) {
      resultsContainer.innerHTML = '';
      return;
    }

    const results = this.searchData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    this.renderSearchResults(results, resultsContainer, query);
  }

  renderSearchResults(results, container, query) {
    if (results.length === 0) {
      container.innerHTML = '<p class="no-results">未找到相关内容</p>';
      return;
    }

    const safeQuery = String(query || '').slice(0, 50);
    const html = results.map(result => {
      const url = this.sanitizeUrl(result.url);
      return `
      <div class="search-result-item">
        <h3><a href="${url}">${this.highlightText(result.title, safeQuery)}</a></h3>
        <p>${this.highlightText(this.truncateText(result.content, 150), safeQuery)}</p>
        <span class="search-result-date">${this.escapeHtml(result.date)}</span>
      </div>
    `;
    }).join('');

    container.innerHTML = html;
  }

  sanitizeUrl(url) {
    const u = String(url || '').trim();
    if (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://')) {
      return u.replace(/"/g, '%22');
    }
    return '#';
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  highlightText(text, query) {
    const safeText = this.escapeHtml(text);
    const safeQuery = this.escapeHtml(query);
    if (!safeQuery.trim()) return safeText;

    const regex = new RegExp(`(${this.escapeRegExp(safeQuery)})`, 'gi');
    return safeText.replace(regex, '<mark>$1</mark>');
  }

  truncateText(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}

// 主题切换优化
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'auto';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupThemeToggle();
    this.watchSystemTheme();
  }

  applyTheme() {
    const html = document.documentElement;
    
    if (this.currentTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', this.currentTheme);
    }
  }

  setupThemeToggle() {
    const themeToggle = document.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    this.currentTheme = themes[(currentIndex + 1) % themes.length];
    
    localStorage.setItem('theme', this.currentTheme);
    this.applyTheme();
  }

  watchSystemTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.applyTheme();
      }
    });
  }
}

// 滚动优化
class ScrollOptimizer {
  constructor() {
    this.ticking = false;
    this.init();
  }

  init() {
    this.setupSmoothScroll();
    this.setupScrollProgress();
    this.setupBackToTop();
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  setupScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollPercent + '%';
    };

    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          this.ticking = false;
        });
        this.ticking = true;
      }
    });
  }

  setupBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

// 初始化所有优化
document.addEventListener('DOMContentLoaded', () => {
  new PerformanceOptimizer();
  new SearchOptimizer();
  new ThemeManager();
  new ScrollOptimizer();
});

// 导出模块（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PerformanceOptimizer,
    SearchOptimizer,
    ThemeManager,
    ScrollOptimizer
  };
}