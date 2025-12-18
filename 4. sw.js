/******************************************************************
 * Service Worker محسن لتطبيق سوبر ماركت الأستاذ
 * الإصدار: 2026.4.1 (محسن للأداء)
 * ميزات: التخزين المؤقت الذكي، وضع عدم الاتصال، تحديث خفي
 ******************************************************************/

const APP_NAME = 'سوبر ماركت الأستاذ';
const VERSION = '2026.4.1';

// أنواع التخزين المؤقت
const CACHE_NAMES = {
  STATIC: 'static-v2026.4.1',
  ASSETS: 'assets-v2026.4.1',
  DATA: 'data-v2026.4.1',
  FALLBACK: 'fallback-v1'
};

// الملفات الأساسية (يتم تخزينها عند التثبيت)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  
  // الأيقونات الأساسية
  '/icons/icon-72x72.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ========== تثبيت Service Worker ==========
self.addEventListener('install', event => {
  console.log(`[Service Worker] التثبيت - ${VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الأساسية
      caches.open(CACHE_NAMES.STATIC)
        .then(cache => {
          console.log('[Service Worker] تخزين الملفات الأساسية');
          return cache.addAll(STATIC_FILES);
        })
        .then(() => console.log('[Service Worker] الملفات الأساسية مخزنة')),
      
      // تفعيل Service Worker فوراً
      self.skipWaiting()
    ]).catch(error => {
      console.error('[Service Worker] خطأ في التثبيت:', error);
    })
  );
});

// ========== تنشيط Service Worker ==========
self.addEventListener('activate', event => {
  console.log(`[Service Worker] التنشيط - ${VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // حذف التخزين القديم
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log(`[Service Worker] حذف التخزين القديم: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // المطالبة بالتحكم في جميع العملاء
      self.clients.claim()
    ]).then(() => {
      console.log('[Service Worker] جاهز للعمل!');
      
      // إرسال رسالة للصفحة
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION
          });
        });
      });
    })
  );
});

// ========== معالجة طلبات الشبكة ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // تجاهل طلبات POST وغير GET
  if (event.request.method !== 'GET') return;
  
  // استراتيجيات التخزين حسب نوع الطلب
  if (url.origin === location.origin) {
    // طلبات محلية
    handleLocalRequest(event);
  } else if (url.href.includes('firebase') || url.href.includes('googleapis')) {
    // طلبات Firebase وGoogle
    handleApiRequest(event);
  } else if (url.href.includes('fonts.googleapis.com') || 
             url.href.includes('cdnjs.cloudflare.com')) {
    // طلبات CDN
    handleCdnRequest(event);
  } else {
    // طلبات عامة
    handleGenericRequest(event);
  }
});

// ========== معالجة الطلبات المحلية ==========
function handleLocalRequest(event) {
  // استراتيجية Network First للتحديثات
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين الرد الجديد
        const responseClone = response.clone();
        caches.open(CACHE_NAMES.ASSETS)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // عرض من التخزين
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            // صفحة عدم الاتصال للطلبات HTML
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // رد افتراضي
            return new Response('عذراً، لا يوجد اتصال بالإنترنت', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
}

// ========== معالجة طلبات API ==========
function handleApiRequest(event) {
  const url = new URL(event.request.url);
  
  // استراتيجية Cache First لبيانات Firebase (للقراءة)
  if (event.request.method === 'GET' && 
      (url.pathname.includes('/products') || 
       url.pathname.includes('/categories'))) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // محاولة جلب البيانات من الشبكة في الخلفية
          const fetchPromise = fetch(event.request)
            .then(response => {
              // تحديث التخزين
              const responseClone = response.clone();
              caches.open(CACHE_NAMES.DATA)
                .then(cache => cache.put(event.request, responseClone));
              return response;
            })
            .catch(() => {
              console.log('[Service Worker] فشل تحديث بيانات API');
            });
          
          // إذا كان هناك بيانات مخزنة، استخدمها
          if (cachedResponse) {
            // إطلاق تحديث في الخلفية
            event.waitUntil(fetchPromise);
            return cachedResponse;
          }
          
          // إذا لم تكن هناك بيانات مخزنة، انتظر الاستجابة
          return fetchPromise;
        })
        .catch(() => {
          // رد افتراضي عند الفشل
          return new Response(JSON.stringify({
            error: 'offline',
            message: 'لا يوجد اتصال بالإنترنت'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // طلبات الكتابة (POST, PUT, DELETE) تذهب مباشرة للشبكة
    event.respondWith(fetch(event.request));
  }
}

// ========== معالجة طلبات CDN ==========
function handleCdnRequest(event) {
  // استراتيجية Cache First للـ CDN
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // تحديث في الخلفية
          fetchAndCache(event.request);
          return cachedResponse;
        }
        return fetchAndCache(event.request);
      })
  );
}

// ========== معالجة الطلبات العامة ==========
function handleGenericRequest(event) {
  // استراتيجية Network First مع fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين الموارد المهمة فقط
        if (isCacheableResponse(event.request, response)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAMES.ASSETS)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            // للملفات الصوتية/المرئية
            if (event.request.destination === 'image') {
              return caches.match('/icons/icon-192x192.png');
            }
            
            // رد افتراضي
            return new Response('', { status: 408 });
          });
      })
  );
}

// ========== وظائف مساعدة ==========

// جلب وتخزين
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      if (isCacheableResponse(request, response)) {
        const responseClone = response.clone();
        caches.open(CACHE_NAMES.ASSETS)
          .then(cache => cache.put(request, responseClone));
      }
      return response;
    })
    .catch(error => {
      console.log('[Service Worker] فشل الجلب:', error);
      throw error;
    });
}

// التحقق من إمكانية التخزين
function isCacheableResponse(request, response) {
  // لا تخزن طلبات POST أو غيرها
  if (request.method !== 'GET') return false;
  
  // التحقق من حالة الرد
  if (!response || response.status !== 200) return false;
  
  // التحقق من نوع المحتوى
  const contentType = response.headers.get('content-type');
  if (!contentType) return false;
  
  // أنواع الملفات القابلة للتخزين
  const cacheableTypes = [
    'text/html',
    'text/css',
    'application/javascript',
    'image/',
    'font/',
    'application/json'
  ];
  
  return cacheableTypes.some(type => contentType.includes(type));
}

// ========== Background Sync ==========
self.addEventListener('sync', event => {
  console.log('[Service Worker] حدث المزامنة:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

// مزامنة الطلبات المعلقة
async function syncPendingOrders() {
  try {
    const db = await openOrdersDB();
    const orders = await getAllPendingOrders(db);
    
    for (const order of orders) {
      try {
        await syncOrderToServer(order);
        await markOrderAsSynced(db, order.id);
        
        console.log(`[Service Worker] تمت مزامنة الطلب ${order.id}`);
      } catch (error) {
        console.error(`[Service Worker] فشل مزامنة الطلب ${order.id}:`, error);
      }
    }
    
    // إشعار المستخدم
    self.registration.showNotification('تمت المزامنة', {
      body: `تمت مزامنة ${orders.length} طلب`,
      icon: '/icons/icon-192x192.png',
      tag: 'sync-complete'
    });
    
  } catch (error) {
    console.error('[Service Worker] خطأ في المزامنة:', error);
  }
}

// ========== IndexedDB للطلبات ==========
function openOrdersDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SupermarketOrders', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('status', 'status');
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function getAllPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const index = store.index('status');
    const request = index.getAll('pending');
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function markOrderAsSynced(db, orderId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const getRequest = store.get(orderId);
    
    getRequest.onsuccess = () => {
      const order = getRequest.result;
      if (order) {
        order.status = 'synced';
        order.syncedAt = new Date().toISOString();
        store.put(order);
      }
      resolve();
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

async function syncOrderToServer(order) {
  // محاكاة إرسال الطلب للسيرفر
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 1000);
  });
}

// ========== Push Notifications المبسطة ==========
self.addEventListener('push', event => {
  let notificationData = {
    title: APP_NAME,
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: 'notification',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// ========== معالجة الرسائل ==========
self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.source.postMessage({ type: 'VERSION', version: VERSION });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.startsWith('static-') || 
              cacheName.startsWith('assets-') || 
              cacheName.startsWith('data-')) {
            caches.delete(cacheName);
          }
        });
      });
      break;
  }
});

console.log(`[Service Worker ${VERSION}] جاهز للتشغيل`);