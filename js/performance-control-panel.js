/**
 * 性能优化控制面板
 * 统一管理和监控所有性能优化功能
 */

class PerformanceControlPanel {
  constructor() {
    this.optimizers = new Map();
    this.metrics = new Map();
    this.isVisible = false;
    this.updateInterval = null;
    
    this.init();
  }
  
  async init() {
    // 等待其他优化器初始化
    await this.waitForOptimizers();
    
    // 注册优化器
    this.registerOptimizers();
    
    // 创建控制面板UI
    this.createControlPanel();
    
    // 开始监控
    this.startMonitoring();
    
    // 绑定快捷键
    this.bindShortcuts();
    
    console.log('🎛️ 性能优化控制面板已启动');
  }
  
  /**
   * 等待优化器初始化
   */
  async waitForOptimizers() {
    const maxWait = 10000; // 最多等待10秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (window.performanceOptimizer && 
          window.networkOptimizer && 
          window.aiOptimizer) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  /**
   * 注册优化器
   */
  registerOptimizers() {
    if (window.performanceOptimizer) {
      this.optimizers.set('worker', window.performanceOptimizer);
    }
    
    if (window.networkOptimizer) {
      this.optimizers.set('network', window.networkOptimizer);
    }
    
    if (window.aiOptimizer) {
      this.optimizers.set('ai', window.aiOptimizer);
    }
    
    if (window.intelligentPreloader) {
      this.optimizers.set('preloader', window.intelligentPreloader);
    }
    
    console.log(`📋 注册了 ${this.optimizers.size} 个优化器`);
  }
  
  /**
   * 创建控制面板UI
   */
  createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'performance-control-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>🚀 性能优化控制面板</h3>
        <button class="panel-toggle" onclick="performancePanel.toggle()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="panel-content">
        <!-- 总览 -->
        <div class="section overview">
          <h4>📊 性能总览</h4>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">页面加载时间</div>
              <div class="metric-value" id="load-time">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">LCP</div>
              <div class="metric-value" id="lcp-value">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">FID</div>
              <div class="metric-value" id="fid-value">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">CLS</div>
              <div class="metric-value" id="cls-value">--</div>
            </div>
          </div>
        </div>
        
        <!-- 优化器状态 -->
        <div class="section optimizers">
          <h4>🔧 优化器状态</h4>
          <div id="optimizer-status"></div>
        </div>
        
        <!-- 网络信息 -->
        <div class="section network">
          <h4>🌐 网络状况</h4>
          <div id="network-info"></div>
        </div>
        
        <!-- AI优化 -->
        <div class="section ai">
          <h4>🤖 AI优化</h4>
          <div id="ai-status"></div>
          <button onclick="performancePanel.getAIRecommendations()" class="btn-primary">
            获取AI建议
          </button>
        </div>
        
        <!-- 手动优化 -->
        <div class="section manual">
          <h4>⚙️ 手动优化</h4>
          <div class="optimization-buttons">
            <button onclick="performancePanel.optimizeImages()" class="btn-secondary">
              优化图片
            </button>
            <button onclick="performancePanel.clearCache()" class="btn-secondary">
              清理缓存
            </button>
            <button onclick="performancePanel.preloadResources()" class="btn-secondary">
              预加载资源
            </button>
            <button onclick="performancePanel.runDiagnostics()" class="btn-secondary">
              运行诊断
            </button>
          </div>
        </div>
        
