/**************************************************************************
 * تطبيق سوبر ماركت الأستاذ - النسخة المحسنة
 * إصدار 2026.3 - مع إصلاح جميع المشاكل
 **************************************************************************/

// ---------- إعدادات التطبيق ----------
const APP_CONFIG = {
    name: 'سوبر ماركت الأستاذ',
    version: '2026.3.1',
    whatsapp: "201550462808",
    phone: "01550462808",
    address: "شارع عبدالحافظ، بنها، القليوبية"
};

// ---------- متغيرات التطبيق ----------
let currentUser = null;
let userData = null;
let globalProducts = [];
let cart = [];
let favorites = [];
let notifications = [];
let categories = [];

// ---------- تهيئة التطبيق ----------
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 بدء تشغيل تطبيق سوبر ماركت الأستاذ');
    
    try {
        // تهيئة Firebase
        await initializeFirebase();
        
        // إعداد المستخدم
        setupAuth();
        
        // تحميل البيانات
        await loadInitialData();
        
        // تحديث واجهة المستخدم
        updateUI();
        
        // إعداد الأحداث
        setupEventListeners();
        
        // تسجيل Service Worker
        registerServiceWorker();
        
        console.log('✅ التطبيق جاهز للاستخدام');
    } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        showNotification('حدث خطأ في تحميل التطبيق', 'error');
    }
});

// ---------- تهيئة Firebase ----------
async function initializeFirebase() {
    try {
        // تحميل الإعدادات من ملف منفصل
        if (!firebase.apps.length) {
            firebase.initializeApp(window.firebaseConfig);
        }
        
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.storage = firebase.storage();
        
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        throw new Error('تعذر تهيئة قاعدة البيانات');
    }
}

// ---------- تحميل البيانات الأولية ----------
async function loadInitialData() {
    try {
        // تحميل التصنيفات
        await loadCategories();
        
        // تحميل المنتجات
        await loadProducts();
        
        // تحميل العربة من التخزين المحلي
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // تحميل المفضلة من التخزين المحلي
        favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        // تحديث العداد
        updateCartBadge();
        updateFavoritesBadge();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// ---------- إعداد المصادقة ----------
function setupAuth() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            // تحميل بيانات المستخدم
            await loadUserData(user);
            
            // إظهار زر الإدارة إذا كان المدير
            if (userData.role === 'admin') {
                document.getElementById('adminFloatBtn').style.display = 'flex';
            }
            
            // تحميل الإشعارات
            await loadNotifications();
            
            // إخفاء أزرار تسجيل الدخول واظهار صورة المستخدم
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userProfile').style.display = 'flex';
            
        } else {
            userData = null;
            document.getElementById('adminFloatBtn').style.display = 'none';
            
            // اظهار أزرار تسجيل الدخول وإخفاء صورة المستخدم
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userProfile').style.display = 'none';
        }
        
        updateUI();
    });
}

async function loadUserData(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
        } else {
            // إنشاء مستخدم جديد
            userData = {
                name: user.displayName || user.email?.split('@')[0] || 'مستخدم',
                email: user.email,
                phone: '',
                address: '',
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6B5BFF&color=fff&size=64`
            };
            
            await db.collection('users').doc(user.uid).set(userData);
            
            // إشعار المديرين بمستخدم جديد
            notifyAdminsNewUser(user.uid, userData.name, user.email);
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ---------- تحديث واجهة المستخدم ----------
function updateUI() {
    // تحديث اسم المستخدم وصورته
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (currentUser && userData) {
        userNameEl.textContent = userData.name;
        userAvatarEl.src = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6B5BFF&color=fff&size=64`;
    } else {
        userNameEl.textContent = 'مستخدم';
        userAvatarEl.src = 'https://ui-avatars.com/api/?name=مستخدم&background=6B5BFF&color=fff&size=64';
    }
}

// ---------- Service Worker ----------
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker registered:', registration.scope);
            
            // التحقق من التحديثات
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showNotification('يوجد تحديث جديد متاح!', 'info');
                    }
                });
            });
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }
}

