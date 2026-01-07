// إصدار التطبيق
const CACHE_VERSION = '2026.3.1';
const CACHE_NAME = `supermarket-cache-${CACHE_VERSION}`;

// الملفات التي سيتم تخزينها مؤقتاً عند التثبيت
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/responsive.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/cart.js',
  '/assets/js/products.js',
  '/assets/js/ui.js',
  '/assets/js/firebase-config.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

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
      .catch(error => {
        console.error('[Service Worker] خطأ في التثبيت:', error);
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
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // استراتيجية Network First للطلبات الديناميكية
  if (url.pathname.includes('/api/') || url.hostname.includes('firebase')) {
    event.respondWith(networkFirst(event));
    return;
  }
  
  // استراتيجية Cache First للملفات الثابتة
  event.respondWith(cacheFirst(event));
});

// استراتيجية Cache First
async function cacheFirst(event) {
  try {
    // محاولة جلب من الذاكرة المؤقتة أولاً
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا لم يكن موجود في الذاكرة، جلب من الشبكة
    const networkResponse = await fetch(event.request);
    
    // تخزين في الذاكرة المؤقتة للمستقبل
    if (networkResponse.ok && event.request.url.startsWith('http')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] خطأ في cacheFirst:', error);
    
    // إذا كان طلب صفحة وإحنا مش متصلين
    if (event.request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// استراتيجية Network First
async function networkFirst(event) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(event.request);
    
    // تخزين في الذاكرة المؤقتة
    if (networkResponse.ok && event.request.url.startsWith('http')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] غير متصل، جاري جلب من الذاكرة المؤقتة');
    
    // جلب من الذاكرة المؤقتة
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// استقبال رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});