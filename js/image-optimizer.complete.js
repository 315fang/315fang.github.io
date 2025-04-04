/**
 * 图片优化脚本
 * 用于优化博客中的图片加载，提高页面性能
 */

(function() {
    'use strict';
    
    // 配置
    const config = {
        lazyLoadThreshold: '200px', // 懒加载阈值
        lowQualityPreview: true,    // 是否使用低质量预览
        preloadImages: true,        // 是否预加载可能会看到的图片
        useWebP: true,              // 如果浏览器支持，是否使用WebP格式
        progressiveJpeg: true       // 是否使用渐进式JPEG
    };
    
    // 检查浏览器是否支持WebP
    function checkWebPSupport() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    }
    
    // 创建低质量预览
    function createLowQualityPreview(img) {
        // 如果已经有src，不创建预览
        if (img.src && !img.src.includes('data:image')) return;
        
        // 创建一个简单的占位符
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.getAttribute('width') || 100;
        canvas.height = img.getAttribute('height') || 100;
        
        // 填充模糊的背景色
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 设置为图片的src
        img.src = canvas.toDataURL('image/jpeg', 0.1);
        img.style.filter = 'blur(10px)';
    }
    
    // 设置图片懒加载
    function setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            loadAllImages();
            return;
        }
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: config.lazyLoadThreshold });
        
        // 观察所有带有data-src属性的图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            // 如果配置了低质量预览，创建预览
            if (config.lowQualityPreview) {
                createLowQualityPreview(img);
            }
            
            imageObserver.observe(img);
        });
    }
    
    // 加载图片
    function loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;
        
        // 如果支持WebP且配置了使用WebP
        if (config.useWebP && checkWebPSupport() && !src.endsWith('.svg') && !src.endsWith('.gif')) {
            // 尝试加载WebP版本
            const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
            loadImageWithFallback(img, webpSrc, src);
        } else {
            // 直接加载原始图片
            setImageSrc(img, src);
        }
    }
    
    // 带有回退的图片加载
    function loadImageWithFallback(img, primarySrc, fallbackSrc) {
        const tempImg = new Image();
        tempImg.onload = function() {
            setImageSrc(img, primarySrc);
        };
        tempImg.onerror = function() {
            setImageSrc(img, fallbackSrc);
        };
        tempImg.src = primarySrc;
    }
    
    // 设置图片src并移除模糊效果
    function setImageSrc(img, src) {
        img.src = src;
        img.removeAttribute('data-src');
        
        // 移除模糊效果
        img.style.filter = '';
        
        // 添加淡入效果
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in';
        
        // 图片加载完成后淡入
        img.onload = function() {
            img.style.opacity = '1';
        };
    }
    
    // 预加载可能会看到的图片
    function preloadImages() {
        if (!config.preloadImages) return;
        
        // 获取所有可见图片
        const visibleImages = Array.from(document.querySelectorAll('img[data-src]')).filter(img => {
            const rect = img.getBoundingClientRect();
            return (
                rect.top >= -window.innerHeight * 2 &&
                rect.bottom <= window.innerHeight * 3
            );
        });
        
        // 预加载前10张可见图片
        visibleImages.slice(0, 10).forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                const preloadImg = new Image();
                preloadImg.src = src;
            }
        });
    }
    
    // 加载所有图片（用于不支持IntersectionObserver的浏览器）
    function loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            loadImage(img);
        });
    }
    
    // 优化已有的图片
    function optimizeExistingImages() {
        // 为所有图片添加加载错误处理
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('data-src') && !img.hasAttribute('data-optimized')) {
                img.setAttribute('data-optimized', 'true');
                
                // 添加错误处理
                img.onerror = function() {
                    // 设置一个简单的占位符
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="%23999"%3EImage Error%3C/text%3E%3C/svg%3E';
                    this.style.opacity = '0.7';
                };
                
                // 添加宽高属性以减少布局偏移
                if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
                    const ratio = img.naturalHeight / img.naturalWidth || 0.75;
                    if (ratio) {
                        img.style.aspectRatio = `${1} / ${ratio}`;
                    }
                }
                
                // 添加loading="lazy"属性（对于支持的浏览器）
                if ('loading' in HTMLImageElement.prototype) {
                    img.loading = 'lazy';
                }
                
                // 添加decoding="async"属性
                img.decoding = 'async';
            }
        });
    }
    
    // 初始化
    function init() {
        // 设置懒加载
        setupLazyLoading();
        
        // 优化已有图片
        optimizeExistingImages();
        
        // 预加载可能会看到的图片
        if (document.readyState === 'complete') {
            preloadImages();
        } else {
            window.addEventListener('load', preloadImages);
        }
        
        // 在滚动时预加载图片
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(preloadImages, 200);
        }, { passive: true });
    }
    
    // 在DOM准备好后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();