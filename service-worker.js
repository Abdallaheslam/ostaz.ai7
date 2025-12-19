// ============================================
// Service Worker - سوبر ماركت الأستاذ
// إصدار: 2026.3
// ============================================

const CACHE_NAME = 'ostaz-market-v2026.3';
const OFFLINE_URL = '/ostaz.ai7/offline.html';

// الملفات التي سيتم تخزينها في الكاش عند التثبيت
const PRECACHE_ASSETS = [
  '/ostaz.ai7/',
  '/ostaz.ai7/index.html',
  '/ostaz.ai7/offline.html',
  '/ostaz.ai7/manifest.json',
  '/ostaz.ai7/icons/icon-72x72.png',
  '/ostaz.ai7/icons/icon-96x96.png',
  '/ostaz.ai7/icons/icon-128x128.png',
  '/ostaz.ai7/icons/icon-144x144.png',
  '/ostaz.ai7/icons/icon-152x152.png',
  '/ostaz.ai7/icons/icon-192x192.png',
  '/ostaz.ai7/icons/icon-384x384.png',
  '/ostaz.ai7/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// ====== تثبيت Service Worker ======
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed:', error);
      })
  );
});

// ====== تفعيل Service Worker ======
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker: Activating...');
  
  // حذف الكاش القديم
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// ====== استقبال الطلبات ======
self.addEventListener('fetch', event => {
  // تجاهل طلبات POST وطلبات Firebase
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebasestorage.googleapis.com') ||
      event.request.url.includes('firebaseapp.com')) {
    return;
  }
  
  // استراتيجية Network First مع fallback للكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين الاستجابة في الكاش
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال، استخدم الكاش
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // إذا لم تكن الصفحة الرئيسية، ارجع لصفحة غير متصل
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // محاولة جلب من الكاش العام
            return caches.match(event.request.url);
          });
      })
  );
});

// ====== استقبال الرسائل من الصفحة ======
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ====== تحديث الكاش في الخلفية ======
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('🔄 Service Worker: Background sync for orders');
    event.waitUntil(syncOrders());
  }
});

// دالة لمزامنة الطلبات
function syncOrders() {
  return new Promise((resolve, reject) => {
    // هنا يمكنك إضافة كود مزامنة الطلبات مع السيرفر
    console.log('🔄 Syncing orders...');
    resolve();
  });
}

// ====== دفع الإشعارات ======
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من سوبر ماركت الأستاذ',
    icon: '/ostaz.ai7/icons/icon-192x192.png',
    badge: '/ostaz.ai7/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/ostaz.ai7/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('سوبر ماركت الأستاذ', options)
  );
});

// ====== النقر على الإشعار ======
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/ostaz.ai7/');
        }
      })
  );
});