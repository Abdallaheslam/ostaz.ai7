// =============== نظام السلة ===============

// إضافة منتج إلى السلة
function addToCart(productId, button = null) {
    const product = globalProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showNotification('المنتج غير متوفر حالياً', 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (product.stock && existingItem.quantity >= product.stock) {
            showNotification(`لا يمكن إضافة أكثر من ${product.stock} قطعة`, 'warning');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            discount: product.discount || 0,
            image: product.imageUrl || product.image,
            quantity: 1,
            stock: product.stock,
            category: product.category
        });
    }
    
    // تحديث الزر إذا كان موجوداً
    if (button) {
        button.classList.add('btn-success');
        button.innerHTML = '<i class="fas fa-check"></i> في العربة';
        
        // إرجاع الزر إلى حالته الأصلية بعد 2 ثانية
        setTimeout(() => {
            if (button && button.parentNode) {
                button.classList.remove('btn-success');
                button.innerHTML = '<i class="fas fa-cart-plus"></i> أضف إلى العربة';
            }
        }, 2000);
    }
    
    // حفظ العربة في التخزين المحلي
    saveCart();
    
    // تحديث العداد
    updateCartBadge();
    
    // إظهار الإشعار
    showNotification(`تمت إضافة "${product.name}" إلى العربة`, 'success');
}

// حفظ العربة في التخزين المحلي
function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

// تحديث عداد السلة
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// فتح السلة
function openCart() {
    if (cart.length === 0) {
        showEmptyCartModal();
        return;
    }
    
    showCartModal();
}

// عرض رسالة السلة الفارغة
function showEmptyCartModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-body">
                    <div class="text-center" style="padding: 40px 20px;">
                        <i class="fas fa-shopping-cart fa-4x mb-3" style="color: #e0e0e0;"></i>
                        <h3 class="mb-3">عربة التسوق فارغة</h3>
                        <p class="text-muted mb-4">لم تقم بإضافة أي منتجات إلى العربة بعد</p>
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

