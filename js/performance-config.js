/**
 * 性能优化配置文件
 * 集中管理所有性能优化设置，方便根据需求调整优化参数
 */

window.BLOG_PERFORMANCE_CONFIG = {
    // 全局开关
    enableOptimizations: true,  // 是否启用所有性能优化
    
    // 资源加载优化
    resources: {
        lazyLoad: true,           // 是否启用图片和iframe懒加载
        preload: {                // 预加载关键资源
            enabled: true,
            criticalCSS: true,    // 是否内联关键CSS
            fonts: true           // 是否预加载字体文件
        },
        defer: {                  // 延迟加载非关键资源
            enabled: true,
            thirdPartyScripts: true,  // 是否延迟加载第三方脚本
            nonCriticalCSS: true      // 是否延迟加载非关键CSS
        }
    },
    
    // 图片优化
    images: {
        lazyLoad: true,           // 是否启用图片懒加载
        lowQualityPreview: true,  // 是否使用低质量图片预览
        webp: true,               // 如果浏览器支持，是否使用WebP格式
        responsiveImages: true,   // 是否使用响应式图片
        lazyLoadThreshold: '200px' // 懒加载阈值
    },
    
    // JavaScript优化
    javascript: {
        debounce: {               // 防抖设置
            enabled: true,
            searchDelay: 250,      // 搜索输入防抖延迟（毫秒）
            scrollDelay: 100,      // 滚动事件防抖延迟（毫秒）
            resizeDelay: 250       // 窗口调整事件防抖延迟（毫秒）
        },
        asyncLoading: true,       // 是否异步加载JS文件
        codeOptimization: true,   // 是否启用代码优化（减少DOM操作等）
        useWebWorkers: true,      // 是否使用Web Workers处理复杂计算
        useRequestIdleCallback: true // 是否使用requestIdleCallback进行非关键操作
    },
    
    // CSS优化
    css: {
        reduceAnimations: false,  // 是否减少动画效果（对于低端设备）
        optimizeSelectors: true,  // 是否优化CSS选择器
        useWillChange: true,      // 是否使用will-change属性
        useContainment: true,     // 是否使用CSS containment
        useGPUAcceleration: true  // 是否使用GPU加速
    },
    
    // 缓存策略
    caching: {
        localStorage: true,        // 是否使用localStorage缓存数据
        sessionStorage: true,      // 是否使用sessionStorage缓存临时数据
        indexedDB: true,          // 是否使用IndexedDB缓存大量数据
        cacheAPI: true            // 是否使用Cache API缓存资源
    },
    
    // 性能监控
    monitoring: {
        enabled: true,            // 是否启用性能监控
        logToConsole: true,       // 是否在控制台输出性能日志
        sampleRate: 10,           // 采样率（百分比）
        reportURI: '',            // 性能数据上报地址（如果需要）
        trackResources: true,     // 是否跟踪资源加载性能
        trackFirstPaint: true,    // 是否跟踪首次绘制时间
        trackLayoutShifts: true   // 是否跟踪布局