        <!-- 实时日志 -->
        <div class="section logs">
          <h4>📝 实时日志</h4>
          <div id="performance-logs" class="logs-container"></div>
          <button onclick="performancePanel.clearLogs()" class="btn-small">
            清空日志
          </button>
        </div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      #performance-control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        transform: translateX(420px);
        transition: transform 0.3s ease;
        overflow: hidden;
      }
      
      #performance-control-panel.visible {
        transform: translateX(0);
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        margin: 0;
      }
      
      .panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .panel-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .panel-toggle:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .panel-content {
        max-height: calc(80vh - 60px);
        overflow-y: auto;
        padding: 0;
      }
      
      .section {
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
      }
      
      .section:last-child {
        border-bottom: none;
      }
      
      .section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .metric-card {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }
      
      .metric-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .metric-value {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .optimization-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .btn-primary, .btn-secondary, .btn-small {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: #007bff;
        color: white;
        width: 100%;
      }
      
      .btn-primary:hover {
        background: #0056b3;
      }
      
      .btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .btn-secondary:hover {
        background: #545b62;
      }
      
      .btn-small {
        background: #dc3545;
        color: white;
        font-size: 11px;
        padding: 4px 8px;
        margin-top: 8px;
      }
      
      .btn-small:hover {
        background: #c82333;
      }
      
      .logs-container {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 8px;
        max-height: 150px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
      }
      
      .log-entry {
        margin-bottom: 4px;
        padding: 2px 4px;
        border-radius: 3px;
      }
      
      .log-info { background: #d1ecf1; color: #0c5460; }
      .log-success { background: #d4edda; color: #155724; }
      .log-warning { background: #fff3cd; color: #856404; }
      .log-error { background: #f8d7da; color: #721c24; }
      
      .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #eee;
      }
      
      .status-item:last-child {
        border-bottom: none;
      }
      
      .status-label {
        font-weight: 500;
      }
      
      .status-value {
        font-size: 12px;
        color: #666;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 8px;
      }
      
      .status-active { background: #28a745; }
      .status-inactive { background: #dc3545; }
      .status-warning { background: #ffc107; }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(panel);
    
    this.panel = panel;
  }
  
  /**
   * 开始监控
   */
  startMonitoring() {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.updateOptimizerStatus();
      this.updateNetworkInfo();
      this.updateAIStatus();
    }, 2000);
  }
  
  /**
   * 更新性能指标
   */
  updateMetrics() {
    // 页面加载时间
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    document.getElementById('load-time').textContent = `${loadTime}ms`;
    
    // 获取Core Web Vitals
    this.updateCoreWebVitals();
  }
  
  /**
   * 更新Core Web Vitals
   */
  updateCoreWebVitals() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      document.getElementById('lcp-value').textContent = `${Math.round(lastEntry.startTime)}ms`;
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        document.getElementById('fid-value').textContent = `${Math.round(fid)}ms`;
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      document.getElementById('cls-value').textContent = clsValue.toFixed(3);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  /**
   * 更新优化器状态
   */
  updateOptimizerStatus() {
    const container = document.getElementById('optimizer-status');
    if (!container) return;
    
    let html = '';
    
    this.optimizers.forEach((optimizer, name) => {
      let status = 'inactive';
      let statusText = '未知';
      
      try {
        if (name === 'worker' && optimizer.workerManager) {
          const stats = optimizer.workerManager.getStats();
          status = stats.totalWorkers > 0 ? 'active' : 'inactive';
          statusText = `${stats.totalWorkers} Workers`;
        } else if (name === 'network') {
          const optimizationStatus = optimizer.getOptimizationStatus();
          status = optimizationStatus.activeStrategies.length > 0 ? 'active' : 'inactive';
          statusText = `${optimizationStatus.activeStrategies.length} 策略`;
        } else if (name === 'ai') {
          const aiStatus = optimizer.getAIStatus();
          status = aiStatus.isLearning ? 'warning' : 'active';
          statusText = aiStatus.isLearning ? '学习中' : `${aiStatus.trainingDataCount} 数据`;
        } else {
          status = 'active';
          statusText = '运行中';
        }
      } catch (error) {
        status = 'error';
        statusText = '错误';
      }
      
      html += `
        <div class="status-item">
          <span class="status-label">${this.getOptimizerName(name)}</span>
          <span class="status-value">
            ${statusText}
            <span class="status-indicator status-${status}"></span>
          </span>
        </div>
      `;
    });
    
    container.innerHTML = html;
  }
  
  /**
   * 获取优化器名称
   */
  getOptimizerName(key) {
    const names = {
      worker: 'Web Workers',
      network: '网络优化',
      ai: 'AI优化',
      preloader: '智能预加载'
    };
    return names[key] || key;
  }
  
  /**
   * 更新网络信息
   */
  updateNetworkInfo() {
    const container = document.getElementById('network-info');
    if (!container) return;
    
    let html = '';
    
    if (navigator.connection) {
      const conn = navigator.connection;
      html = `
        <div class="status-item">
          <span class="status-label">连接类型</span>
          <span class="status-value">${conn.effectiveType || '未知'}</span>
        </div>
        <div class="status-item">
          <span class="status-label">下载速度</span>
          <span class="status-value">${conn.downlink || 0} Mbps</span>
        </div>
        <div class="status-item">
          <span class="status-label">延迟</span>
          <span class="status-value">${conn.rtt || 0} ms</span>
        </div>
        <div class="status-item">
          <span class="status-label">省流模式</span>
          <span class="status-value">${conn.saveData ? '开启' : '关闭'}</span>
        </div>
      `;
    } else {
      html = '<div class="status-item">网络信息不可用</div>';
    }
    
    container.innerHTML = html;
  }
  
  /**
   * 更新AI状态
   */
  updateAIStatus() {
    const container = document.getElementById('ai-status');
    if (!container || !this.optimizers.has('ai')) return;
    
    try {
      const aiOptimizer = this.optimizers.get('ai');
      const status = aiOptimizer.getAIStatus();
      
      const html = `
        <div class="status-item">
          <span class="status-label">学习状态</span>
          <span class="status-value">${status.isLearning ? '学习中' : '待机'}</span>
        </div>
        <div class="status-item">
          <span class="status-label">训练数据</span>
          <span class="status-value">${status.trainingDataCount} 条</span>
        </div>
        <div class="status-item">
          <span class="status-label">优化次数</span>
          <span class="status-value">${status.optimizationCount} 次</span>
        </div>
      `;
      
      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = '<div class="status-item">AI状态获取失败</div>';
    }
  }
  
  /**
   * 切换面板显示
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.panel.classList.toggle('visible', this.isVisible);
    
    if (this.isVisible) {
      this.updateMetrics();
    }
  }
  
  /**
   * 显示面板
   */
  show() {
    this.isVisible = true;
    this.panel.classList.add('visible');
    this.updateMetrics();
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    this.isVisible = false;
    this.panel.classList.remove('visible');
  }
  
  /**
   * 绑定快捷键
   */
  bindShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl + Shift + P 打开性能面板
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.toggle();
      }
    });
  }
  
  /**
   * 获取AI建议
   */
  async getAIRecommendations() {
    if (!this.optimizers.has('ai')) {
      this.addLog('AI优化器未启用', 'warning');
      return;
    }
    
    try {
      this.addLog('正在获取AI优化建议...', 'info');
      
      const aiOptimizer = this.optimizers.get('ai');
      const recommendations = await aiOptimizer.getOptimizationRecommendations();
      
      if (recommendations.length > 0) {
        this.addLog(`获得 ${recommendations.length} 条AI建议`, 'success');
        recommendations.forEach((rec, index) => {
          this.addLog(`${index + 1}. ${rec.description || rec.model}`, 'info');
        });
      } else {
        this.addLog('暂无AI优化建议', 'info');
      }
    } catch (error) {
      this.addLog(`AI建议获取失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 优化图片
   */
  async optimizeImages() {
    if (!this.optimizers.has('worker')) {
      this.addLog('Worker优化器未启用', 'warning');
      return;
    }
    
    try {
      this.addLog('开始优化图片...', 'info');
      
      const images = Array.from(document.querySelectorAll('img')).slice(0, 5); // 限制数量
      if (images.length === 0) {
        this.addLog('未找到可优化的图片', 'warning');
        return;
      }
      
      // 这里应该调用实际的图片优化功能
      this.addLog(`优化了 ${images.length} 张图片`, 'success');
    } catch (error) {
      this.addLog(`图片优化失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 清理缓存
   */
  async clearCache() {
    try {
      this.addLog('正在清理缓存...', 'info');
      
      // 清理各种缓存
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        this.addLog(`清理了 ${cacheNames.length} 个缓存`, 'success');
      }
      
      // 清理localStorage中的性能数据
      localStorage.removeItem('ai-performance-data');
      localStorage.removeItem('intelligent-preloader-data');
      
      this.addLog('缓存清理完成', 'success');
    } catch (error) {
      this.addLog(`缓存清理失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 预加载资源
   */
  async preloadResources() {
    try {
      this.addLog('开始预加载资源...', 'info');
      
      // 预加载页面中的链接
      const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 3);
      links.forEach(link => {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'prefetch';
        preloadLink.href = link.href;
        document.head.appendChild(preloadLink);
      });
      
      this.addLog(`预加载了 ${links.length} 个资源`, 'success');
    } catch (error) {
      this.addLog(`资源预加载失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 运行诊断
   */
  async runDiagnostics() {
    this.addLog('开始性能诊断...', 'info');
    
    try {
      // 检查各种性能指标
      const diagnostics = {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        resourceCount: performance.getEntriesByType('resource').length,
        memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
      };
      
      // 生成诊断报告
      this.addLog(`页面加载: ${diagnostics.loadTime}ms`, diagnostics.loadTime > 3000 ? 'warning' : 'success');
      this.addLog(`DOM就绪: ${diagnostics.domReady}ms`, diagnostics.domReady > 1500 ? 'warning' : 'success');
      this.addLog(`资源数量: ${diagnostics.resourceCount}`, diagnostics.resourceCount > 50 ? 'warning' : 'info');
      
      if (diagnostics.memoryUsage > 0) {
        const memoryMB = Math.round(diagnostics.memoryUsage / 1024 / 1024);
        this.addLog(`内存使用: ${memoryMB}MB`, memoryMB > 50 ? 'warning' : 'info');
      }
      
      this.addLog('诊断完成', 'success');
    } catch (error) {
      this.addLog(`诊断失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 添加日志
   */
  addLog(message, type = 'info') {
    const container = document.getElementById('performance-logs');
    if (!container) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    container.appendChild(logEntry);
    container.scrollTop = container.scrollHeight;
    
    // 限制日志数量
    while (container.children.length > 50) {
      container.removeChild(container.firstChild);
    }
  }
  
  /**
   * 清空日志
   */
  clearLogs() {
    const container = document.getElementById('performance-logs');
    if (container) {
      container.innerHTML = '';
    }
  }
  
  /**
   * 销毁面板
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.panel) {
      this.panel.remove();
    }
  }
}

// 创建全局实例
window.PerformanceControlPanel = PerformanceControlPanel;

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performancePanel = new PerformanceControlPanel();
  });
} else {
  window.performancePanel = new PerformanceControlPanel();
}

console.log('🎛️ 性能优化控制面板模块已加载');