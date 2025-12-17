const CACHE_NAME = 'hexo-blog-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/css/matery.css',
  '/css/modern-optimizations.css',
  '/js/matery.js',
  '/js/modern-optimizations.js',
  '/libs/jquery/jquery-3.6.0.min.js',
  '/libs/materialize/materialize.min.js',
  '/medias/logo.png',
  '/favicon.png'
];

// 需要网络优先的资源
const NETWORK_FIRST = [
  '/search.xml',
  '/atom.xml',
  '/sitemap.xml'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 实现缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 网络优先策略（用于动态内容）
  if (NETWORK_FIRST.some(path => url.pathname.includes(path))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 缓存优先策略（用于静态资源）
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // 网络优先，缓存备用（用于HTML页面）
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 默认策略
  event.respondWith(networkFirst(request));
});

// 缓存优先策略
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    
    // 如果是图片请求失败，返回占位图
    if (request.destination === 'image') {
      return new Response(
        '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">图片加载失败</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 缓存成功的响应
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是HTML页面请求失败，返回离线页面
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
      
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>离线状态</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="offline-icon">📱</div>
            <h1>当前处于离线状态</h1>
            <p>请检查网络连接后重试</p>
            <button onclick="window.location.reload()">重新加载</button>
          </div>
        </body>
        </html>`,
        { 
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 200
        }
      );
    }
    
    throw error;
  }
}

// 后台同步（如果支持）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // 这里可以添加后台同步逻辑
    // 比如同步离线时的评论、点赞等操作
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// 推送通知（如果需要）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: '查看详情',
          icon: '/images/checkmark.png'
        },
        {
          action: 'close',
          title: '关闭',
          icon: '/images/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知点击处理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 错误处理
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});