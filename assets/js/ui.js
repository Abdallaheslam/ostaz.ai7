// =============== واجهة المستخدم الإضافية ===============

// نظام المفضلة
function toggleFavorite(productId, button = null) {
    if (!currentUser) {
        showNotification('سجل دخول لإضافة المنتج للمفضلة', 'warning');
        openLoginModal();
        return;
    }
    
    const isFavorite = favorites.some(fav => fav.id === productId);
    const product = globalProducts.find(p => p.id === productId);
    
    if (isFavorite) {
        // إزالة من المفضلة
        favorites = favorites.filter(fav => fav.id !== productId);
        if (button) {
            button.classList.remove('active');
            button.innerHTML = '<i class="far fa-heart"></i>';
        }
        showNotification('تمت الإزالة من المفضلة', 'info');
    } else {
        // إضافة إلى المفضلة
        if (product) {
            favorites.push({
                id: productId,
                name: product.name,
                price: product.price,
                discount: product.discount || 0,
                image: product.imageUrl || product.image,
                category: product.category
            });
            if (button) {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-heart"></i>';
            }
            showNotification('تمت الإضافة للمفضلة', 'success');
        }
    }
    
    // حفظ المفضلة
    saveFavorites();
    
    // تحديث عداد المفضلة
    updateFavoritesBadge();
}

