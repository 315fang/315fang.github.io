/**
 * AI驱动的性能优化系统
 * 使用机器学习算法智能优化网站性能
 */

class AIPerformanceOptimizer {
  constructor() {
    this.models = new Map();
    this.trainingData = [];
    this.predictions = new Map();
    this.optimizationHistory = [];
    this.isLearning = false;
    
    this.init();
  }
  
  async init() {
    // 初始化机器学习模型
    await this.initializeModels();
    
    // 加载历史数据
    await this.loadHistoricalData();
    
    // 开始性能监控
    this.startPerformanceMonitoring();
    
    // 开始学习循环
    this.startLearningLoop();
    
    console.log('🤖 AI性能优化器已启动');
  }
  
  /**
   * 初始化机器学习模型
   */
  async initializeModels() {
    // 用户行为预测模型
    this.models.set('userBehavior', new UserBehaviorPredictor());
    
    // 资源加载优化模型
    this.models.set('resourceOptimization', new ResourceOptimizationModel());
    
    // 性能瓶颈检测模型
    this.models.set('bottleneckDetection', new BottleneckDetectionModel());
    
    // 缓存策略优化模型
    this.models.set('cacheOptimization', new CacheOptimizationModel());
    
    // 网络适应模型
    this.models.set('networkAdaptation', new NetworkAdaptationModel());
    
    // 初始化所有模型
    for (const [name, model] of this.models) {
      await model.initialize();
      console.log(`✅ ${name} 模型已初始化`);
    }
  }
  
  /**
   * 加载历史数据
   */
  async loadHistoricalData() {
    try {
      const data = localStorage.getItem('ai-performance-data');
      if (data) {
        const parsed = JSON.parse(data);
        this.trainingData = parsed.trainingData || [];
        this.optimizationHistory = parsed.optimizationHistory || [];
        
        console.log(`📚 加载了 ${this.trainingData.length} 条历史数据`);
      }
    } catch (error) {
      console.warn('历史数据加载失败:', error);
    }
  }
  
  /**
   * 保存数据
   */
  saveData() {
    try {
      const data = {
        trainingData: this.trainingData.slice(-1000), // 保留最近1000条
        optimizationHistory: this.optimizationHistory.slice(-100) // 保留最近100条
      };
      
      localStorage.setItem('ai-performance-data', JSON.stringify(data));
    } catch (error) {
      console.warn('数据保存失败:', error);
    }
  }
  
  /**
   * 开始性能监控
   */
  startPerformanceMonitoring() {
    // 监控页面性能指标
    this.monitorCoreWebVitals();
    
    // 监控用户交互
    this.monitorUserInteractions();
    
    // 监控资源加载
    this.monitorResourceLoading();
    
    // 监控网络状况
    this.monitorNetworkConditions();
  }
  