// ---------- إعداد الأحداث ----------
function setupEventListeners() {
    // تأثير التمرير على النافبار
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // تحديث حالة الاتصال
    window.addEventListener('online', () => {
        showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('أنت غير متصل بالإنترنت', 'warning');
    });
    
    // إغلاق المودالات عند الضغط على زر الهروب
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // البحث عند الضغط على Enter
    document.querySelector('.search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
    
    // إغلاق بحث الهواتف عند النقر خارجها
    document.addEventListener('click', (e) => {
        const mobileSearch = document.getElementById('mobileSearch');
        const mobileSearchBtn = document.querySelector('.mobile-search-btn');
        
        if (mobileSearch && mobileSearchBtn && 
            !mobileSearch.contains(e.target) && 
            !mobileSearchBtn.contains(e.target) && 
            mobileSearch.style.display === 'flex') {
            mobileSearch.style.display = 'none';
        }
    });
}

// ---------- دوال المساعدة ----------
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#25D366' : type === 'error' ? '#FF2D55' : type === 'warning' ? '#FF9500' : '#6B5BFF'};
        color: white;
        padding: 15px 25px;
        border-radius: var(--border-radius-md);
        z-index: 9999;
        box-shadow: var(--shadow-lg);
        animation: slideInDown 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function setActiveNav(item) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    item.classList.add('active');
}

function closeModal() {
    document.getElementById('modalsContainer').innerHTML = '';
}

function goHome() {
    location.reload();
}

function toggleMobileSearch() {
    const mobileSearch = document.getElementById('mobileSearch');
    mobileSearch.style.display = mobileSearch.style.display === 'flex' ? 'none' : 'flex';
    
    if (mobileSearch.style.display === 'flex') {
        document.getElementById('mobileSearchInput').focus();
    }
}

function searchFromMobile() {
    const searchTerm = document.getElementById('mobileSearchInput').value.trim();
    if (searchTerm) {
        searchProducts(searchTerm);
        toggleMobileSearch();
    }
}

// ---------- دوال التواصل ----------
function openWhatsapp() {
    window.open(`https://wa.me/${APP_CONFIG.whatsapp}`, '_blank');
}

function openPhone() {
    window.open(`tel:${APP_CONFIG.phone}`, '_self');
}

// ---------- إشعارات النظام ----------
function notifyAdminsNewUser(userId, userName, userEmail) {
    db.collection('users')
        .where('role', '==', 'admin')
        .get()
        .then(snapshot => {
            snapshot.docs.forEach(doc => {
                db.collection('notifications').add({
                    userId: doc.id,
                    title: 'مستخدم جديد',
                    message: `تم تسجيل مستخدم جديد: ${userName} (${userEmail})`,
                    type: 'new_user',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        })
        .catch(console.error);
}

function notifyAdminsNewOrder(orderId, userName, total) {
    db.collection('users')
        .where('role', '==', 'admin')
        .get()
        .then(snapshot => {
            snapshot.docs.forEach(doc => {
                db.collection('notifications').add({
                    userId: doc.id,
                    title: 'طلب جديد',
                    message: `طلب جديد من ${userName} بقيمة ${total.toFixed(2)} جنيه (رقم الطلب: #${orderId.substring(0, 8)})`,
                    type: 'new_order',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        })
        .catch(console.error);
}

// ---------- Export للاستخدام في ملفات أخرى ----------
window.APP_CONFIG = APP_CONFIG;
window.currentUser = currentUser;
window.userData = userData;
window.globalProducts = globalProducts;
window.cart = cart;
window.favorites = favorites;
window.notifications = notifications;
window.categories = categories;

window.showNotification = showNotification;
window.closeModal = closeModal;
window.goHome = goHome;
window.setActiveNav = setActiveNav;
window.toggleMobileSearch = toggleMobileSearch;
window.searchFromMobile = searchFromMobile;
window.openWhatsapp = openWhatsapp;
window.openPhone = openPhone;