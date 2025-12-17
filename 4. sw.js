/******************************************************************
 * Service Worker لتطبيق سوبر ماركت الأستاذ
 * الإصدار: 2026.4.0
 * المطور: فريق سوبر ماركت الأستاذ
 * الوظائف: التخزين المؤقت، التحديث الخلفي، الإشعارات
 ******************************************************************/

const CACHE_VERSION = 'supermarket-v2026.4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    
    // الأيقونات
    './icons/icon-72x72.png',
    './icons/icon-144x144.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    
    // الخطوط
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    
    // مكتبات CSS
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// الملفات الديناميكية (التخزين حسب الطلب)
const DYNAMIC_ASSETS = [
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Static assets cached');
                return caches.open(OFFLINE_CACHE);
            })
            .then((cache) => {
                console.log('[Service Worker] Caching offline page');
                return cache.addAll(['./offline.html']);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// تنشيط Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // حذف الكاش القديم
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== OFFLINE_CACHE) {
                            console.log('[Service Worker] Removing old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[Service Worker] Activation failed:', error);
            })
    );
});

// معالجة طلبات Fetch
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // تجاهل طلبات غير GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // تجاهل طلبات Firebase و Google APIs
    if (url.href.includes('firebase') || 
        url.href.includes('googleapis') || 
        url.href.includes('gstatic')) {
        return;
    }
    
    // تجاهل طلبات البيانات الديناميكية
    if (url.href.includes('/api/') || 
        url.href.includes('sockjs') ||
        url.href.includes('hot-update')) {
        return;
    }
    
    // استراتيجية Cache First مع Network Fallback
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // إذا كان الملف موجوداً في الكاش
                if (cachedResponse) {
                    // تحديث الكاش في الخلفية
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // جلب من الشبكة
                return fetch(event.request)
                    .then((response) => {
                        // نسخة من الرد للتخزين المؤقت
                        const responseToCache = response.clone();
                        
                        // تخزين في الكاش الديناميكي
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(async (error) => {
                        console.log('[Service Worker] Fetch failed, serving fallback:', error.message);
                        
                        // إذا كان طلب HTML، عرض صفحة عدم الاتصال
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            const offlineResponse = await caches.match('./offline.html');
                            if (offlineResponse) return offlineResponse;
                        }
                        
                        // إذا كانت صورة، عرض أيقونة بديلة
                        if (event.request.destination === 'image') {
                            const icon = await caches.match('./icons/icon-192x192.png');
                            if (icon) return icon;
                        }
                        
                        // رد افتراضي
                        return new Response('عذراً، لا يوجد اتصال بالإنترنت', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    });
            })
    );
});

// جلب وتحديث الكاش في الخلفية
function fetchAndCache(request) {
    fetch(request)
        .then((response) => {
            // التحقق من أن الرد ناجح
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            
            // نسخة من الرد للتحديث
            const responseToCache = response.clone();
            
            caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
        })
        .catch((error) => {
            console.log('[Service Worker] Background fetch failed:', error);
        });
}

// Background Sync للطلبات
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync event:', event.tag);
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncPendingOrders());
    }
    
    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    }
});

