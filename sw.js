// إصدار التطبيق
const CACHE_VERSION = '2026.3.1';
const CACHE_NAME = `ostaz-market-${CACHE_VERSION}`;

// الملفات التي سيتم تخزينها مؤقتاً عند التثبيت
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// استراتيجيات التخزين المؤقت
const CACHE_STRATEGIES = {
  STATIC: 'static',
  API: 'api',
  IMAGES: 'images'
};

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] تخزين الملفات الأساسية مؤقتاً');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('[Service Worker] تم التثبيت بنجاح');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] التفعيل...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف الذاكرة المؤقتة القديمة
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] حذف ذاكرة مؤقتة قديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] تم التفعيل بنجاح');
      return self.clients.claim();
    })
  );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // استراتيجيات التخزين المؤقت
  if (event.request.method === 'GET') {
    // للملفات الثابتة
    if (url.pathname === '/' || 
        url.pathname === '/index.html' ||
        url.pathname === '/manifest.json' ||
        url.pathname.includes('.css') ||
        url.pathname.includes('.js')) {
      event.respondWith(cacheStaticFiles(event));
    }
    // للصور
    else if (url.pathname.includes('/icons/') || 
             url.pathname.includes('.png') || 
             url.pathname.includes('.jpg') ||
             url.pathname.includes('.jpeg') ||
             url.pathname.includes('.webp')) {
      event.respondWith(cacheImages(event));
    }
    // لطلبات API
    else if (url.hostname.includes('firebase') || 
             url.hostname.includes('googleapis')) {
      event.respondWith(cacheApiRequests(event));
    }
    // أي طلبات أخرى
    else {
      event.respondWith(networkFirst(event));
    }
  }
});

// استراتيجية الملفات الثابتة (Cache First)
async function cacheStaticFiles(event) {
  try {
    // محاولة جلب من الذاكرة المؤقتة أولاً
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا لم يكن موجود في الذاكرة، جلب من الشبكة
    const networkResponse = await fetch(event.request);
    
    // تخزين في الذاكرة المؤقتة للمستقبل
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] خطأ في جلب الملف:', error);
    
    // إذا لم يكن متصل بالإنترنت وعندنا ملف offline
    if (event.request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// استراتيجية الصور (Cache First with update)
async function cacheImages(event) {
  const cache = await caches.open('images-cache');
  
  // محاولة جلب من الذاكرة المؤقتة أولاً
  const cachedResponse = await cache.match(event.request);
  if (cachedResponse) {
    // تحديث الذاكرة المؤقتة في الخلفية
    event.waitUntil(
      fetch(event.request).then(response => {
        if (response.ok) {
          cache.put(event.request, response);
        }
      })
    );
    return cachedResponse;
  }
  
  // جلب من الشبكة
  try {
    const networkResponse = await fetch(event.request);
    if (networkResponse.ok) {
      cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] خطأ في جلب الصورة:', error);
    // إرجاع صورة بديلة إذا فشل
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#6B5BFF"/><text x="100" y="100" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">صورة غير متوفرة</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// استراتيجية API (Network First with cache fallback)
async function cacheApiRequests(event) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(event.request);
    
    // تخزين في ذاكرة API المؤقتة
    if (networkResponse.ok) {
      const cache = await caches.open('api-cache');
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] غير متصل بالإنترنت، جاري جلب من الذاكرة المؤقتة');
    
    // جلب من الذاكرة المؤقتة
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إرجاع رد افتراضي
    return new Response(
      JSON.stringify({ error: 'أنت غير متصل بالإنترنت' }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'X-Offline': 'true'
        } 
      }
    );
  }
}

// استراتيجية الشبكة أولاً (Network First)
async function networkFirst(event) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(event.request);
    
    // تخزين في الذاكرة المؤقتة
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] خطأ في الشبكة، جاري جلب من الذاكرة المؤقتة');
    
    // جلب من الذاكرة المؤقتة
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا كانت طلب صفحة وإحنا مش متصلين
    if (event.request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// استلام رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('[Service Worker] تم مسح جميع الذاكرة المؤقتة');
      event.ports[0].postMessage({ success: true });
    });
  }
});

// إشعارات Push (للمستقبل)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من سوبر ماركت الأستاذ',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('سوبر ماركت الأستاذ', options)
  );
});

// تفاعل مع الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});