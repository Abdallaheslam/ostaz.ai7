// Service Worker متطور لتطبيق PWA - سوبر ماركت الأستاذ
const CACHE_NAME = 'ostaz-market-v2026.3';
const OFFLINE_URL = './offline.html';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics-compat.js'
];

// ====== تنصيب Service Worker ======
self.addEventListener('install', event => {
  console.log('[Service Worker] 📥 التنصيب');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] 📦 التخزين المسبق للملفات');
        
        // تخزين الملفات الأساسية
        await cache.addAll(APP_SHELL);
        
        // تأكد من تخزين صفحة Offline
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
        
        console.log('[Service Worker] ✅ التخزين المسبق مكتمل');
        return self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] ❌ خطأ في التخزين المسبق:', error);
        throw error;
      }
    })()
  );
});

// ====== تنشيط Service Worker ======
self.addEventListener('activate', event => {
  console.log('[Service Worker] 🚀 التنشيط');
  
  event.waitUntil(
    (async () => {
      try {
        // حذف الكاش القديم
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 🗑️ حذف الكاش القديم:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // التحكم في جميع التبويبات
        await self.clients.claim();
        console.log('[Service Worker] ✅ التنشيط مكتمل');
      } catch (error) {
        console.error('[Service Worker] ❌ خطأ في التنشيط:', error);
      }
    })()
  );
});

// ====== استراتيجيات التخزين الذكية ======
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // استبعاد طلبات Firebase و APIs من التخزين
  if (requestUrl.hostname.includes('firebase') ||
      requestUrl.pathname.includes('/__/') ||
      event.request.method !== 'GET') {
    return;
  }
  
  // استراتيجية التخزين للصور
  if (requestUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }
  
  // استراتيجية التخزين للـ HTML
  if (requestUrl.pathname.match(/\.html?$/i)) {
    event.respondWith(handleHtmlRequest(event.request));
    return;
  }
  
  // استراتيجية التخزين للـ CSS و JS
  if (requestUrl.pathname.match(/\.(css|js)$/i)) {
    event.respondWith(handleAssetRequest(event.request));
    return;
  }
  
  // استراتيجية Network First للطلبات الأخرى
  event.respondWith(handleNetworkFirstRequest(event.request));
});

// معالجة طلبات الصور
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // تحديث الكاش في الخلفية
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {}); // تجاهل الأخطاء في التحديث
    
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // إرجاع صورة افتراضية عند الخطأ
    return cache.match('./icons/icon-512x512.png');
  }
}

// معالجة طلبات HTML
async function handleHtmlRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    
    // نسخة من الاستجابة للتخزين
    const responseClone = response.clone();
    cache.put(request, responseClone).catch(() => {});
    
    return response;
  } catch (error) {
    // صفحة Offline للـ HTML
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match(OFFLINE_URL);
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // إنشاء صفحة Offline ديناميكية
    return new Response(
      '<h1>لا يوجد اتصال بالإنترنت</h1><p>يرجى التحقق من اتصالك بالإنترنت</p>',
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// معالجة طلبات الأصول (CSS, JS)
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// استراتيجية Network First
async function handleNetworkFirstRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// ====== Synchronization في الخلفية ======
self.addEventListener('sync', event => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartData());
  }
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncCartData() {
  console.log('[Service Worker] 🔄 مزامنة بيانات العربة');
  // هنا يمكن إضافة منطق المزامنة مع Firebase
}

async function syncOrders() {
  console.log('[Service Worker] 🔄 مزامنة الطلبات');
  // هنا يمكن إضافة منطق مزامنة الطلبات
}

// ====== استلام الإشعارات ======
self.addEventListener('push', event => {
  console.log('[Service Worker] 📨 استلام إشعار جديد');
  
  const options = {
    body: event.data?.text() || 'إشعار جديد من سوبر ماركت الأستاذ',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('سوبر ماركت الأستاذ', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 👆 نقر على الإشعار:', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      (async () => {
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: 'window'
        });
        
        for (const client of allClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })()
    );
  }
});

