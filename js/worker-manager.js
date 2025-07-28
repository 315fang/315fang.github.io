/**
 * Web Worker 管理器
 * 统一管理和调度Web Workers，优化性能
 */

class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.workerPool = [];
    this.initialized = false;
    
    this.init();
  }
  
  /**
   * 初始化Worker管理器
   */
  async init() {
    try {
      // 检测Worker支持
      if (!window.Worker) {
        console.warn('⚠️ Web Workers 不被支持');
        return;
      }
      
      // 创建Worker池
      await this.createWorkerPool();
      
      // 监听页面卸载，清理Workers
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
      
      this.initialized = true;
      console.log('✅ Worker管理器初始化完成');
      
    } catch (error) {
      console.error('❌ Worker管理器初始化失败:', error);
    }
  }
  
  /**
   * 创建Worker池
   */
  async createWorkerPool() {
    const workerScript = '/js/performance-worker.js';
    
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker(workerScript);
        const workerId = `worker_${i}`;
        
        // 配置Worker
        worker.onmessage = (event) => {
          this.handleWorkerMessage(workerId, event);
        };
        
        worker.onerror = (error) => {
          this.handleWorkerError(workerId, error);
        };
        
        // 等待Worker就绪
        await this.waitForWorkerReady(worker);
        
        this.workerPool.push({
          id: workerId,
          worker,
          busy: false,
          tasks: 0
        });
        
      } catch (error) {
        console.warn(`Worker ${i} 创建失败:`, error);
      }
    }
    
    console.log(`🔧 创建了 ${this.workerPool.length} 个Workers`);
  }
  
  /**
   * 等待Worker就绪
   */
  waitForWorkerReady(worker) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker启动超时'));
      }, 5000);
      
      const messageHandler = (event) => {
        if (event.data.type === 'WORKER_READY') {
          clearTimeout(timeout);
          worker.removeEventListener('message', messageHandler);
          resolve();
        }
      };
      
      worker.addEventListener('message', messageHandler);
    });
  }
  
  /**
   * 执行任务
   */
  async executeTask(type, data, options = {}) {
    if (!this.initialized) {
      throw new Error('Worker管理器未初始化');
    }
    
    const taskId = this.generateTaskId();
    const priority = options.priority || 'normal';
    const timeout = options.timeout || 30000;
    
    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        type,
        data,
        priority,
        timeout,
        resolve,
        reject,
        createdAt: Date.now()
      };
      
      // 添加到任务队列
      this.addToQueue(task);
      
      // 尝试立即执行
      this.processQueue();
    });
  }
  
  /**
   * 添加任务到队列
   */
  addToQueue(task) {
    // 根据优先级插入
    if (task.priority === 'high') {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }
  }
  
  /**
   * 处理任务队列
   */
  processQueue() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.getAvailableWorker();
      
      if (!availableWorker) {
        break; // 没有可用Worker
      }
      
      const task = this.taskQueue.shift();
      this.assignTaskToWorker(task, availableWorker);
    }
  }
  
  /**
   * 获取可用Worker
   */
  getAvailableWorker() {
    return this.workerPool.find(worker => !worker.busy);
  }
  
  /**
   * 分配任务给Worker
   */
  assignTaskToWorker(task, workerInfo) {
    workerInfo.busy = true;
    workerInfo.tasks++;
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, task.timeout);
    
    // 记录活跃任务
    this.activeJobs.set(task.id, {
      task,
      worker: workerInfo,
      timeoutId,
      startTime: Date.now()
    });
    
    // 发送任务给Worker
    workerInfo.worker.postMessage({
      type: task.type,
      data: task.data,
      taskId: task.id
    });
  }
  
  /**
   * 处理Worker消息
   */
  handleWorkerMessage(workerId, event) {
    const { taskId, type, result, error } = event.data;
    
    if (type === 'WORKER_READY') {
      return; // 已在初始化时处理
    }
    
    const job = this.activeJobs.get(taskId);
    if (!job) {
      console.warn(`未找到任务: ${taskId}`);
      return;
    }
    
    // 清理任务
    this.cleanupJob(taskId);
    
    // 处理结果
    if (type === 'SUCCESS') {
      job.task.resolve(result);
    } else if (type === 'ERROR') {
      job.task.reject(new Error(error));
    }
    
    // 继续处理队列
    this.processQueue();
  }
  
  /**
   * 处理Worker错误
   */
  handleWorkerError(workerId, error) {
    console.error(`Worker ${workerId} 错误:`, error);
    
    // 找到并重启出错的Worker
    const workerIndex = this.workerPool.findIndex(w => w.id === workerId);
    if (workerIndex !== -1) {
      this.restartWorker(workerIndex);
    }
  }
  
  /**
   * 重启Worker
   */
  async restartWorker(index) {
    const oldWorker = this.workerPool[index];
    
    try {
      // 终止旧Worker
      oldWorker.worker.terminate();
      
      // 创建新Worker
      const worker = new Worker('/js/performance-worker.js');
      const workerId = `worker_${index}_restart_${Date.now()}`;
      
      worker.onmessage = (event) => {
        this.handleWorkerMessage(workerId, event);
      };
      
      worker.onerror = (error) => {
        this.handleWorkerError(workerId, error);
      };
      
      await this.waitForWorkerReady(worker);
      
      // 替换Worker
      this.workerPool[index] = {
        id: workerId,
        worker,
        busy: false,
        tasks: 0
      };
      
      console.log(`🔄 Worker ${index} 重启成功`);
      
    } catch (error) {
      console.error(`Worker ${index} 重启失败:`, error);
    }
  }
  
  /**
   * 处理任务超时
   */
  handleTaskTimeout(taskId) {
    const job = this.activeJobs.get(taskId);
    if (!job) return;
    
    console.warn(`⏰ 任务超时: ${taskId}`);
    
    job.task.reject(new Error('任务执行超时'));
    this.cleanupJob(taskId);
  }
  
  /**
   * 清理任务
   */
  cleanupJob(taskId) {
    const job = this.activeJobs.get(taskId);
    if (!job) return;
    
    // 清除超时
    clearTimeout(job.timeoutId);
    
    // 释放Worker
    job.worker.busy = false;
    
    // 移除任务记录
    this.activeJobs.delete(taskId);
  }
  
  /**
   * 生成任务ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const busyWorkers = this.workerPool.filter(w => w.busy).length;
    const totalTasks = this.workerPool.reduce((sum, w) => sum + w.tasks, 0);
    
    return {
      totalWorkers: this.workerPool.length,
      busyWorkers,
      availableWorkers: this.workerPool.length - busyWorkers,
      queueLength: this.taskQueue.length,
      activeJobs: this.activeJobs.size,
      totalTasksProcessed: totalTasks
    };
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    // 终止所有Workers
    this.workerPool.forEach(workerInfo => {
      workerInfo.worker.terminate();
    });
    
    // 清理任务
    this.activeJobs.forEach(job => {
      clearTimeout(job.timeoutId);
      job.task.reject(new Error('Worker管理器已关闭'));
    });
    
    // 清空数据
    this.workerPool = [];
    this.taskQueue = [];
    this.activeJobs.clear();
    
    console.log('🧹 Worker管理器已清理');
  }
}

/**
 * 高级性能优化器
 * 使用Web Workers进行性能优化
 */
