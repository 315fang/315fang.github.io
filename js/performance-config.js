/**
 * 博客性能优化配置文件
 * 用于集中管理性能优化相关的设置
 */

const PerformanceConfig = {
  // 延迟加载配置
  lazyLoad: {
    enabled: true,           // 是否启用延迟加载
    threshold: 200,          // 预加载阈值（像素）
    placeholder: '/medias/featureimages/0.jpg', // 图片加载前的占位图
    effect: 'fadeIn',        // 图片加载效果
    effectTime: 300          // 效果持续时间（毫秒）
  },
  
  // 资源优化配置
  resources: {
    // 预加载关键资源
    preload: [
      // 字体和关键CSS
      { type: 'style', href: '/css/matery.css' },
      { type: 'style', href: '/css/my.css' }
    ],
    // 预连接常用域名
    preconnect: [
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com'
    ],
    // 延迟加载非关键资源
    defer: [
      '/libs/others/sakura.js',
      '/libs/others/clicklove.js',
      '/libs/others/star.js',
      '/libs/others/snow.js'
    ]
  },
  
  // 缓存策略
  cache: {
    enabled: true,
    // 本地存储配置
    localStorage: {
      enabled: true,
      expires: 86400 * 7 // 7天过期（秒）
    },
    // 搜索数据缓存
    searchCache: {
      enabled: true,
      expires: 86400 // 1天过期（秒）
    }
  },
  
  // 动画优化
  animations: {
    reducedMotion: 'auto', // auto, always, never
    disableOnMobile: true, // 在移动设备上禁用复杂动画
    useGPU: true,          // 使用GPU加速
    limitAnimations: true   // 限制同时运行的动画数量
  },
  
  // 代码分割配置
  codeSplitting: {
    enabled: true,
    // 按需加载的功能模块
    modules: [
      { name: 'search', path: '/js/search.js', loadCondition: '.search-form' },
      { name: 'gallery', path: '/libs/lightGallery/js/lightgallery-all.min.js', loadCondition: '.gallery' },
      { name: 'comments', path: '/libs/valine/Valine.min.js', loadCondition: '#vcomments' }
    ]
  }
};

// 根据用户设备和网络状况自动调整配置
function adjustConfigForUserEnvironment() {
  // 检测网络状况
  if (navigator.connection) {
    const connection = navigator.connection;
    
    // 在慢网络下减少预加载
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      PerformanceConfig.lazyLoad.threshold = 50;
      PerformanceConfig.animations.disableOnMobile = true;
    }
    
    // 在数据保护模式下减少加载内容
    if (connection.saveData) {
      PerformanceConfig.resources.preload = [];
      PerformanceConfig.animations.disableOnMobile = true;
    }
  }
  
  // 检测设备性能
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    PerformanceConfig.animations.reducedMotion = 'always';
  }
}

// 初始化性能优化
function initPerformanceOptimizations() {
  adjustConfigForUserEnvironment();
  
  // 应用预连接
  if (PerformanceConfig.resources.preconnect.length > 0) {
    PerformanceConfig.resources.preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
  
  // 注册延迟加载
  if (PerformanceConfig.lazyLoad.enabled) {
    document.addEventListener('DOMContentLoaded', setupLazyLoading);
  }
  
  // 设置代码分割
  if (PerformanceConfig.codeSplitting.enabled) {
    document.addEventListener('DOMContentLoaded', setupCodeSplitting);
  }
}

// 设置延迟加载
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  const lazyIframes = document.querySelectorAll('iframe[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: `${PerformanceConfig.lazyLoad.threshold}px 0px`
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    const iframeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          iframe.src = iframe.dataset.src;
          iframe.classList.add('loaded');
          observer.unobserve(iframe);
        }
      });
    }, {
      rootMargin: `${PerformanceConfig.lazyLoad.threshold}px 0px`
    });
    
    lazyIframes.forEach(iframe => iframeObserver.observe(iframe));
  } else {
    // 回退方案：简单的延迟加载
    setTimeout(() => {
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
      });
      
      lazyIframes.forEach(iframe => {
        iframe.src = iframe.dataset.src;
      });
    }, 1000);
  }
}

// 设置代码分割
function setupCodeSplitting() {
  PerformanceConfig.codeSplitting.modules.forEach(module => {
    if (document.querySelector(module.loadCondition)) {
      const script = document.createElement('script');
      script.src = module.path;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

// 初始化
initPerformanceOptimizations();

// 导出配置供其他脚本使用
window.PerformanceConfig = PerformanceConfig;