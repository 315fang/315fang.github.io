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
        img.on