class AdvancedPerformanceOptimizer {
  constructor() {
    this.workerManager = new WorkerManager();
    this.optimizationQueue = [];
    this.isProcessing = false;
    
    this.init();
  }
  
  async init() {
    // 等待Worker管理器初始化
    while (!this.workerManager.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🚀 高级性能优化器已启动');
  }
  
  /**
   * 优化图片
   */
  async optimizeImages(images, options = {}) {
    try {
      const result = await this.workerManager.executeTask('IMAGE_PROCESSING', {
        images,
        options: {
          quality: options.quality || 85,
          format: options.format || 'webp',
          maxWidth: options.maxWidth || 1920,
          breakpoints: options.breakpoints || [480, 768, 1024, 1200]
        }
      }, {
        priority: 'high',
        timeout: 60000
      });
      
      console.log('📸 图片优化完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 图片优化失败:', error);
      throw error;
    }
  }
  
  /**
   * 分析文本内容
   */
  async analyzeContent(texts, options = {}) {
    try {
      const result = await this.workerManager.executeTask('TEXT_ANALYSIS', {
        texts,
        options: {
          summaryLength: options.summaryLength || 150,
          extractKeywords: options.extractKeywords !== false,
          analyzeSentiment: options.analyzeSentiment !== false
        }
      });
      
      console.log('📝 文本分析完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 文本分析失败:', error);
      throw error;
    }
  }
  
  /**
   * 构建搜索索引
   */
  async buildSearchIndex(articles) {
    try {
      const result = await this.workerManager.executeTask('SEARCH_INDEX', {
        articles
      }, {
        priority: 'normal',
        timeout: 120000
      });
      
      console.log('🔍 搜索索引构建完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 搜索索引构建失败:', error);
      throw error;
    }
  }
  
  /**
   * 计算推荐内容
   */
  async calculateRecommendations(articles, userPreferences, currentArticle) {
    try {
      const result = await this.workerManager.executeTask('RECOMMENDATION_CALCULATION', {
        articles,
        userPreferences,
        currentArticle
      });
      
      console.log('💡 推荐计算完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 推荐计算失败:', error);
      throw error;
    }
  }
  
  /**
   * 压缩数据
   */
  async compressData(content, algorithm = 'gzip') {
    try {
      const result = await this.workerManager.executeTask('DATA_COMPRESSION', {
        content,
        algorithm
      });
      
      console.log('🗜️ 数据压缩完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 数据压缩失败:', error);
      throw error;
    }
  }
  
  /**
   * 分析性能指标
   */
  async analyzePerformance(metrics, timeRange) {
    try {
      const result = await this.workerManager.executeTask('PERFORMANCE_ANALYSIS', {
        metrics,
        timeRange
      });
      
      console.log('📊 性能分析完成:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 性能分析失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取优化器状态
   */
  getStatus() {
    return {
      workerStats: this.workerManager.getStats(),
      queueLength: this.optimizationQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// 全局实例
window.AdvancedPerformanceOptimizer = AdvancedPerformanceOptimizer;
window.WorkerManager = WorkerManager;

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new AdvancedPerformanceOptimizer();
  });
} else {
  window.performanceOptimizer = new AdvancedPerformanceOptimizer();
}

console.log('🔧 Web Worker管理器模块已加载');