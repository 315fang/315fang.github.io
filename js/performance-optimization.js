/**
 * 博客性能优化配置
 * 用于实现各种性能优化策略，提升博客加载速度和用户体验
 */

(function() {
    'use strict';
    
    // 性能优化配置
    const PerformanceConfig = {
        // 是否启用性能优化
        enabled: true,
        
        // 资源预加载配置
        preload: {
            enabled: true,
            // 预连接常用域名
            preconnect: [
                'https://cdn.jsdelivr.net'
            ],
            // 预加载关键资源
            critical: [
                '/css/matery.css',
                '/css/my.css'
            ]
        },
        
        // 资源延迟加载配置
        lazyLoad: {
            enabled: true,
            // 图片延迟加载
            images: true,
            // iframe延迟加载
            iframes: true,
            // 第三方脚本延迟加载
            scripts: true,
            // 观察阈值（像素）
            threshold: 200
        },
        
        // 代码分割配置
        codeSplitting: {
            enabled: true,
            // 按需加载的功能模块
            modules: [
                { name: 'search', condition: '.search-form', path: '/js/search.optimized.js' },
                { name: 'gallery', condition: '.gallery, #articleContent img', path: '/libs/lightGallery/js/lightgallery-all.min.js' },
                { name: 'masonry', condition: '#articles', path: '/libs/masonry/masonry.pkgd.min.js' }
            ]
        },
        
        // 图片优化配置
        imageOptimization: {
            enabled: true,
            // 使用WebP格式（如果浏览器支持）
            webp: true,
            // 响应式图片
            responsive: true,
            // 图片尺寸
            sizes: [320, 768, 1024, 1920],
            // 图片质量
            quality: 80,
            // 低质量图片预览
            lowQualityPreview: true
        },
        
        // 缓存策略
        caching: {
            enabled: true,
            // 本地存储缓存
            localStorage: {
                enabled: true,
                // 缓存过期时间（毫秒）
                expiration: 86400000 // 24小时
            }
        },
        
        // 动画优化
        animations: {
            // 是否在移动设备上禁用复杂动画
            reduceOnMobile: true,
            // 是否尊重用户的减少动画偏好设置
            respectReduceMotion: true
        },
        
        // CDN优化
        cdn: {
            enabled: true,
            // 使用CDN的资源类型
            types: ['js', 'css', 'image'],
            // 排除不使用CDN的资源
            exclude: ['/js/performance-optimization.js']
        }
    };
    
    // 检测浏览器功能和用户偏好
    function detectEnvironment() {
        // 检测WebP支持
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            PerformanceConfig.imageOptimization.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        
        // 检测减少动画偏好
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            PerformanceConfig.animations.reduceOnMobile = true;
        }
        
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        PerformanceConfig.isMobile = isMobile;
        
        // 检测网络状况
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // 在慢网络下减少预加载
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                PerformanceConfig.preload.enabled = false;
                PerformanceConfig.imageOptimization.quality = 60;
            }
            
            // 在数据保护模式下减少加载内容
            if (connection.saveData) {
                PerformanceConfig.preload.enabled = false;
                PerformanceConfig.imageOptimization.quality = 50;
                PerformanceConfig.imageOptimization.lowQualityPreview = false;
            }
        }
    }
    
    // 应用预加载优化
    function applyPreloadOptimizations() {
        if (!PerformanceConfig.enabled || !PerformanceConfig.preload.enabled) return;
        
        // 应用预连接
        PerformanceConfig.preload.preconnect.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        // 预加载关键资源
        PerformanceConfig.preload.critical.forEach(path => {
            const isCSS = path.endsWith('.css');
            const isJS = path.endsWith('.js');
            
            if (isCSS || isJS) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = path;
                link.as = isCSS ? 'style' : 'script';
                document.head.appendChild(link);
            }
        });
    }
    
    // 应用延迟加载优化
    function applyLazyLoadOptimizations() {
        if (!PerformanceConfig.enabled || !PerformanceConfig.lazyLoad.enabled) return;
        
        // 延迟加载图片
        if (PerformanceConfig.lazyLoad.images) {
            const images = document.querySelectorAll('img:not([loading="lazy"])');
            images.forEach(img => {
                if (!img.src || img.src === window.location.href) return;
                
                // 保存原始src
                if (!img.dataset.src) {
                    img.dataset.src = img.src;
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                    img.loading = 'lazy';
                }
            });
        }
        
        // 延迟加载iframe
        if (PerformanceConfig.lazyLoad.iframes) {
            const iframes = document.querySelectorAll('iframe:not([loading="lazy"])');
            iframes.forEach(iframe => {
                if (!iframe.src || iframe.src === window.location.href) return;
                
                // 保存原始src
                if (!iframe.dataset.src) {
                    iframe.dataset.src = iframe.src;
                    iframe.src = 'about:blank';
                    iframe.loading = 'lazy';
                }
            });
        }
        
        // 设置IntersectionObserver进行懒加载
        if ('IntersectionObserver' in window) {
            const lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // 加载图片或iframe
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            delete element.dataset.src;
                        }
                        
                        // 加载srcset
                        if (element.dataset.srcset) {
                            element.srcset = element.dataset.srcset;
                            delete element.dataset.srcset;
                        }
                        
                        lazyLoadObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: `${PerformanceConfig.lazyLoad.threshold}px 0px`,
                threshold: 0.01
            });
            
            // 观察所有懒加载元素
            document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
                lazyLoadObserver.observe(element);
            });
        } else {
            // 回退方案：简单的延迟加载
            setTimeout(() => {
                document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
                    element.src = element.dataset.src;
                    if (element.dataset.srcset) {
                        element.srcset = element.dataset.srcset;
                    }
                });
            }, 1000);
        }
    }
    
    // 应用代码分割优化
    function applyCodeSplittingOptimizations() {
        if (!PerformanceConfig.enabled || !PerformanceConfig.codeSplitting.enabled) return;
        
        PerformanceConfig.codeSplitting.modules.forEach(module => {
            // 检查是否需要加载此模块
            if (document.querySelector(module.condition)) {
                // 使用requestIdleCallback在浏览器空闲时加载
                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(() => loadModule(module.path));
                } else {
                    setTimeout(() => loadModule(module.path), 1000);
                }
            }
        });
    }
    
    // 加载JavaScript模块
    function loadModule(path) {
        const script = document.createElement('script');
        script.src = path;
        script.async = true;
        document.body.appendChild(script);
    }
    
    // 应用图片优化
    function applyImageOptimizations() {
        if (!PerformanceConfig.enabled || !PerformanceConfig.imageOptimization.enabled) return;
        
        // 如果已加载图片优化器，则不重复处理
        if (window.ImageOptimizer) return;
        
        // 加载图片优化器脚本
        loadModule('/js/image-optimizer.js');
    }
    
    // 应用CDN优化
    function applyCdnOptimizations() {
        if (!PerformanceConfig.enabled || !PerformanceConfig.cdn.enabled) return;
        
        // 检查是否已配置CDN URL
        if (!window.jsDelivr || !window.jsDelivr.url) return;
        
        const cdnUrl = window.jsDelivr.url;
        
        // 替换资源URL为CDN URL
        document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(element => {
            const src = element.src || element.href;
            if (!src) return;
            
            // 跳过已经使用CDN的资源
            if (src.includes('cdn.jsdelivr.net')) return;
            
            // 跳过排除的资源
            if (PerformanceConfig.cdn.exclude.some(exclude => src.includes(exclude))) return;
            
            // 替换为CDN URL
            const isExternal = src.startsWith('http') && !src.includes(window.location.hostname);
            if (!isExternal && src.startsWith('/')) {
                if (element.tagName === 'LINK') {
                    element.href = `${cdnUrl}${src}`;
                } else {
                    element.src = `${cdnUrl}${src}`;
                }
            }
        });
    }
    
    // 应用动画优化
    function applyAnimationOptimizations() {
        if (!PerformanceConfig.enabled) return;
        
        // 在移动设备上减少动画
        if (PerformanceConfig.isMobile && PerformanceConfig.animations.reduceOnMobile) {
            document.documentElement.classList.add('reduce-animation');
        }
        
        // 尊重用户的减少动画偏好
        if (PerformanceConfig.animations.respectReduceMotion && 
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduce-animation');
        }
    }
    
    // 初始化性能优化
    function init() {
        // 检测环境
        detectEnvironment();
        
        // 应用各种优化
        applyPreloadOptimizations();
        applyAnimationOptimizations();
        
        // 在DOM加载完成后应用其他优化
        document.addEventListener('DOMContentLoaded', () => {
            applyLazyLoadOptimizations();
            applyCodeSplittingOptimizations();
            applyImageOptimizations();
            applyCdnOptimizations();
        });
        
        // 导出配置供其他脚本使用
        window.PerformanceConfig = PerformanceConfig;
        
        console.log('Performance optimizations initialized');
    }
    
    // 启动优化
    init();
})();