// مزامنة الطلبات المعلقة
async function syncPendingOrders() {
    try {
        console.log('[Service Worker] Syncing pending orders...');
        
        // جلب الطلبات المعلقة من IndexedDB
        const db = await openOrdersDB();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        const pendingOrders = await store.getAll();
        
        console.log(`[Service Worker] Found ${pendingOrders.length} pending orders`);
        
        // مزامنة كل طلب
        for (const order of pendingOrders) {
            if (order.status === 'pending') {
                try {
                    const response = await fetch('https://supermarket-3aboda-default-rtdb.firebaseio.com/orders.json', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(order)
                    });
                    
                    if (response.ok) {
                        // تحديث حالة الطلب
                        const updateTx = db.transaction('orders', 'readwrite');
                        const updateStore = updateTx.objectStore('orders');
                        order.status = 'synced';
                        order.syncedAt = new Date().toISOString();
                        await updateStore.put(order);
                        
                        console.log(`[Service Worker] Order ${order.id} synced successfully`);
                        
                        // إرسال إشعار
                        self.registration.showNotification('تمت المزامنة', {
                            body: `تم إرسال طلبك بنجاح`,
                            icon: './icons/icon-192x192.png',
                            badge: './icons/icon-72x72.png',
                            tag: 'sync-success'
                        });
                    }
                } catch (error) {
                    console.error(`[Service Worker] Failed to sync order ${order.id}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('[Service Worker] Sync process failed:', error);
    }
}

// مزامنة سلة التسوق
async function syncCart() {
    try {
        console.log('[Service Worker] Syncing cart...');
        
        // يمكن إضافة منطق مزامنة السلة هنا
        // مثلاً: حفظ السلة على السيرفر
        
    } catch (error) {
        console.error('[Service Worker] Cart sync failed:', error);
    }
}

// IndexedDB للطلبات
async function openOrdersDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SupermarketOrdersDB', 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('orders')) {
                const store = db.createObjectStore('orders', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('status', 'status');
                store.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            reject('Error opening orders DB');
        };
    });
}

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event.data);
    
    let data = {
        title: 'سوبر ماركت الأستاذ',
        body: 'لديك إشعار جديد',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-72x72.png',
        tag: 'general-notification'
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (error) {
            data.body = event.data.text() || data.body;
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200, 100, 200],
        data: data,
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: './icons/icon-72x72.png'
            },
            {
                action: 'dismiss',
                title: 'تجاهل',
                icon: './icons/icon-72x72.png'
            }
        ],
        requireInteraction: true,
        silent: false
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// التعامل مع نقرات الإشعارات
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // فتح التطبيق عند النقر على الإشعار
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            // البحث عن نافذة مفتوحة للتطبيق
            for (const client of clientList) {
                if (client.url.includes('/index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // إذا لم تكن هناك نافذة مفتوحة، افتح نافذة جديدة
            if (clients.openWindow) {
                return clients.openWindow('./index.html');
            }
        })
    );
});

// التعامل مع إغلاق الإشعارات
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event.notification.tag);
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-products') {
        console.log('[Service Worker] Periodic sync for products');
        event.waitUntil(updateProductsCache());
    }
    
    if (event.tag === 'cleanup-cache') {
        console.log('[Service Worker] Periodic cache cleanup');
        event.waitUntil(cleanupOldCache());
    }
});

// تحديث كاش المنتجات
async function updateProductsCache() {
    try {
        console.log('[Service Worker] Updating products cache...');
        
        // يمكن إضافة منطق تحديث المنتجات هنا
        
    } catch (error) {
        console.error('[Service Worker] Products cache update failed:', error);
    }
}

// تنظيف الكاش القديم
async function cleanupOldCache() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // أسبوع
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const cachedDate = new Date(dateHeader).getTime();
                    if (cachedDate < weekAgo) {
                        await cache.delete(request);
                    }
                }
            }
        }
        
        console.log('[Service Worker] Cache cleanup completed');
    } catch (error) {
        console.error('[Service Worker] Cache cleanup error:', error);
    }
}

// Message Handling من الصفحة
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(DYNAMIC_CACHE)
            .then(() => {
                console.log('[Service Worker] Dynamic cache cleared');
                event.source.postMessage({
                    type: 'CACHE_CLEARED'
                });
            });
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        caches.keys()
            .then((cacheNames) => {
                event.source.postMessage({
                    type: 'CACHE_INFO',
                    caches: cacheNames
                });
            });
    }
    
    if (event.data && event.data.type === 'SAVE_ORDER') {
        saveOfflineOrder(event.data.order)
            .then((orderId) => {
                event.source.postMessage({
                    type: 'ORDER_SAVED',
                    orderId: orderId
                });
                
                // تسجيل Background Sync
                if ('sync' in self.registration) {
                    self.registration.sync.register('sync-orders');
                }
            })
            .catch((error) => {
                event.source.postMessage({
                    type: 'ORDER_ERROR',
                    error: error.message || 'Failed to save order'
                });
            });
    }
    
    if (event.data && event.data.type === 'GET_PENDING_ORDERS') {
        getPendingOrders()
            .then((orders) => {
                event.source.postMessage({
                    type: 'PENDING_ORDERS',
                    orders: orders
                });
            })
            .catch((error) => {
                event.source.postMessage({
                    type: 'ORDERS_ERROR',
                    error: error.message || 'Failed to get orders'
                });
            });
    }
});

// حفظ الطلب دون اتصال
async function saveOfflineOrder(orderData) {
    try {
        const db = await openOrdersDB();
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');
        
        orderData.status = 'pending';
        orderData.createdAt = new Date().toISOString();
        orderData.offline = true;
        
        const request = store.add(orderData);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = function() {
                console.log('[Service Worker] Order saved offline:', request.result);
                resolve(request.result);
            };
            
            request.onerror = function() {
                reject('Failed to save order');
            };
        });
    } catch (error) {
        console.error('[Service Worker] Error saving offline order:', error);
        throw error;
    }
}

// جلب الطلبات المعلقة
async function getPendingOrders() {
    try {
        const db = await openOrdersDB();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        const index = store.index('status');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll('pending');
            
            request.onsuccess = function() {
                resolve(request.result || []);
            };
            
            request.onerror = function() {
                reject('Failed to get orders');
            };
        });
    } catch (error) {
        console.error('[Service Worker] Error getting pending orders:', error);
        return [];
    }
}

console.log('[Service Worker] Loaded successfully');