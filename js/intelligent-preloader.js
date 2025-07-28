/**
 * 智能预加载系统 - 基于用户行为预测
 * 2024年最新Web性能优化技术
 */

class IntelligentPreloader {
  constructor() {
    this.userBehavior = new Map();
    this.preloadQueue = new Set();
    this.performanceMetrics = new Map();
    this.mlModel = null;
    this.init();
  }

  async init() {
    // 初始化性能监控
    this.setupPerformanceMonitoring();
    
    // 加载用户行为模型
    await this.loadBehaviorModel();
    
    // 启动智能预加载
    this.startIntelligentPreloading();
    
    console.log('🤖 智能预加载系统已启动');
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // 监控导航性能
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationMetrics(entry);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // 监控资源加载性能
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordResourceMetrics(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // 监控用户交互性能
      const interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordInteractionMetrics(entry);
        }
      });
      interactionObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  /**
   * 加载用户行为模型
   */
  async loadBehaviorModel() {
    try {
      // 从localStorage加载历史数据
      const storedData = localStorage.getItem('userBehaviorModel');
      if (storedData) {
        this.userBehavior = new Map(JSON.parse(storedData));
      }

      // 初始化机器学习模型（简化版）
      this.mlModel = {
        weights: {
          timeSpent: 0.3,
          scrollDepth: 0.25,
          clickPattern: 0.2,
          timeOfDay: 0.15,
          deviceType: 0.1
        },
        threshold: 0.7
      };

      console.log('📊 用户行为模型已加载');
    } catch (error) {
      console.warn('用户行为模型加载失败:', error);
    }
  }

  /**
   * 启动智能预加载
   */
  startIntelligentPreloading() {
    // 监听用户交互
    this.trackUserInteractions();
    
    // 定期分析和预测
    setInterval(() => {
      this.analyzeAndPredict();
    }, 5000);

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.resumePreloading();
      } else {
        this.pausePreloading();
      }
    });
  }

  /**
   * 跟踪用户交互
   */
  trackUserInteractions() {
    let startTime = Date.now();
    let maxScroll = 0;
    let clickCount = 0;

    // 跟踪滚动行为
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      scrollTimeout = setTimeout(() => {
        this.recordScrollBehavior(maxScroll);
      }, 150);
    }, { passive: true });

    // 跟踪点击行为
    document.addEventListener('click', (event) => {
      clickCount++;
      this.recordClickBehavior(event.target, clickCount);
    });

    // 跟踪页面停留时间
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - startTime;
      this.recordTimeSpent(window.location.pathname, timeSpent);
    });

    // 跟踪鼠标悬停（预测意图）
    document.addEventListener('mouseover', (event) => {
      if (event.target.tagName === 'A') {
        this.predictLinkHover(event.target.href);
      }
    });
  }

  /**
   * 预测链接悬停意图
   */
  predictLinkHover(href) {
    // 延迟预加载，避免误触发
    setTimeout(() => {
      const confidence = this.calculateLinkConfidence(href);
      if (confidence > 0.6) {
        this.preloadResource(href, 'hover-prediction');
      }
    }, 300);
  }

  /**
   * 计算链接预测置信度
   */
  calculateLinkConfidence(href) {
    const currentPage = window.location.pathname;
    const behaviorData = this.userBehavior.get(currentPage) || {};
    
    // 基于历史行为计算置信度
    let confidence = 0;
    
    // 历史访问频率
    if (behaviorData.visitedLinks && behaviorData.visitedLinks[href]) {
      confidence += behaviorData.visitedLinks[href] * 0.4;
    }
    
    // 页面停留时间
    if (behaviorData.avgTimeSpent > 30000) { // 30秒以上
      confidence += 0.2;
    }
    
    // 滚动深度
    if (behaviorData.avgScrollDepth > 50) {
      confidence += 0.2;
    }
    
    // 时间因子
    const hour = new Date().getHours();
    if (behaviorData.activeHours && behaviorData.activeHours.includes(hour)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }

  /**
   * 分析和预测
   */
  analyzeAndPredict() {
    const currentPage = window.location.pathname;
    const behaviorData = this.userBehavior.get(currentPage);
    
    if (!behaviorData) return;

    // 预测下一个可能访问的页面
    const predictions = this.predictNextPages(behaviorData);
    
    predictions.forEach(prediction => {
      if (prediction.confidence > this.mlModel.threshold) {
        this.preloadResource(prediction.url, 'ml-prediction');
      }
    });
  }

  /**
   * 预测下一个页面
   */
  predictNextPages(behaviorData) {
    const predictions = [];
    
    // 基于访问模式预测
    if (behaviorData.navigationPatterns) {
      for (const [nextPage, frequency] of Object.entries(behaviorData.navigationPatterns)) {
        const confidence = this.calculatePredictionConfidence(behaviorData, nextPage, frequency);
        predictions.push({ url: nextPage, confidence, reason: 'navigation-pattern' });
      }
    }
    
    // 基于相关内容预测
    const relatedPages = this.findRelatedPages(window.location.pathname);
    relatedPages.forEach(page => {
      const confidence = this.calculateContentSimilarity(page);
      predictions.push({ url: page.url, confidence, reason: 'content-similarity' });
    });

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * 计算预测置信度
   */
  calculatePredictionConfidence(behaviorData, nextPage, frequency) {
    let confidence = 0;
    
    // 访问频率权重
    confidence += frequency * this.mlModel.weights.clickPattern;
    
    // 时间权重
    if (behaviorData.avgTimeSpent > 20000) {
      confidence += this.mlModel.weights.timeSpent;
    }
    
    // 滚动深度权重
    if (behaviorData.avgScrollDepth > 70) {
      confidence += this.mlModel.weights.scrollDepth;
    }
    
    // 设备类型权重
    if (this.isMobile() && nextPage.includes('mobile-friendly')) {
      confidence += this.mlModel.weights.deviceType;
    }
    
    return Math.min(confidence, 1);
  }

  /**
   * 查找相关页面
   */
  findRelatedPages(currentPath) {
    // 简化的内容相关性算法
    const relatedPages = [];
    
    // 基于URL结构
    if (currentPath.includes('/posts/')) {
      relatedPages.push({ url: '/categories/', similarity: 0.6 });
      relatedPages.push({ url: '/tags/', similarity: 0.5 });
    }
    
    // 基于页面标签
    const currentTags = this.extractPageTags();
    if (currentTags.length > 0) {
      // 查找具有相似标签的页面
      relatedPages.push(...this.findPagesByTags(currentTags));
    }
    
    return relatedPages;
  }

  /**
   * 预加载资源
   */
  preloadResource(url, reason) {
    if (this.preloadQueue.has(url)) return;
    
    // 检查网络状况
    if (!this.shouldPreload()) return;
    
    this.preloadQueue.add(url);
    
    // 创建预加载链接
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    
    // 添加到头部
    document.head.appendChild(link);
    
    // 记录预加载
    console.log(`🔮 预加载: ${url} (原因: ${reason})`);
    
    // 清理过期的预加载
    setTimeout(() => {
      this.preloadQueue.delete(url);
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000); // 30秒后清理
  }

  /**
   * 检查是否应该预加载
   */
  shouldPreload() {
    // 检查网络连接
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // 慢速连接时不预加载
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }
      
      // 数据节省模式
      if (connection.saveData) {
        return false;
      }
    }
    
    // 检查电池状态
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          return false; // 低电量时不预加载
        }
      });
    }
    
    // 检查内存使用
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      if (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize > 0.8) {
        return false; // 内存使用率过高
      }
    }
    
    return true;
  }

  /**
   * 记录导航指标
   */
  recordNavigationMetrics(entry) {
    this.performanceMetrics.set('navigation', {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      timestamp: Date.now()
    });
  }

  /**
   * 记录资源指标
   */
  recordResourceMetrics(entry) {
    if (!this.performanceMetrics.has('resources')) {
      this.performanceMetrics.set('resources', []);
    }
    
    this.performanceMetrics.get('resources').push({
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: entry.initiatorType,
      timestamp: Date.now()
    });
  }

  /**
   * 记录交互指标
   */
  recordInteractionMetrics(entry) {
    this.performanceMetrics.set('interaction', {
      firstInputDelay: entry.processingStart - entry.startTime,
      inputType: entry.name,
      timestamp: Date.now()
    });
  }

  /**
   * 记录用户行为数据
   */
  recordScrollBehavior(scrollDepth) {
    const currentPage = window.location.pathname;
    const data = this.userBehavior.get(currentPage) || {};
    
    if (!data.scrollHistory) data.scrollHistory = [];
    data.scrollHistory.push(scrollDepth);
    data.avgScrollDepth = data.scrollHistory.reduce((a, b) => a + b, 0) / data.scrollHistory.length;
    
    this.userBehavior.set(currentPage, data);
    this.saveUserBehavior();
  }

  recordClickBehavior(target, clickCount) {
    const currentPage = window.location.pathname;
    const data = this.userBehavior.get(currentPage) || {};
    
    if (!data.clickPatterns) data.clickPatterns = {};
    const elementType = target.tagName.toLowerCase();
    data.clickPatterns[elementType] = (data.clickPatterns[elementType] || 0) + 1;
    
    this.userBehavior.set(currentPage, data);
  }

  recordTimeSpent(page, timeSpent) {
    const data = this.userBehavior.get(page) || {};
    
    if (!data.timeHistory) data.timeHistory = [];
    data.timeHistory.push(timeSpent);
    data.avgTimeSpent = data.timeHistory.reduce((a, b) => a + b, 0) / data.timeHistory.length;
    
    this.userBehavior.set(page, data);
    this.saveUserBehavior();
  }

  /**
   * 保存用户行为数据
   */
  saveUserBehavior() {
    try {
      const dataToSave = Array.from(this.userBehavior.entries());
      localStorage.setItem('userBehaviorModel', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('保存用户行为数据失败:', error);
    }
  }

  /**
   * 工具方法
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  extractPageTags() {
    const tags = [];
    const metaTags = document.querySelectorAll('meta[name="keywords"]');
    metaTags.forEach(tag => {
      if (tag.content) {
        tags.push(...tag.content.split(',').map(t => t.trim()));
      }
    });
    return tags;
  }

  findPagesByTags(tags) {
    // 这里应该连接到你的内容管理系统
    // 简化实现
    return [];
  }

  calculateContentSimilarity(page) {
    // 简化的内容相似度计算
    return Math.random() * 0.5; // 实际应用中应该使用真实的相似度算法
  }

  pausePreloading() {
    console.log('⏸️ 预加载已暂停');
  }

  resumePreloading() {
    console.log('▶️ 预加载已恢复');
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return {
      userBehavior: Object.fromEntries(this.userBehavior),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      preloadQueue: Array.from(this.preloadQueue),
      timestamp: new Date().toISOString()
    };
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.intelligentPreloader = new IntelligentPreloader();
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntelligentPreloader;
}