// عرض محتويات السلة
function showCartModal() {
    // حساب الإجماليات
    const subtotal = cart.reduce((sum, item) => {
        return sum + (item.price * (1 - item.discount / 100) * item.quantity);
    }, 0);
    
    const shipping = subtotal > 300 ? 0 : 20;
    const total = subtotal + shipping;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 800px;">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-shopping-cart"></i>
                        عربة التسوق
                        <span style="font-size: 1rem; color: var(--text-light); margin-right: 10px;">
                            (${totalItems} منتج)
                        </span>
                    </h2>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                    ${cart.map((item, index) => `
                        <div class="cart-item">
                            <img src="${item.image || 'https://via.placeholder.com/80/6B5BFF/ffffff?text=صورة'}" 
                                 alt="${item.name}"
                                 class="cart-item-image">
                            
                            <div class="cart-item-content">
                                <h3 class="cart-item-name">${item.name}</h3>
                                <div class="cart-item-price">
                                    ${(item.price * (1 - item.discount / 100)).toFixed(2)} جنيه
                                    ${item.discount > 0 ? `
                                        <span style="font-size: 0.9rem; color: var(--text-light); text-decoration: line-through; margin-right: 10px;">
                                            ${item.price.toFixed(2)} جنيه
                                        </span>
                                    ` : ''}
                                </div>
                                <div style="color: var(--text-light); font-size: 0.9rem;">
                                    ${item.category || 'عام'}
                                </div>
                            </div>
                            
                            <div class="cart-item-actions">
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="updateCartQuantity(${index}, -1)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="quantity-value">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="updateCartQuantity(${index}, 1)">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                
                                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>المجموع</span>
                        <span>${subtotal.toFixed(2)} جنيه</span>
                    </div>
                    
                    <div class="summary-row">
                        <span>الشحن</span>
                        <span>${shipping === 0 ? 'مجاني' : shipping.toFixed(2) + ' جنيه'}</span>
                    </div>
                    
                    <div class="summary-row total">
                        <span>الإجمالي النهائي</span>
                        <span>${total.toFixed(2)} جنيه</span>
                    </div>
                    
                    ${subtotal < 300 ? `
                        <div class="text-center text-muted mt-3" style="font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i>
                            أضف ${(300 - subtotal).toFixed(2)} جنيه أخرى للحصول على شحن مجاني
                        </div>
                    ` : `
                        <div class="text-center text-success mt-3" style="font-size: 0.9rem;">
                            <i class="fas fa-check-circle"></i>
                            مؤهل للشحن المجاني
                        </div>
                    `}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                        إغلاق
                    </button>
                    <button class="btn btn-primary" onclick="openCheckout()">
                        <i class="fas fa-check-circle"></i>
                        إتمام الطلب
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// تحديث كمية المنتج في السلة
function updateCartQuantity(index, change) {
    const item = cart[index];
    
    if (change === -1 && item.quantity === 1) {
        removeFromCart(index);
        return;
    }
    
    item.quantity += change;
    
    // التحقق من المخزون
    const product = globalProducts.find(p => p.id === item.id);
    if (product && product.stock && item.quantity > product.stock) {
        showNotification(`لا يمكن إضافة أكثر من ${product.stock} قطعة`, 'warning');
        item.quantity = product.stock;
    }
    
    saveCart();
    updateCartBadge();
    openCart(); // إعادة فتح السلة للتحديث
}

// إزالة منتج من السلة
function removeFromCart(index) {
    const item = cart[index];
    
    if (confirm(`هل تريد إزالة "${item.name}" من العربة؟`)) {
        cart.splice(index, 1);
        saveCart();
        updateCartBadge();
        showNotification(`تمت إزالة "${item.name}" من العربة`, 'info');
        
        if (cart.length === 0) {
            closeModal();
        } else {
            openCart();
        }
    }
}

// تفريغ السلة
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('هل تريد تفريغ العربة بالكامل؟')) {
        cart = [];
        saveCart();
        updateCartBadge();
        showNotification('تم تفريغ العربة', 'info');
        closeModal();
    }
}

// فتح نموذج الدفع
function openCheckout() {
    if (!currentUser) {
        showNotification('سجل دخول لإتمام الطلب', 'warning');
        openLoginModal();
        closeModal();
        return;
    }
    
    if (cart.length === 0) {
        showNotification('العربة فارغة', 'warning');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => {
        return sum + (item.price * (1 - item.discount / 100) * item.quantity);
    }, 0);
    
    const shipping = subtotal > 300 ? 0 : 20;
    const total = subtotal + shipping;
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 600px;">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-check-circle"></i>
                        إتمام الطلب
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">الاسم الكامل *</label>
                        <input type="text" class="form-control" id="checkoutName" 
                               value="${userData?.name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف *</label>
                        <input type="tel" class="form-control" id="checkoutPhone" 
                               value="${userData?.phone || ''}" required
                               pattern="[0-9]{10,15}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">عنوان التوصيل *</label>
                        <textarea class="form-control" id="checkoutAddress" rows="3" required>${userData?.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">طريقة الدفع</label>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <label style="flex: 1; min-width: 150px;">
                                <input type="radio" name="paymentMethod" value="cash" checked style="margin-left: 8px;">
                                <i class="fas fa-money-bill-wave"></i>
                                الدفع عند الاستلام
                            </label>
                            <label style="flex: 1; min-width: 150px;">
                                <input type="radio" name="paymentMethod" value="card" style="margin-left: 8px;">
                                <i class="fas fa-credit-card"></i>
                                بطاقة ائتمان
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">ملاحظات إضافية (اختياري)</label>
                        <textarea class="form-control" id="checkoutNotes" rows="2" 
                                  placeholder="ملاحظات خاصة بالطلب..."></textarea>
                    </div>
                    
                    <div class="cart-summary" style="margin-top: 30px;">
                        <div class="summary-row">
                            <span>المجموع</span>
                            <span>${subtotal.toFixed(2)} جنيه</span>
                        </div>
                        
                        <div class="summary-row">
                            <span>الشحن</span>
                            <span>${shipping === 0 ? 'مجاني' : shipping.toFixed(2) + ' جنيه'}</span>
                        </div>
                        
                        <div class="summary-row total">
                            <span>الإجمالي النهائي</span>
                            <span>${total.toFixed(2)} جنيه</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                        إلغاء
                    </button>
                    <button class="btn btn-primary" onclick="createOrder()">
                        <i class="fas fa-check"></i>
                        تأكيد الطلب
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// إنشاء طلب جديد
async function createOrder() {
    try {
        // جمع بيانات الطلب
        const name = document.getElementById('checkoutName').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const address = document.getElementById('checkoutAddress').value.trim();
        const notes = document.getElementById('checkoutNotes').value.trim();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // التحقق من البيانات
        if (!name || !phone || !address) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        if (!/^[0-9]{10,15}$/.test(phone)) {
            showNotification('رقم الهاتف غير صالح', 'warning');
            return;
        }
        
        // حساب الإجماليات
        const subtotal = cart.reduce((sum, item) => {
            return sum + (item.price * (1 - item.discount / 100) * item.quantity);
        }, 0);
        
        const shipping = subtotal > 300 ? 0 : 20;
        const total = subtotal + shipping;
        
        // بيانات الطلب
        const orderData = {
            userId: currentUser.uid,
            userName: name,
            userPhone: phone,
            userEmail: currentUser.email,
            userAddress: address,
            
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                discount: item.discount,
                quantity: item.quantity,
                image: item.image,
                category: item.category
            })),
            
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
            
            status: {
                pending: true,
                confirmed: false,
                preparing: false,
                on_way: false,
                delivered: false,
                cancelled: false
            },
            
            notes: notes,
            
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // إضافة الطلب إلى قاعدة البيانات
        const docRef = await db.collection('orders').add(orderData);
        
        // تحديث مخزون المنتجات
        await updateProductStock();
        
        // إرسال إشعارات
        await sendOrderNotifications(docRef.id, name, total);
        
        // مسح العربة
        clearCartAfterOrder();
        
        // إظهار رسالة النجاح
        showOrderSuccessModal(docRef.id);
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('حدث خطأ أثناء إنشاء الطلب', 'error');
    }
}

// تحديث مخزون المنتجات بعد الطلب
async function updateProductStock() {
    const batch = db.batch();
    
    for (const item of cart) {
        const productRef = db.collection('products').doc(item.id);
        const productDoc = await productRef.get();
        
        if (productDoc.exists) {
            const product = productDoc.data();
            const newStock = Math.max(0, (product.stock || 0) - item.quantity);
            batch.update(productRef, { 
                stock: newStock,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }
    
    await batch.commit();
}

// إرسال إشعارات الطلب
async function sendOrderNotifications(orderId, userName, total) {
    // إشعار للمستخدم
    await db.collection('notifications').add({
        userId: currentUser.uid,
        title: 'تم إنشاء طلبك بنجاح',
        message: `تم إنشاء طلبك برقم #${orderId.substring(0, 8)}. يمكنك تتبع حالة الطلب من صفحة طلباتي.`,
        type: 'order',
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // إشعار للمديرين
    await notifyAdminsNewOrder(orderId, userName, total);
}

// مسح العربة بعد الطلب
function clearCartAfterOrder() {
    cart = [];
    saveCart();
    updateCartBadge();
}

// إظهار رسالة نجاح الطلب
function showOrderSuccessModal(orderId) {
    const successHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-body">
                    <div class="text-center" style="padding: 40px 20px;">
                        <div style="width: 80px; height: 80px; background: var(--whatsapp-green); 
                             color: white; border-radius: 50%; display: flex; align-items: center; 
                             justify-content: center; margin: 0 auto 20px; font-size: 2rem;">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3 class="mb-3">تم إنشاء الطلب بنجاح!</h3>
                        <p class="text-muted mb-2">رقم الطلب: #${orderId.substring(0, 8)}</p>
                        <p class="text-muted mb-4">سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب</p>
                        <button class="btn btn-primary" onclick="closeModal(); openOrders();">
                            <i class="fas fa-shopping-bag"></i>
                            عرض طلباتي
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = successHTML;
}

// Export الدوال للاستخدام في ملفات أخرى
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.openCart = openCart;
window.openCheckout = openCheckout;
window.createOrder = createOrder;
window.saveCart = saveCart;
window.updateCartBadge = updateCartBadge;