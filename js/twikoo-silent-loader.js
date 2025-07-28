/**
 * Twikoo静默加载器 - 无UI干扰的评论系统
 * 完全在后台处理所有错误和重试，不显示任何用户界面
 */
class TwikooSilentLoader {
  constructor() {
    this.maxRetries = 10; // 增加重试次数
    this.retryCount = 0;
    this.retryDelay = 2000; // 初始重试延迟
    this.maxRetryDelay = 30000; // 最大重试延迟
    this.cdnUrls = [
      'https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js',
      'https://unpkg.com/twikoo@1.6.42/dist/twikoo.all.min.js',
      'https://cdn.bootcdn.net/ajax/libs/twikoo/1.6.42/twikoo.all.min.js',
      'https://fastly.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js'
    ];
    this.currentCdnIndex = 0;
    this.isLoading = false;
    this.loadSuccess = false;
    
    this.init();
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startSilentLoad());
    } else {
      this.startSilentLoad();
    }
  }

  async startSilentLoad() {
    // 检查评论容器是否存在
    const container = document.getElementById('tcomment');
    if (!container) {
      console.log('📝 评论容器不存在，跳过Twikoo加载');
      return;
    }

    console.log('🔄 开始静默加载Twikoo评论系统...');
    await this.silentLoadWithRetry();
  }

  async silentLoadWithRetry() {
    if (this.isLoading || this.loadSuccess) return;
    
    this.isLoading = true;

    try {
      await this.loadTwikooScript();
      await this.initTwikoo();
      this.loadSuccess = true;
      console.log('✅ Twikoo加载成功');
    } catch (error) {
      console.log(`⚠️ Twikoo加载失败 (${this.retryCount + 1}/${this.maxRetries}):`, error.message);
      
      this.retryCount++;
      
      if (this.retryCount < this.maxRetries) {
        // 尝试下一个CDN
        this.currentCdnIndex = (this.currentCdnIndex + 1) % this.cdnUrls.length;
        
        // 指数退避延迟
        const delay = Math.min(this.retryDelay * Math.pow(1.5, this.retryCount), this.maxRetryDelay);
        
        console.log(`🔄 ${delay/1000}秒后重试...`);
        
        setTimeout(() => {
          this.isLoading = false;
          this.silentLoadWithRetry();
        }, delay);
      } else {
        console.log('❌ Twikoo加载最终失败，停止重试');
        this.isLoading = false;
      }
    }
  }

  async loadTwikooScript() {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if (window.twikoo) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.cdnUrls[this.currentCdnIndex];
      script.async = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('脚本加载超时'));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        if (window.twikoo) {
          resolve();
        } else {
          reject(new Error('Twikoo对象未找到'));
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('脚本加载失败'));
      };

      document.head.appendChild(script);
    });
  }

  async initTwikoo() {
    if (!window.twikoo) {
      throw new Error('Twikoo未加载');
    }

    const config = {
      envId: 'super-gelato-2c17f4.netlify.app',
      el: '#tcomment',
      path: window.location.pathname,
      lang: 'zh-CN'
    };

    try {
      await window.twikoo.init(config);
    } catch (error) {
      // 尝试备用配置
      console.log('🔄 尝试备用配置...');
      config.envId = 'super-gelato-2c17f4.netlify.app';
      await window.twikoo.init(config);
    }
  }

  // 公共API - 手动重试（仅供开发者使用）
  manualRetry() {
    this.retryCount = 0;
    this.isLoading = false;
    this.loadSuccess = false;
    this.silentLoadWithRetry();
  }

  // 获取加载状态
  getStatus() {
    return {
      isLoading: this.isLoading,
      loadSuccess: this.loadSuccess,
      retryCount: this.retryCount,
      currentCdn: this.cdnUrls[this.currentCdnIndex]
    };
  }
}

// 全局初始化
window.twikooSilentLoader = new TwikooSilentLoader();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TwikooSilentLoader;
}