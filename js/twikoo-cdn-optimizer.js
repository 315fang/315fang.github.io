
/**
 * Twikoo CDN优化
 */
class TwikooCDNOptimizer {
  constructor() {
    this.cdnUrls = [
      'https://cdn.jsdelivr.net/npm/twikoo@1.6.39/dist/twikoo.all.min.js',
      'https://unpkg.com/twikoo@1.6.39/dist/twikoo.all.min.js',
      'https://cdn.bootcdn.net/ajax/libs/twikoo/1.6.39/twikoo.all.min.js'
    ];
    this.currentCDN = 0;
  }

  loadWithFallback() {
    return new Promise((resolve, reject) => {
      this.tryLoadCDN(resolve, reject);
    });
  }

  tryLoadCDN(resolve, reject) {
    if (this.currentCDN >= this.cdnUrls.length) {
      reject(new Error('所有CDN都无法访问'));
      return;
    }

    const script = document.createElement('script');
    script.src = this.cdnUrls[this.currentCDN];
    script.async = true;
    
    const timeout = setTimeout(() => {
      script.remove();
      this.currentCDN++;
      this.tryLoadCDN(resolve, reject);
    }, 3000); // 3秒超时

    script.onload = () => {
      clearTimeout(timeout);
      console.log(`✅ 使用CDN加载成功: ${this.cdnUrls[this.currentCDN]}`);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      this.currentCDN++;
      this.tryLoadCDN(resolve, reject);
    };

    document.head.appendChild(script);
  }
}

// 导出供其他模块使用
window.TwikooCDNOptimizer = TwikooCDNOptimizer;
