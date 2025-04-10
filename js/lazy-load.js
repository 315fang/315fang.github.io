/**
 * 延迟加载非关键资源
 * 这个脚本用于优化页面加载性能，将非关键资源的加载推迟到页面初始渲染之后
 */

(function() {
    'use strict';
    
    // 配置需要延迟加载的资源
    const lazyResources = {
        // CSS文件
        styles: [
            // 添加需要延迟加载的CSS文件路径
            // 例如: '/css/non-critical.css'
        ],
        // JavaScript文件
        scripts: [
            // 添加需要延迟加载的JS文件路径
            // 例如: '/js/analytics.js'
        ],
        // 字体文件
        fonts: [
            // 添加需要延迟加载的字体文件
            // 例如: { family: 'Font Name', url: '/fonts/font.woff2' }
        ]
    };
    
    // 使用Intersection Observer API检测元素是否进入视口
    function setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            // 延迟加载图片
            lazyLoadImages();
            
            // 延迟加载iframe
            lazyLoadIframes();
        } else {
            // 如果浏览器不支持Intersection Observer，立即加载所有资源
            loadAllResources();
        }
    }
    
    // 延迟加载图片
    function lazyLoadImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '200px 0px' });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // 延迟加载iframe
    function lazyLoadIframes() {
        const iframeObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    const src = iframe.getAttribute('data-src');
                    if (src) {
                        iframe.src = src;
                        iframe.removeAttribute('data-src');
                        observer.unobserve(iframe);
                    }
                }
            });
        }, { rootMargin: '200px 0px' });
        
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframeObserver.observe(iframe);
        });
    }
    
    // 加载CSS文件
    function loadStylesheet(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    // 加载JavaScript文件
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    // 加载字体
    function loadFont(fontConfig) {
        if ('fonts' in document) {
            const font = new FontFace(fontConfig.family, `url(${fontConfig.url})`);
            font.load().then(loadedFont => {
                document.fonts.add(loadedFont);
            }).catch(err => {
                console.error('字体加载失败:', err);
            });
        }
    }
    
    // 加载所有资源（用于不支持Intersection Observer的浏览器）
    function loadAllResources() {
        // 加载所有图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
        
        // 加载所有iframe
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.src = iframe.getAttribute('data-src');
            iframe.removeAttribute('data-src');
        });
    }
    
    // 在页面加载完成后开始延迟加载资源
    function init() {
        // 设置延迟加载
        setupLazyLoading();
        
        // 使用requestIdleCallback在浏览器空闲时加载非关键资源
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                // 加载CSS文件
                lazyResources.styles.forEach(url => loadStylesheet(url));
                
                // 加载字体
                lazyResources.fonts.forEach(fontConfig => loadFont(fontConfig));
                
                // 延迟加载JavaScript文件
                setTimeout(() => {
                    lazyResources.scripts.forEach(url => loadScript(url));
                }, 2000); // 延迟2秒加载JS文件
            });
        } else {
            // 对于不支持requestIdleCallback的浏览器，使用setTimeout
            setTimeout(() => {
                lazyResources.styles.forEach(url => loadStylesheet(url));
                lazyResources.fonts.forEach(fontConfig => loadFont(fontConfig));
                
                setTimeout(() => {
                    lazyResources.scripts.forEach(url => loadScript(url));
                }, 2000);
            }, 100);
        }
    }
    
    // 在页面加载完成后初始化
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();