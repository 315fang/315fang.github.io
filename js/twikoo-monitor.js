/**
 * Twikoo评论系统实时监控和自动修复
 * 监控评论系统状态并提供实时修复建议
 */
class TwikooMonitor {
  constructor() {
    this.isMonitoring = false;
    this.checkInterval = null;
    this.statusHistory = [];
    this.alertThreshold = 3; // 连续失败3次后触发警报
    this.consecutiveFailures = 0;
    this.init();
  }

  init() {
    // 页面加载完成后开始监控
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('🔍 启动Twikoo评论系统监控...');
    this.isMonitoring = true;
    
    // 立即检查一次
    this.checkTwikooStatus();
    
    // 每30秒检查一次
    this.checkInterval = setInterval(() => {
      this.checkTwikooStatus();
    }, 30000);
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.consecutiveFailures > 0) {
        console.log('🔄 页面重新可见，检查评论系统状态...');
        this.checkTwikooStatus();
      }
    });
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('⏹️ 停止Twikoo评论系统监控');
    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkTwikooStatus() {
    const status = {
      timestamp: Date.now(),
      containerExists: false,
      twikooLoaded: false,
      commentsVisible: false,
      errorMessages: [],
      networkStatus: 'unknown',
      recommendations: []
    };

    try {
      // 检查评论容器是否存在
      const container = document.getElementById('tcomment');
      status.containerExists = !!container;

      if (container) {
        // 检查是否显示错误信息
        const errorElements = container.querySelectorAll('.twikoo-fallback, .twikoo-loading');
        if (errorElements.length > 0) {
          status.errorMessages.push('检测到错误或加载状态');
        }

        // 检查是否有评论内容
        const commentElements = container.querySelectorAll('.tk-comment, .tk-submit');
        status.commentsVisible = commentElements.length > 0;
      }

      // 检查Twikoo脚本是否加载
      status.twikooLoaded = typeof window.twikoo !== 'undefined';

      // 检查网络状态
      status.networkStatus = navigator.onLine ? 'online' : 'offline';

      // 生成建议
      status.recommendations = this.generateRecommendations(status);

      // 记录状态
      this.recordStatus(status);

      // 检查是否需要触发修复
      if (this.shouldTriggerRepair(status)) {
        this.triggerAutoRepair(status);
      }

    } catch (error) {
      console.error('监控检查出错:', error);
      status.errorMessages.push(`监控错误: ${error.message}`);
    }

    return status;
  }

  recordStatus(status) {
    this.statusHistory.push(status);
    
    // 只保留最近20条记录
    if (this.statusHistory.length > 20) {
      this.statusHistory.shift();
    }

    // 更新连续失败计数
    if (this.isStatusHealthy(status)) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    // 保存到localStorage
    try {
      localStorage.setItem('twikoo_monitor_status', JSON.stringify({
        lastCheck: status.timestamp,
        consecutiveFailures: this.consecutiveFailures,
        recentStatus: this.statusHistory.slice(-5)
      }));
    } catch (e) {
      console.warn('无法保存监控状态');
    }
  }

  isStatusHealthy(status) {
    return status.containerExists && 
           status.twikooLoaded && 
           status.commentsVisible && 
           status.networkStatus === 'online' &&
           status.errorMessages.length === 0;
  }

  shouldTriggerRepair(status) {
    // 连续失败达到阈值时触发修复
    return this.consecutiveFailures >= this.alertThreshold;
  }

  async triggerAutoRepair(status) {
    console.log('🔧 触发自动修复...');
    
    // 显示修复通知
    this.showRepairNotification();
    
    // 尝试不同的修复策略
    const repairStrategies = [
      () => this.repairStrategy1_Reload(),
      () => this.repairStrategy2_Reinitialize(),
      () => this.repairStrategy3_FallbackCDN(),
      () => this.repairStrategy4_ManualFix()
    ];

    for (let i = 0; i < repairStrategies.length; i++) {
      try {
        console.log(`🔧 尝试修复策略 ${i + 1}...`);
        await repairStrategies[i]();
        
        // 等待一段时间后检查修复效果
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newStatus = await this.checkTwikooStatus();
        if (this.isStatusHealthy(newStatus)) {
          console.log('✅ 修复成功！');
          this.showSuccessNotification();
          return;
        }
      } catch (error) {
        console.error(`修复策略 ${i + 1} 失败:`, error);
      }
    }

    console.log('❌ 所有修复策略都失败了');
    this.showFailureNotification();
  }

  async repairStrategy1_Reload() {
    // 策略1: 重新加载评论系统
    if (window.twikooErrorHandler) {
      window.twikooErrorHandler.retryLoad();
    }
  }

  async repairStrategy2_Reinitialize() {
    // 策略2: 重新初始化Twikoo
    if (window.twikoo) {
      const container = document.getElementById('tcomment');
      if (container) {
        container.innerHTML = '';
        await twikoo.init({
          envId: 'https://super-gelato-2c17f4.netlify.app/.netlify/functions/twikoo',
          el: '#tcomment',
          path: window.location.pathname,
          lang: 'zh-CN'
        });
      }
    }
  }

  async repairStrategy3_FallbackCDN() {
    // 策略3: 使用备用CDN重新加载
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/twikoo@1.6.42/dist/twikoo.all.min.js';
    script.onload = () => this.repairStrategy2_Reinitialize();
    document.head.appendChild(script);
  }

  async repairStrategy4_ManualFix() {
    // 静默模式：不显示手动修复界面，而是继续尝试自动修复
    console.log('🔄 所有自动修复策略已尝试，继续静默重试...');
    
    // 重置失败计数，继续监控和重试
    this.consecutiveFailures = 0;
    
    // 延迟后重新开始监控
    setTimeout(() => {
      this.startMonitoring();
    }, 10000); // 10秒后重新开始
  }

  generateRecommendations(status) {
    const recommendations = [];

    if (!status.containerExists) {
      recommendations.push('评论容器不存在，检查模板配置');
    }

    if (!status.twikooLoaded) {
      recommendations.push('Twikoo脚本未加载，检查CDN连接');
    }

    if (!status.commentsVisible && status.twikooLoaded) {
      recommendations.push('Twikoo已加载但评论未显示，检查初始化配置');
    }

    if (status.networkStatus === 'offline') {
      recommendations.push('网络连接断开，请检查网络');
    }

    if (status.errorMessages.length > 0) {
      recommendations.push('检测到错误信息，查看控制台日志');
    }

    return recommendations;
  }

  showRepairNotification() {
    // 静默模式：仅在控制台记录
    console.log('🔧 正在尝试自动修复评论系统...');
  }

  showSuccessNotification() {
    // 静默模式：仅在控制台记录
    console.log('✅ 评论系统修复成功！');
  }

  showFailureNotification() {
    // 静默模式：仅在控制台记录
    console.log('❌ 自动修复失败，继续静默重试');
  }

  showNotification(message, type = 'info') {
    // 静默模式：不显示通知，仅在控制台记录
    const emoji = {
      'success': '✅',
      'error': '❌', 
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    console.log(`${emoji[type] || 'ℹ️'} ${message}`);
  }

  showDiagnostic() {
    const diagnosticData = {
      monitoringStatus: {
        isMonitoring: this.isMonitoring,
        consecutiveFailures: this.consecutiveFailures,
        alertThreshold: this.alertThreshold
      },
      statusHistory: this.statusHistory.slice(-10),
      recommendations: this.statusHistory.length > 0 ? 
        this.statusHistory[this.statusHistory.length - 1].recommendations : []
    };

    const diagnosticWindow = window.open('', '_blank', 'width=900,height=700');
    diagnosticWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Twikoo监控诊断报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .status-healthy { color: #27ae60; font-weight: bold; }
          .status-warning { color: #f39c12; font-weight: bold; }
          .status-error { color: #e74c3c; font-weight: bold; }
          .status-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; background: #f9f9f9; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; font-size: 12px; }
          .recommendation { background: #e8f4fd; padding: 10px; margin: 5px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>🔍 Twikoo评论系统监控报告</h1>
        
        <h2>📊 监控状态</h2>
        <div class="status-item">
          <strong>监控状态:</strong> ${this.isMonitoring ? '<span class="status-healthy">运行中</span>' : '<span class="status-error">已停止</span>'}
        </div>
        <div class="status-item">
          <strong>连续失败次数:</strong> ${this.consecutiveFailures > 0 ? `<span class="status-error">${this.consecutiveFailures}</span>` : '<span class="status-healthy">0</span>'}
        </div>
        
        <h2>📈 状态历史</h2>
        ${this.generateStatusHistoryHTML()}
        
        <h2>💡 修复建议</h2>
        ${this.generateRecommendationsHTML()}
        
        <h2>🔧 手动操作</h2>
        <button onclick="window.opener.twikooMonitor.triggerAutoRepair(); window.close();" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">触发自动修复</button>
        <button onclick="window.opener.location.reload(); window.close();" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">刷新页面</button>
        
        <h2>📋 详细数据</h2>
        <pre>${JSON.stringify(diagnosticData, null, 2)}</pre>
      </body>
      </html>
    `);
  }

  generateStatusHistoryHTML() {
    if (this.statusHistory.length === 0) {
      return '<p>暂无状态历史</p>';
    }

    return this.statusHistory.slice(-5).map(status => {
      const time = new Date(status.timestamp).toLocaleString();
      const healthy = this.isStatusHealthy(status);
      const statusClass = healthy ? 'status-healthy' : 'status-error';
      const statusText = healthy ? '✅ 正常' : '❌ 异常';
      
      return `
        <div class="status-item">
          <strong>${time}:</strong> <span class="${statusClass}">${statusText}</span>
          ${status.errorMessages.length > 0 ? `<br><small>错误: ${status.errorMessages.join(', ')}</small>` : ''}
        </div>
      `;
    }).join('');
  }

  generateRecommendationsHTML() {
    const latestStatus = this.statusHistory[this.statusHistory.length - 1];
    if (!latestStatus || latestStatus.recommendations.length === 0) {
      return '<p>暂无建议</p>';
    }

    return latestStatus.recommendations.map(rec => 
      `<div class="recommendation">💡 ${rec}</div>`
    ).join('');
  }

  // 公共API
  getStatus() {
    return this.statusHistory[this.statusHistory.length - 1] || null;
  }

  getHealthScore() {
    if (this.statusHistory.length === 0) return 0;
    
    const recentStatuses = this.statusHistory.slice(-10);
    const healthyCount = recentStatuses.filter(status => this.isStatusHealthy(status)).length;
    return Math.round((healthyCount / recentStatuses.length) * 100);
  }
}

// 全局初始化
window.twikooMonitor = new TwikooMonitor();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TwikooMonitor;
}