// حفظ المفضلة في التخزين المحلي
function saveFavorites() {
    try {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

// تحديث عداد المفضلة
function updateFavoritesBadge() {
    const totalFavorites = favorites.length;
    const favoritesBadge = document.getElementById('favoritesBadge');
    const favoritesBottomBadge = document.getElementById('favoritesBottomBadge');
    
    if (favoritesBadge) {
        favoritesBadge.textContent = totalFavorites;
        favoritesBadge.style.display = totalFavorites > 0 ? 'flex' : 'none';
    }
    
    if (favoritesBottomBadge) {
        favoritesBottomBadge.textContent = totalFavorites;
        favoritesBottomBadge.style.display = totalFavorites > 0 ? 'flex' : 'none';
    }
}

// فتح صفحة المفضلة
function openWishlist() {
    if (!currentUser) {
        showNotification('سجل دخول لعرض المفضلة', 'warning');
        openLoginModal();
        return;
    }
    
    if (favorites.length === 0) {
        showEmptyWishlistModal();
        return;
    }
    
    showWishlistPage();
}

// عرض رسالة المفضلة الفارغة
function showEmptyWishlistModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-body">
                    <div class="text-center" style="padding: 40px 20px;">
                        <i class="fas fa-heart fa-4x mb-3" style="color: #e0e0e0;"></i>
                        <h3 class="mb-3">قائمة المفضلة فارغة</h3>
                        <p class="text-muted mb-4">لم تقم بإضافة أي منتجات إلى المفضلة بعد</p>
                        <button class="btn btn-primary" onclick="closeModal(); showAllProductsPage();">
                            <i class="fas fa-shopping-bag"></i>
                            تصفح المنتجات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// عرض صفحة المفضلة
function showWishlistPage() {
    const content = `
        <section class="hero-section" style="background: linear-gradient(135deg, rgba(255, 45, 85, 0.9), rgba(255, 71, 87, 0.9)), url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">❤️ قائمة المفضلة</h1>
                <p class="hero-subtitle">${favorites.length} منتج في قائمة المفضلة</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-heart"></i>
                    منتجاتي المفضلة
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            <div class="products-grid">
                ${renderWishlistProducts()}
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// عرض منتجات المفضلة
function renderWishlistProducts() {
    return favorites.map(product => {
        const isFavorite = true;
        const isInCart = cart.some(item => item.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-actions">
                    <button class="action-btn active" onclick="toggleFavorite('${product.id}', this)">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="shareProduct('${product.id}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                
                <img src="${product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
                     alt="${product.name}"
                     class="product-image">
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category || 'عام'}</div>
                    
                    <div class="product-price">
                        <span class="price-current">
                            ${(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)} جنيه
                        </span>
                        ${product.discount > 0 ? `
                            <span class="price-old">${product.price.toFixed(2)} جنيه</span>
                        ` : ''}
                    </div>
                    
                    <button class="add-to-cart-btn ${isInCart ? 'btn-success' : ''}" onclick="addToCart('${product.id}', this)">
                        <i class="fas fa-cart-plus"></i>
                        أضف إلى العربة
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// تحميل الإشعارات
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateNotificationsBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// تحديث عداد الإشعارات
function updateNotificationsBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const notificationBadge = document.getElementById('notificationBadge');
    const notifBadge = document.getElementById('notifBadge');
    
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    if (notifBadge) {
        notifBadge.textContent = unreadCount;
        notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// فتح الإشعارات
function openNotifications() {
    if (!currentUser) {
        showNotification('سجل دخول لعرض الإشعارات', 'warning');
        openLoginModal();
        return;
    }
    
    showNotificationsModal();
}

// عرض نافذة الإشعارات
function showNotificationsModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px;">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-bell"></i>
                        الإشعارات
                    </h2>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                    ${notifications.length > 0 ? renderNotifications() : `
                        <div class="text-center" style="padding: 40px 20px;">
                            <i class="fas fa-bell-slash fa-3x mb-3" style="color: #e0e0e0;"></i>
                            <h3 class="mb-3">لا توجد إشعارات</h3>
                            <p class="text-muted">ستظهر الإشعارات هنا عند توفرها</p>
                        </div>
                    `}
                </div>
                ${notifications.length > 0 ? `
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="markAllNotificationsAsRead()">
                            <i class="fas fa-check-double"></i>
                            تحديد الكل كمقروء
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// عرض الإشعارات
function renderNotifications() {
    return notifications.map(notif => `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); background: ${notif.read ? 'transparent' : 'rgba(107, 91, 255, 0.05)'};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong>${notif.title}</strong>
                <small style="color: var(--text-light);">
                    ${notif.createdAt?.toDate ? formatDate(notif.createdAt.toDate()) : 'قريباً'}
                </small>
            </div>
            <p style="color: var(--text-secondary); margin: 0;">${notif.message}</p>
            ${!notif.read ? '<small style="color: var(--primary-color);">غير مقروء</small>' : ''}
        </div>
    `).join('');
}

// تحديد جميع الإشعارات كمقروءة
async function markAllNotificationsAsRead() {
    if (!currentUser || notifications.length === 0) return;
    
    try {
        const batch = db.batch();
        const notificationsRef = db.collection('notifications');
        
        const unreadNotifications = notifications.filter(notif => !notif.read);
        
        if (unreadNotifications.length === 0) {
            showNotification('لا توجد إشعارات غير مقروءة', 'info');
            return;
        }
        
        unreadNotifications.forEach(notif => {
            const notifRef = notificationsRef.doc(notif.id);
            batch.update(notifRef, { read: true });
        });
        
        await batch.commit();
        
        // تحديث البيانات المحلية
        notifications.forEach(notif => notif.read = true);
        updateNotificationsBadge();
        
        showNotification(`تم تحديد ${unreadNotifications.length} إشعار كمقروء`, 'success');
        
        // تحديث واجهة الإشعارات
        openNotifications();
        
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        showNotification('حدث خطأ في تحديث الإشعارات', 'error');
    }
}

// فتح الملف الشخصي
function openProfile() {
    if (!currentUser) {
        showNotification('سجل دخول لعرض الملف الشخصي', 'warning');
        openLoginModal();
        return;
    }
    
    showProfileModal();
}

// عرض نافذة الملف الشخصي
function showProfileModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 500px;">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-user"></i>
                        الملف الشخصي
                    </h2>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6B5BFF&color=fff&size=128`}" 
                             alt="${userData.name}"
                             style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--primary-color); margin-bottom: 15px;">
                        <h3>${userData.name}</h3>
                        <p class="text-muted">${userData.email}</p>
                    </div>
                    
                    <div style="background: rgba(107, 91, 255, 0.05); border-radius: var(--border-radius-md); padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: var(--text-light);">الدور:</span>
                            <span style="font-weight: 600;">${userData.role === 'admin' ? 'مدير' : 'عميل'}</span>
                        </div>
                        
                        ${userData.phone ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: var(--text-light);">الهاتف:</span>
                                <span style="font-weight: 600;">${userData.phone}</span>
                            </div>
                        ` : ''}
                        
                        ${userData.address ? `
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-light);">العنوان:</span>
                                <span style="font-weight: 600; text-align: left; max-width: 200px;">${userData.address}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="openEditProfile()">
                        <i class="fas fa-edit"></i>
                        تعديل الملف الشخصي
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// فتح نموذج تعديل الملف الشخصي
function openEditProfile() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-edit"></i>
                        تعديل الملف الشخصي
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">الاسم الكامل</label>
                        <input type="text" class="form-control" id="editProfileName" value="${userData?.name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف</label>
                        <input type="tel" class="form-control" id="editProfilePhone" value="${userData?.phone || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">العنوان</label>
                        <textarea class="form-control" id="editProfileAddress" rows="3">${userData?.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">صورة الملف الشخصي (رابط URL)</label>
                        <input type="url" class="form-control" id="editProfilePhoto" 
                               value="${userData?.photoURL || ''}"
                               placeholder="https://example.com/photo.jpg">
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="updateProfile()">
                        <i class="fas fa-save"></i>
                        حفظ التغييرات
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// تحديث الملف الشخصي
async function updateProfile() {
    const name = document.getElementById('editProfileName').value.trim();
    const phone = document.getElementById('editProfilePhone').value.trim();
    const address = document.getElementById('editProfileAddress').value.trim();
    const photoURL = document.getElementById('editProfilePhoto').value.trim();
    
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (photoURL) updates.photoURL = photoURL;
    
    if (Object.keys(updates).length === 0) {
        showNotification('لم تقم بإجراء أي تغييرات', 'warning');
        return;
    }
    
    const success = await updateUserProfile(updates);
    if (success) {
        closeModal();
        openProfile();
    }
}

// فتح العناوين
function openAddresses() {
    if (!currentUser) {
        showNotification('سجل دخول لإدارة العناوين', 'warning');
        openLoginModal();
        return;
    }
    
    showAddressesModal();
}

// عرض نافذة العناوين
async function showAddressesModal() {
    try {
        const snapshot = await db.collection('addresses')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const modalHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="fas fa-map-marker-alt"></i>
                            إدارة العناوين
                        </h2>
                    </div>
                    <div class="modal-body">
                        <div id="addressesList">
                            ${addresses.length > 0 ? renderAddresses(addresses) : `
                                <div class="text-center" style="padding: 40px 20px;">
                                    <i class="fas fa-map-marker-alt fa-3x mb-3" style="color: #e0e0e0;"></i>
                                    <h3 class="mb-3">لا توجد عناوين</h3>
                                    <p class="text-muted mb-4">يمكنك إضافة عنوان جديد</p>
                                </div>
                            `}
                        </div>
                        
                        <button class="btn btn-primary btn-block mt-3" onclick="openAddAddress()">
                            <i class="fas fa-plus"></i>
                            إضافة عنوان جديد
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalsContainer').innerHTML = modalHTML;
        
    } catch (error) {
        console.error('Error loading addresses:', error);
        showNotification('حدث خطأ في تحميل العناوين', 'error');
    }
}

// عرض العناوين
function renderAddresses(addresses) {
    return addresses.map(address => `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>${address.title}</strong>
                ${address.isDefault ? '<span style="color: var(--primary-color); font-size: 0.8rem;">افتراضي</span>' : ''}
            </div>
            <p style="margin: 0; color: var(--text-secondary);">${address.name}</p>
            <p style="margin: 5px 0; color: var(--text-secondary);">${address.phone}</p>
            <p style="margin: 0; color: var(--text-secondary);">${address.details}, ${address.city}</p>
            <div style="margin-top: 10px;">
                <button class="btn btn-sm btn-outline" onclick="setDefaultAddress('${address.id}')">
                    تعيين كافتراضي
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAddress('${address.id}')">
                    حذف
                </button>
            </div>
        </div>
    `).join('');
}

// فتح نموذج إضافة عنوان
function openAddAddress() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-plus"></i>
                        إضافة عنوان جديد
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">اسم العنوان (مثال: المنزل، العمل)</label>
                        <input type="text" class="form-control" id="addressTitle" placeholder="المنزل">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">الاسم الكامل</label>
                        <input type="text" class="form-control" id="addressName" value="${userData?.name || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف</label>
                        <input type="tel" class="form-control" id="addressPhone" value="${userData?.phone || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">العنوان التفصيلي</label>
                        <textarea class="form-control" id="addressDetails" rows="3" 
                                  placeholder="الحي، الشارع، المبنى، الشقة..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">المدينة</label>
                        <input type="text" class="form-control" id="addressCity" placeholder="بنها">
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="saveAddress()">
                        <i class="fas fa-save"></i>
                        حفظ العنوان
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// حفظ العنوان
async function saveAddress() {
    try {
        const addressData = {
            userId: currentUser.uid,
            title: document.getElementById('addressTitle').value.trim(),
            name: document.getElementById('addressName').value.trim(),
            phone: document.getElementById('addressPhone').value.trim(),
            details: document.getElementById('addressDetails').value.trim(),
            city: document.getElementById('addressCity').value.trim(),
            isDefault: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // التحقق من البيانات المطلوبة
        if (!addressData.title || !addressData.name || !addressData.phone || !addressData.details || !addressData.city) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        // حفظ العنوان في قاعدة البيانات
        await db.collection('addresses').add(addressData);
        
        showNotification('تم حفظ العنوان بنجاح', 'success');
        closeModal();
        
        // إعادة فتح نافذة العناوين
        setTimeout(() => openAddresses(), 500);
        
    } catch (error) {
        console.error('Error saving address:', error);
        showNotification('حدث خطأ في حفظ العنوان', 'error');
    }
}

// فتح الطلبات
function openOrders() {
    if (!currentUser) {
        showNotification('سجل دخول لعرض الطلبات', 'warning');
        openLoginModal();
        return;
    }
    
    showOrdersPage();
}

// عرض صفحة الطلبات
function showOrdersPage() {
    const content = `
        <section class="hero-section" style="background: linear-gradient(135deg, rgba(107, 91, 255, 0.9), rgba(124, 100, 255, 0.9)), url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">📦 طلباتي</h1>
                <p class="hero-subtitle">تتبع جميع طلباتك السابقة</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-shopping-bag"></i>
                    سجل الطلبات
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            
            <div id="ordersList" class="loading" style="min-height: 200px;">
                <div class="spinner"></div>
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    loadUserOrders();
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// تحميل طلبات المستخدم
async function loadUserOrders() {
    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        const container = document.getElementById('ordersList');
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px 20px;">
                    <i class="fas fa-shopping-bag fa-4x mb-3" style="color: #e0e0e0;"></i>
                    <h3 class="mb-3">لا توجد طلبات سابقة</h3>
                    <p class="text-muted mb-4">يمكنك البدء بالتسوق الآن</p>
                    <button class="btn btn-primary" onclick="showAllProductsPage()">
                        <i class="fas fa-shopping-cart"></i>
                        ابدأ التسوق
                    </button>
                </div>
            `;
            return;
        }
        
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = renderOrders(orders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                <p>حدث خطأ في تحميل الطلبات</p>
            </div>
        `;
    }
}

// عرض الطلبات
function renderOrders(orders) {
    return `
        <div style="background: white; border-radius: var(--border-radius-md); overflow: hidden;">
            ${orders.map(order => {
                const status = getOrderStatus(order.status);
                
                return `
                    <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <div>
                                <strong>رقم الطلب: #${order.id.substring(0, 8)}</strong>
                                <div style="color: var(--text-light); font-size: 0.9rem;">
                                    ${order.createdAt?.toDate ? formatDate(order.createdAt.toDate()) : 'تاريخ غير معروف'}
                                </div>
                            </div>
                            <span style="background: ${status.color}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem;">
                                ${status.text}
                            </span>
                        </div>
                        
                        <div style="color: var(--text-light); margin-bottom: 10px;">
                            ${order.items?.length || 0} منتج | ${order.total?.toFixed(2) || '0'} جنيه
                        </div>
                        
                        <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.id}')">
                            <i class="fas fa-eye"></i>
                            عرض التفاصيل
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// عرض تفاصيل الطلب
async function viewOrderDetails(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            showNotification('الطلب غير موجود', 'error');
            return;
        }
        
        const order = orderDoc.data();
        const status = getOrderStatus(order.status);
        
        const modalHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal" onclick="event.stopPropagation()" style="max-width: 800px;">
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="fas fa-file-invoice"></i>
                            تفاصيل الطلب #${orderId.substring(0, 8)}
                        </h2>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                            <div>
                                <h4 style="margin-bottom: 15px; color: var(--text-primary);">معلومات العميل:</h4>
                                <div style="background: rgba(107, 91, 255, 0.05); border-radius: var(--border-radius-md); padding: 15px;">
                                    <p><strong>الاسم:</strong> ${order.userName || 'غير معروف'}</p>
                                    <p><strong>الهاتف:</strong> ${order.userPhone || 'غير معروف'}</p>
                                    <p><strong>البريد:</strong> ${order.userEmail || 'غير معروف'}</p>
                                    <p><strong>العنوان:</strong> ${order.userAddress || 'غير معروف'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 style="margin-bottom: 15px; color: var(--text-primary);">معلومات الطلب:</h4>
                                <div style="background: rgba(107, 91, 255, 0.05); border-radius: var(--border-radius-md); padding: 15px;">
                                    <p><strong>رقم الطلب:</strong> #${orderId.substring(0, 8)}</p>
                                    <p><strong>تاريخ الطلب:</strong> ${order.createdAt?.toDate ? formatDate(order.createdAt.toDate()) : 'غير معروف'}</p>
                                    <p><strong>الحالة:</strong> ${status.text}</p>
                                    <p><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}</p>
                                    <p><strong>حالة الدفع:</strong> ${order.paymentStatus === 'paid' ? 'مدفوع' : 'قيد الانتظار'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);">المنتجات:</h4>
                        <div style="margin-bottom: 30px;">
                            ${order.items?.map(item => `
                                <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid var(--border-color);">
                                    <img src="${item.image || 'https://via.placeholder.com/50/6B5BFF/ffffff?text=صورة'}" 
                                         style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--border-radius-sm); margin-left: 15px;">
                                    <div style="flex: 1;">
                                        <p style="margin: 0; font-weight: 600;">${item.name}</p>
                                        <p style="margin: 5px 0; color: var(--text-light);">الكمية: ${item.quantity}</p>
                                    </div>
                                    <div>
                                        <p style="margin: 0; font-weight: 600; color: var(--primary-color);">
                                            ${(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toFixed(2)} جنيه
                                        </p>
                                        ${item.discount > 0 ? `
                                            <p style="margin: 5px 0; color: var(--text-light); text-decoration: line-through;">
                                                ${(item.price * item.quantity).toFixed(2)} جنيه
                                            </p>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="background: rgba(107, 91, 255, 0.05); border-radius: var(--border-radius-md); padding: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>المجموع:</span>
                                <span>${order.subtotal?.toFixed(2) || '0'} جنيه</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>الشحن:</span>
                                <span>${order.shipping === 0 ? 'مجاني' : order.shipping?.toFixed(2) + ' جنيه'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; border-top: 2px solid var(--border-color); padding-top: 10px; font-weight: 800; font-size: 1.2rem;">
                                <span>الإجمالي:</span>
                                <span>${order.total?.toFixed(2) || '0'} جنيه</span>
                            </div>
                        </div>
                        
                        ${order.notes ? `
                            <div style="margin-top: 20px;">
                                <h4 style="margin-bottom: 10px; color: var(--text-primary);">ملاحظات:</h4>
                                <div style="background: rgba(107, 91, 255, 0.05); border-radius: var(--border-radius-md); padding: 15px;">
                                    ${order.notes}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="closeModal()">
                            <i class="fas fa-times"></i> إغلاق
                        </button>
                        <button class="btn btn-primary" onclick="shareOrder('${orderId}')">
                            <i class="fas fa-share-alt"></i> مشاركة
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalsContainer').innerHTML = modalHTML;
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('حدث خطأ في تحميل تفاصيل الطلب', 'error');
    }
}

// مشاركة الطلب
async function shareOrder(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            showNotification('الطلب غير موجود', 'error');
            return;
        }
        
        const order = orderDoc.data();
        const status = getOrderStatus(order.status);
        
        const shareData = {
            title: `طلب #${orderId.substring(0, 8)} - ${order.userName}`,
            text: `تفاصيل الطلب:\nالعميل: ${order.userName}\nالهاتف: ${order.userPhone}\nالعنوان: ${order.userAddress}\nالمجموع: ${order.total?.toFixed(2)} جنيه\nالحالة: ${status.text}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // نسخ النص
            const textToCopy = `طلب #${orderId.substring(0, 8)}\nالعميل: ${order.userName}\nالهاتف: ${order.userPhone}\nالعنوان: ${order.userAddress}\nالمجموع: ${order.total?.toFixed(2)} جنيه\nالحالة: ${status.text}`;
            
            await navigator.clipboard.writeText(textToCopy);
            showNotification('تم نسخ تفاصيل الطلب', 'success');
        }
        
    } catch (error) {
        console.error('Error sharing order:', error);
        showNotification('حدث خطأ في مشاركة الطلب', 'error');
    }
}

// الحصول على حالة الطلب
function getOrderStatus(status) {
    if (!status) return { text: 'قيد الانتظار', color: '#FF9500' };
    if (status.delivered) return { text: 'تم التوصيل', color: '#25D366' };
    if (status.on_way) return { text: 'في الطريق', color: '#6B5BFF' };
    if (status.preparing) return { text: 'قيد التحضير', color: '#9c27b0' };
    if (status.confirmed) return { text: 'تم التأكيد', color: '#673ab7' };
    if (status.cancelled) return { text: 'ملغي', color: '#FF2D55' };
    return { text: 'قيد الانتظار', color: '#FF9500' };
}

// تنسيق التاريخ
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Export الدوال للاستخدام في ملفات أخرى
window.toggleFavorite = toggleFavorite;
window.openWishlist = openWishlist;
window.openNotifications = openNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.openProfile = openProfile;
window.openEditProfile = openEditProfile;
window.updateProfile = updateProfile;
window.openAddresses = openAddresses;
window.openOrders = openOrders;
window.viewOrderDetails = viewOrderDetails;
window.shareOrder = shareOrder;