// ====== تحديث التطبيق ======
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('[Service Worker] 🔄 تخطي الانتظار وتحديث التطبيق');
  }
  
  if (event.data && event.data.type === 'CACHE_DATA') {
    console.log('[Service Worker] 📦 تخزين بيانات:', event.data.key);
    // تخزين البيانات في IndexedDB أو Cache
  }
  
  if (event.data && event.data.type === 'SYNC_CART') {
    console.log('[Service Worker] 🛒 تخزين بيانات العربة للمزامنة');
    // تخزين بيانات العربة للمزامنة لاحقاً
  }
});

// ====== الوصول إلى الخلفية ======
self.addEventListener('backgroundfetchsuccess', event => {
  console.log('[Service Worker] 📥 تحميل الخلفية مكتمل:', event.registration.id);
});

self.addEventListener('backgroundfetchfail', event => {
  console.log('[Service Worker] ❌ فشل تحميل الخلفية:', event.registration.id);
});

// ====== تحديث التطبيق في الخلفية ======
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-products') {
    event.waitUntil(updateProductsCache());
  }
  
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCache());
  }
});

async function updateProductsCache() {
  console.log('[Service Worker] 🔄 تحديث بيانات المنتجات في الخلفية');
  
  try {
    // هنا يمكن إضافة منطق تحديث المنتجات
    const cache = await caches.open(CACHE_NAME);
    // تحديث بيانات المنتجات
  } catch (error) {
    console.error('[Service Worker] ❌ خطأ في تحديث المنتجات:', error);
  }
}

async function cleanupOldCache() {
  console.log('[Service Worker] 🧹 تنظيف الكاش القديم');
  
  try {
    const cacheKeys = await caches.keys();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const cacheName of cacheKeys) {
      if (cacheName !== CACHE_NAME) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const date = new Date(response.headers.get('date'));
            if (date.getTime() < weekAgo) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] ❌ خطأ في تنظيف الكاش:', error);
  }
}

// ====== إدارة الذاكرة ======
self.addEventListener('message', (event) => {
  if (event.data === 'claimMe') {
    self.clients.claim();
  }
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// ====== Heartbeat للتأكد من أن الـ Service Worker يعمل ======
setInterval(() => {
  console.log('[Service Worker] 💓 Service Worker نشط');
}, 30000);

// ====== الإبلاغ عن الأخطاء ======
self.addEventListener('error', (event) => {
  console.error('[Service Worker] ❌ خطأ:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] ❌ خطأ غير معالج:', event.reason);
});

// ====== تهيئة IndexedDB لتخزين البيانات ======
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ostaz-market-db', 1);
    
    request.onerror = (event) => {
      console.error('[Service Worker] ❌ فشل فتح IndexedDB:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('[Service Worker] ✅ فتح IndexedDB بنجاح');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // إنشاء مخزن للمنتجات
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('category', 'category', { unique: false });
        productStore.createIndex('featured', 'featured', { unique: false });
        productStore.createIndex('discount', 'discount', { unique: false });
      }
      
      // إنشاء مخزن للعربة
      if (!db.objectStoreNames.contains('cart')) {
        const cartStore = db.createObjectStore('cart', { keyPath: 'id' });
        cartStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // إنشاء مخزن للطلبات
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
        orderStore.createIndex('status', 'status', { unique: false });
        orderStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      console.log('[Service Worker] 📊 إنشاء IndexedDB');
    };
  });
}

// تهيئة قاعدة البيانات عند تنشيط الـ Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(initDatabase().catch(console.error));
});

// ====== التخزين في IndexedDB ======
async function storeInIndexedDB(storeName, data) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('[Service Worker] ❌ خطأ في تخزين البيانات:', error);
    throw error;
  }
}

// ====== الاسترجاع من IndexedDB ======
async function getFromIndexedDB(storeName, key) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = key ? store.get(key) : store.getAll();
      
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('[Service Worker] ❌ خطأ في استرجاع البيانات:', error);
    throw error;
  }
}

console.log('[Service Worker] ✅ Service Worker محمل وجاهز للعمل');