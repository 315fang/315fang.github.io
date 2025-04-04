/**
 * 博客性能优化集成脚本
 * 这个脚本用于自动加载所有优化后的资源，并应用性能优化配置
 */

(function() {
    'use strict';
    
    // 加载配置
    const config = window.BLOG_PERFORMANCE_CONFIG || {
        enableOptimizations: true,
        resources: { lazyLoad: true, preload: { enabled: true }, defer: { enabled: true } },
        images: { lazyLoad: true, webp: true },
        javascript: { debounce: { enabled: true }, useWebWorkers: true },
        css: { useWillChange: true, useContainment: true },
        caching: { localStorage: true, indexedDB: true }
    };
    
    // 如果禁用了优化，直接返回
    if (!config.enableOptimizations) return;
    
    // 替换CSS文件
    function replaceCssFile(oldPath, newPath) {
        const links = document.querySelectorAll(`link[rel="stylesheet"][href*="${oldPath}"]`);
        if (links.length > 0) {
            links.forEach(link => {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = link.href.replace(oldPath, newPath);
                newLink.onload = function() {
                    link.parentNode.removeChild(link);
                };
                document.head.appendChild(newLink);
            });
        } else {
            // 如果没有找到旧文件，直接加载新文件
            loadStylesheet(newPath);
        }
    }
    
    // 替换JS文件
    function replaceJsFile(oldPath, newPath) {
        const scripts = document.querySelectorAll(`script[src*="${oldPath}"]`);
        if (scripts.length > 0) {
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                newScript.src = script.src.replace(oldPath, newPath);
                newScript.async = true;
                newScript.onload = function() {
                    script.parentNode.removeChild(script);
                };
                document.body.appendChild(newScript);
            });
        } else {
            // 如果没有找到旧文件，直接加载新文件
            loadScript(newPath);
        }
    }
    
    // 加载CSS文件
    function loadStylesheet(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }
    
    // 加载JavaScript文件
    function loadScript(url) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.body.appendChild(script);
    }
    
    // 应用CSS优化
    function applyCssOptimizations() {
        // 替换自定义CSS
        replaceCssFile('my.css', 'my.optimized.css');
        
        // 加载搜索优化CSS
        loadStylesheet('/css/search.optimized.css');
        
        // 如果配置了减少动画，添加相应的类
        if (config.css.reduceAnimations) {
            document.documentElement.classList.add('reduce-animations');
        }
    }
    
    // 应用JavaScript优化
    function applyJsOptimizations() {
        // 替换搜索脚本
        replaceJsFile('search.js', 'search.further.optimized.js');
        
        // 替换主脚本
        replaceJsFile('matery.js', 'matery.optimized.js');
        
        // 加载图片优化脚本
        if (config.images.lazyLoad) {
            loadScript('/js/image-optimizer.complete.js');
        }
        
        // 加载资源延迟加载脚本
        if (config.resources.defer.enabled) {
            loadScript('/js/lazy-load.js');
        }
    }
    
    // 添加性能监控
    function setupPerformanceMonitoring() {
        if (!config.monitoring.enabled) return;
        
        // 采样率检查
        if (Math.random() * 100 > config.monitoring.sampleRate) return;
        
        // 记录性能指标
        function logPerformanceMetrics() {
            if (!performance || !performance.getEntriesByType) return;
            
            // 获取性能指标
            const pageNav = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');
            
            // 计算关键指标
            const metrics = {
                loadTime: pageNav ? pageNav.loadEventEnd - pageNav.startTime : undefined,
                domContentLoaded: pageNav ? pageNav.domContentLoadedEventEnd - pageNav.startTime : undefined,
                firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
                firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
            };
            
            // 记录到控制台
            if (config.monitoring.logToConsole) {
                console.log('Performance Metrics:', metrics);
            }
            
            // 如果配置了上报地址，发送数据
            if (config.monitoring.reportURI) {
                try {
                    const blob = new Blob([JSON.stringify(metrics)], { type: 'application/json' });
                    navigator.sendBeacon(config.monitoring.reportURI, blob);
                } catch (e) {
                    console.error('Failed to report performance metrics:', e);
                }
            }
        }
        
        // 页面加载完成后记录指标
        window.addEventListener('load', () => {
            // 延迟执行，确保所有资源都已加载
            setTimeout(logPerformanceMetrics, 0);
        });
    }
    
    // 初始化
    function init() {
        // 应用CSS优化
        applyCssOptimizations();
        
        // 应用JavaScript优化
        applyJsOptimizations();
        
        // 设置性能监控
        setupPerformanceMonitoring();
    }
    
    // 在DOM准备好后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();