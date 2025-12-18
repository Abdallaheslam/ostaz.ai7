// ==================================================
// Service Worker - سوبر ماركت الأستاذ
// إصدار 2026.3 - مع تقنية Caching متقدمة
// ==================================================

const CACHE_NAME = 'supermarket-cache-v2026.3';
const OFFLINE_URL = '/offline.html';

// الموارد التي سيتم تخزينها في cache عند التثبيت
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  './icons/icon-72x72.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// ==================================================
// مرحلة التثبيت - تخزين الموارد الأساسية
// ==================================================
self.addEventListener('install', (event) => {
  console.log('[Service Worker] التثبيت يبدأ...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] جاري تخزين الملفات الأساسية...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] التثبيت مكتمل!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] خطأ في التثبيت:', error);
      })
  );
});

// ==================================================
// مرحلة التنشيط - تنظيف الذاكرة القديمة
// ==================================================
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] التنشيط يبدأ...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] جاري حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] جميع الكاشات القديمة تم حذفها!');
      return self.clients.claim();
    })
  );
});

// ==================================================
// استراتيجية التخزين الذكية
// ==================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // تجاهل الطلبات من Firebase وغيرها من الـ APIs
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') || 
      url.hostname.includes('gstatic')) {
    return fetch(event.request);
  }
  
  // استراتيجية Cache First مع تحديث في الخلفية
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إرجاع النسخة المخزنة إن وجدت
        if (cachedResponse) {
          // تحديث الكاش في الخلفية
          fetchAndCache(event.request);
          return cachedResponse;
        }
        
        // إذا لم تكن مخزنة، جلب من الشبكة ثم تخزين
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // إذا فشل الاتصال، عرض صفحة Offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        
        // للطلبات الأخرى، إرجاع رد افتراضي
        return new Response('لا يوجد اتصال بالإنترنت', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// ==================================================
// دالة مساعدة لجلب وتخزين الطلبات
// ==================================================
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // التحقق من أن الرد صالح للتخزين
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      
      // استنساخ الرد للتخزين
      const responseToCache = response.clone();
      
      // فتح الكاش وتخزين الرد
      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseToCache);
        });
      
      return response;
    })
    .catch((error) => {
      console.error('[Service Worker] خطأ في الجلب:', error);
      throw error;
    });
}

// ==================================================
// الرسائل من الصفحة الرئيسية
// ==================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    updateCache();
  }
});

// ==================================================
// تحديث الكاش يدويًا
// ==================================================
function updateCache() {
  caches.open(CACHE_NAME)
    .then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
    .then(() => {
      console.log('[Service Worker] تم تحديث الكاش بنجاح!');
    })
    .catch((error) => {
      console.error('[Service Worker] خطأ في تحديث الكاش:', error);
    });
}

// ==================================================
// Background Sync (لمزامنة الطلبات عند اتصال الإنترنت)
// ==================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncOrders() {
  // هنا يمكنك إضافة منطق مزامنة الطلبات
  console.log('[Service Worker] جاري مزامنة الطلبات...');
}

async function syncCart() {
  // هنا يمكنك إضافة منطق مزامنة العربة
  console.log('[Service Worker] جاري مزامنة العربة...');
}

// ==================================================
// Push Notifications
// ==================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'إشعار جديد من سوبر ماركت الأستاذ',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
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
    self.registration.showNotification(data.title || 'سوبر ماركت الأستاذ', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});