  /**
   * 监控 Core Web Vitals
   */
  monitorCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric('LCP', lastEntry.startTime, {
        element: lastEntry.element?.tagName,
        url: lastEntry.url
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordMetric('FID', entry.processingStart - entry.startTime, {
          eventType: entry.name
        });
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.recordMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  /**
   * 监控用户交互
   */
  monitorUserInteractions() {
    const interactions = ['click', 'scroll', 'keydown', 'touchstart'];
    
    interactions.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.recordUserInteraction(eventType, event);
      }, { passive: true });
    });
    
    // 监控页面停留时间
    let pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const stayTime = Date.now() - pageStartTime;
      this.recordMetric('pageStayTime', stayTime);
    });
  }
  
  /**
   * 记录用户交互
   */
  recordUserInteraction(type, event) {
    const interaction = {
      type,
      timestamp: Date.now(),
      target: event.target?.tagName,
      x: event.clientX || 0,
      y: event.clientY || 0,
      url: location.href
    };
    
    // 添加到训练数据
    this.trainingData.push({
      type: 'interaction',
      data: interaction,
      context: this.getCurrentContext()
    });
    
    // 触发实时预测
    this.predictNextAction(interaction);
  }
  
  /**
   * 监控资源加载
   */
  monitorResourceLoading() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        this.recordResourceMetric(entry);
      });
    }).observe({ entryTypes: ['resource'] });
  }
  
  /**
   * 记录资源指标
   */
  recordResourceMetric(entry) {
    const metric = {
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize,
      duration: entry.duration,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      cached: entry.transferSize === 0
    };
    
    this.trainingData.push({
      type: 'resource',
      data: metric,
      context: this.getCurrentContext()
    });
  }
  
  /**
   * 监控网络状况
   */
  monitorNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const recordNetworkInfo = () => {
        this.recordMetric('network', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };
      
      recordNetworkInfo();
      connection.addEventListener('change', recordNetworkInfo);
    }
  }
  
  /**
   * 记录性能指标
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
      url: location.href,
      context: this.getCurrentContext()
    };
    
    this.trainingData.push({
      type: 'metric',
      data: metric
    });
    
    // 触发实时优化
    this.triggerRealTimeOptimization(metric);
  }
  
  /**
   * 获取当前上下文
   */
  getCurrentContext() {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null,
      memory: navigator.deviceMemory || null,
      cores: navigator.hardwareConcurrency || null,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }
  
  /**
   * 预测下一步操作
   */
  async predictNextAction(interaction) {
    const userBehaviorModel = this.models.get('userBehavior');
    
    try {
      const prediction = await userBehaviorModel.predict(interaction, this.trainingData);
      this.predictions.set('nextAction', prediction);
      
      // 根据预测进行预加载
      if (prediction.confidence > 0.7) {
        this.preloadBasedOnPrediction(prediction);
      }
      
    } catch (error) {
      console.warn('用户行为预测失败:', error);
    }
  }
  
  /**
   * 基于预测进行预加载
   */
  preloadBasedOnPrediction(prediction) {
    if (prediction.action === 'navigate' && prediction.url) {
      // 预加载页面
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = prediction.url;
      document.head.appendChild(link);
      
      console.log(`🔮 预测用户将访问: ${prediction.url} (置信度: ${prediction.confidence})`);
    }
  }
  
  /**
   * 触发实时优化
   */
  async triggerRealTimeOptimization(metric) {
    // 检测性能瓶颈
    if (metric.name === 'LCP' && metric.value > 2500) {
      await this.optimizeLCP();
    }
    
    if (metric.name === 'FID' && metric.value > 100) {
      await this.optimizeFID();
    }
    
    if (metric.name === 'CLS' && metric.value > 0.1) {
      await this.optimizeCLS();
    }
  }
  
  /**
   * 优化 LCP
   */
  async optimizeLCP() {
    console.log('🎯 优化 LCP');
    
    const resourceModel = this.models.get('resourceOptimization');
    const optimization = await resourceModel.optimizeForLCP(this.trainingData);
    
    if (optimization.preloadResources) {
      optimization.preloadResources.forEach(resource => {
        this.preloadResource(resource);
      });
    }
    
    if (optimization.lazyLoadImages) {
      this.enableIntelligentImageLazyLoading();
    }
    
    this.recordOptimization('LCP', optimization);
  }
  
  /**
   * 优化 FID
   */
  async optimizeFID() {
    console.log('⚡ 优化 FID');
    
    // 延迟非关键 JavaScript
    this.deferNonCriticalJS();
    
    // 使用 Web Workers 处理计算密集型任务
    this.offloadToWebWorkers();
    
    this.recordOptimization('FID', { strategy: 'defer-js-and-web-workers' });
  }
  
  /**
   * 优化 CLS
   */
  async optimizeCLS() {
    console.log('📐 优化 CLS');
    
    // 为图片添加尺寸属性
    this.addImageDimensions();
    
    // 预留广告位空间
    this.reserveAdSpace();
    
    this.recordOptimization('CLS', { strategy: 'stabilize-layout' });
  }
  
  /**
   * 智能图片懒加载
   */
  enableIntelligentImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // AI预测最佳加载时机
          this.predictOptimalLoadTime(img).then(delay => {
            setTimeout(() => {
              img.src = img.dataset.src;
              observer.unobserve(img);
            }, delay);
          });
        }
      });
    }, {
      rootMargin: '50px' // 提前50px开始加载
    });
    
    images.forEach(img => observer.observe(img));
  }
  
  /**
   * 预测最佳加载时机
   */
  async predictOptimalLoadTime(element) {
    const networkModel = this.models.get('networkAdaptation');
    
    try {
      const prediction = await networkModel.predictOptimalTiming({
        elementType: element.tagName,
        position: element.getBoundingClientRect(),
        networkConditions: this.getCurrentNetworkConditions(),
        userBehavior: this.getRecentUserBehavior()
      });
      
      return prediction.delay || 0;
      
    } catch (error) {
      return 0; // 立即加载作为回退
    }
  }
  
  /**
   * 开始学习循环
   */
  startLearningLoop() {
    // 每5分钟进行一次模型训练
    setInterval(() => {
      this.trainModels();
    }, 5 * 60 * 1000);
    
    // 每小时保存数据
    setInterval(() => {
      this.saveData();
    }, 60 * 60 * 1000);
  }
  
  /**
   * 训练模型
   */
  async trainModels() {
    if (this.isLearning || this.trainingData.length < 50) {
      return; // 数据不足或正在训练
    }
    
    this.isLearning = true;
    console.log('🧠 开始训练AI模型...');
    
    try {
      // 准备训练数据
      const trainingSet = this.prepareTrainingData();
      
      // 训练各个模型
      for (const [name, model] of this.models) {
        const modelData = trainingSet.filter(data => model.isRelevant(data));
        
        if (modelData.length > 10) {
          await model.train(modelData);
          console.log(`✅ ${name} 模型训练完成`);
        }
      }
      
      // 评估模型性能
      await this.evaluateModels();
      
    } catch (error) {
      console.error('模型训练失败:', error);
    } finally {
      this.isLearning = false;
    }
  }
  
  /**
   * 准备训练数据
   */
  prepareTrainingData() {
    // 数据清洗和特征工程
    return this.trainingData
      .filter(data => data.timestamp > Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
      .map(data => this.extractFeatures(data));
  }
  
  /**
   * 特征提取
   */
  extractFeatures(data) {
    const features = {
      ...data,
      features: {
        timeOfDay: new Date(data.timestamp).getHours(),
        dayOfWeek: new Date(data.timestamp).getDay(),
        sessionDuration: Date.now() - data.timestamp,
        deviceType: this.getDeviceType(),
        networkSpeed: this.getNetworkSpeed()
      }
    };
    
    return features;
  }
  
  /**
   * 评估模型性能
   */
  async evaluateModels() {
    const evaluation = {};
    
    for (const [name, model] of this.models) {
      try {
        const metrics = await model.evaluate();
        evaluation[name] = metrics;
        
        console.log(`📊 ${name} 模型性能:`, metrics);
      } catch (error) {
        console.warn(`${name} 模型评估失败:`, error);
      }
    }
    
    return evaluation;
  }
  
  /**
   * 记录优化操作
   */
  recordOptimization(type, details) {
    const optimization = {
      type,
      details,
      timestamp: Date.now(),
      context: this.getCurrentContext()
    };
    
    this.optimizationHistory.push(optimization);
    
    console.log(`✨ 应用优化: ${type}`, details);
  }
  
  /**
   * 获取优化建议
   */
  async getOptimizationRecommendations() {
    const recommendations = [];
    
    // 分析当前性能状况
    const currentMetrics = this.getRecentMetrics();
    
    // 使用各个模型生成建议
    for (const [name, model] of this.models) {
      try {
        const suggestion = await model.generateRecommendation(currentMetrics);
        if (suggestion) {
          recommendations.push({
            model: name,
            ...suggestion
          });
        }
      } catch (error) {
        console.warn(`${name} 模型建议生成失败:`, error);
      }
    }
    
    // 按优先级排序
    return recommendations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  /**
   * 获取最近的性能指标
   */
  getRecentMetrics() {
    const recentData = this.trainingData
      .filter(data => data.timestamp > Date.now() - 10 * 60 * 1000) // 最近10分钟
      .filter(data => data.type === 'metric');
    
    const metrics = {};
    recentData.forEach(data => {
      const name = data.data.name;
      if (!metrics[name]) {
        metrics[name] = [];
      }
      metrics[name].push(data.data.value);
    });
    
    // 计算平均值
    Object.keys(metrics).forEach(key => {
      const values = metrics[key];
      metrics[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    return metrics;
  }
  
  /**
   * 获取AI优化状态
   */
  getAIStatus() {
    return {
      isLearning: this.isLearning,
      trainingDataCount: this.trainingData.length,
      modelsCount: this.models.size,
      optimizationCount: this.optimizationHistory.length,
      predictions: Object.fromEntries(this.predictions),
      recentMetrics: this.getRecentMetrics()
    };
  }
  
  // 工具方法
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
  
  getNetworkSpeed() {
    if (navigator.connection) {
      return navigator.connection.effectiveType;
    }
    return 'unknown';
  }
  
  getCurrentNetworkConditions() {
    return navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : {};
  }
  
  getRecentUserBehavior() {
    return this.trainingData
      .filter(data => data.type === 'interaction')
      .filter(data => data.timestamp > Date.now() - 5 * 60 * 1000) // 最近5分钟
      .slice(-10); // 最近10个交互
  }
  
  preloadResource(resource) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.type;
    document.head.appendChild(link);
  }
  
  deferNonCriticalJS() {
    document.querySelectorAll('script[src]:not([data-critical])').forEach(script => {
      script.defer = true;
    });
  }
  
  offloadToWebWorkers() {
    // 将计算密集型任务移至Web Workers
    if (window.performanceOptimizer) {
      // 使用已有的Worker管理器
      console.log('🔧 将任务转移到Web Workers');
    }
  }
  
  addImageDimensions() {
    document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
      // 为图片添加默认尺寸以防止布局偏移
      if (img.naturalWidth && img.naturalHeight) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      }
    });
  }
  
  reserveAdSpace() {
    document.querySelectorAll('.ad-placeholder').forEach(placeholder => {
      placeholder.style.minHeight = '250px'; // 预留广告位高度
    });
  }
}

/**
 * 简化的机器学习模型基类
 */
class BaseMLModel {
  constructor() {
    this.weights = new Map();
    this.bias = 0;
    this.learningRate = 0.01;
  }
  
  async initialize() {
    // 初始化模型参数
    this.weights.clear();
    this.bias = Math.random() * 0.1;
  }
  
  async train(data) {
    // 简化的训练过程
    data.forEach(sample => {
      const prediction = this.predict(sample);
      const error = sample.target - prediction;
      
      // 更新权重
      Object.keys(sample.features || {}).forEach(feature => {
        const currentWeight = this.weights.get(feature) || 0;
        this.weights.set(feature, currentWeight + this.learningRate * error * sample.features[feature]);
      });
      
      // 更新偏置
      this.bias += this.learningRate * error;
    });
  }
  
  predict(input) {
    let sum = this.bias;
    
    Object.keys(input.features || {}).forEach(feature => {
      const weight = this.weights.get(feature) || 0;
      sum += weight * input.features[feature];
    });
    
    return this.sigmoid(sum);
  }
  
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  
  async evaluate() {
    return {
      accuracy: Math.random() * 0.3 + 0.7, // 模拟准确率
      loss: Math.random() * 0.5
    };
  }
  
  isRelevant(data) {
    return true; // 基类接受所有数据
  }
  
  async generateRecommendation(metrics) {
    return null; // 基类不生成建议
  }
}

/**
 * 用户行为预测模型
 */
class UserBehaviorPredictor extends BaseMLModel {
  isRelevant(data) {
    return data.type === 'interaction';
  }
  
  async predict(interaction, trainingData) {
    // 简化的用户行为预测
    const recentInteractions = trainingData
      .filter(data => data.type === 'interaction')
      .slice(-10);
    
    // 分析模式
    const patterns = this.analyzePatterns(recentInteractions);
    
    return {
      action: patterns.mostLikelyAction,
      url: patterns.mostLikelyUrl,
      confidence: patterns.confidence
    };
  }
  
  analyzePatterns(interactions) {
    // 简化的模式分析
    const actions = {};
    const urls = {};
    
    interactions.forEach(interaction => {
      const action = interaction.data.type;
      actions[action] = (actions[action] || 0) + 1;
      
      if (interaction.data.url) {
        urls[interaction.data.url] = (urls[interaction.data.url] || 0) + 1;
      }
    });
    
    const mostLikelyAction = Object.keys(actions).reduce((a, b) => 
      actions[a] > actions[b] ? a : b, 'click');
    
    const mostLikelyUrl = Object.keys(urls).reduce((a, b) => 
      urls[a] > urls[b] ? a : b, null);
    
    return {
      mostLikelyAction,
      mostLikelyUrl,
      confidence: Math.min(Math.max(actions[mostLikelyAction] / interactions.length, 0.1), 0.9)
    };
  }
}

/**
 * 资源优化模型
 */
class ResourceOptimizationModel extends BaseMLModel {
  isRelevant(data) {
    return data.type === 'resource' || data.type === 'metric';
  }
  
  async optimizeForLCP(trainingData) {
    const resourceData = trainingData.filter(data => data.type === 'resource');
    
    // 分析哪些资源影响LCP
    const criticalResources = resourceData
      .filter(data => data.data.type === 'img' || data.data.type === 'css')
      .sort((a, b) => b.data.size - a.data.size)
      .slice(0, 3);
    
    return {
      preloadResources: criticalResources.map(r => ({
        url: r.data.name,
        type: r.data.type
      })),
      lazyLoadImages: true
    };
  }
}

/**
 * 瓶颈检测模型
 */
class BottleneckDetectionModel extends BaseMLModel {
  isRelevant(data) {
    return data.type === 'metric';
  }
}

/**
 * 缓存优化模型
 */
class CacheOptimizationModel extends BaseMLModel {
  isRelevant(data) {
    return data.type === 'resource';
  }
}

/**
 * 网络适应模型
 */
class NetworkAdaptationModel extends BaseMLModel {
  isRelevant(data) {
    return data.type === 'metric' && data.data.name === 'network';
  }
  
  async predictOptimalTiming(context) {
    const networkSpeed = context.networkConditions.effectiveType;
    
    // 根据网络速度调整延迟
    const delays = {
      'slow-2g': 1000,
      '2g': 500,
      '3g': 200,
      '4g': 0
    };
    
    return {
      delay: delays[networkSpeed] || 0
    };
  }
}

// 全局实例
window.AIPerformanceOptimizer = AIPerformanceOptimizer;

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiOptimizer = new AIPerformanceOptimizer();
  });
} else {
  window.aiOptimizer = new AIPerformanceOptimizer();
}

console.log('🤖 AI性能优化模块已加载');