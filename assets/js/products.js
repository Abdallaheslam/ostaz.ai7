// =============== نظام المنتجات ===============

// تحميل التصنيفات
async function loadCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        const snapshot = await db.collection('categories')
            .orderBy('order', 'asc')
            .limit(8)
            .get();
        
        if (snapshot.empty) {
            await createDefaultCategories();
            return loadCategories();
        }
        
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategories(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        container.innerHTML = '<p class="text-center text-muted">حدث خطأ في تحميل التصنيفات</p>';
    }
}

// إنشاء تصنيفات افتراضية
async function createDefaultCategories() {
    const defaultCategories = [
        { name: 'معلبات', icon: 'fas fa-archive', color: '#FF9800', order: 1 },
        { name: 'ألبان وأجبان', icon: 'fas fa-cheese', color: '#FFC107', order: 2 },
        { name: 'مشروبات', icon: 'fas fa-wine-bottle', color: '#9C27B0', order: 3 },
        { name: 'حلويات', icon: 'fas fa-cookie-bite', color: '#795548', order: 4 },
        { name: 'مخبوزات', icon: 'fas fa-bread-slice', color: '#8BC34A', order: 5 },
        { name: 'أرز ومكرونة', icon: 'fas fa-utensils', color: '#607D8B', order: 6 },
        { name: 'لحوم ودواجن', icon: 'fas fa-drumstick-bite', color: '#FF2D55', order: 7 },
        { name: 'خضروات وفواكه', icon: 'fas fa-apple-alt', color: '#25D366', order: 8 }
    ];
    
    const batch = db.batch();
    defaultCategories.forEach(cat => {
        const docRef = db.collection('categories').doc();
        batch.set(docRef, cat);
    });
    
    await batch.commit();
}

// عرض التصنيفات
function renderCategories(categoriesList) {
    const container = document.getElementById('categoriesContainer');
    
    container.innerHTML = categoriesList.map(cat => `
        <div class="category-card" onclick="filterByCategory('${cat.name}')">
            <div class="category-icon" style="color: ${cat.color || '#6B5BFF'}">
                <i class="${cat.icon || 'fas fa-tag'}"></i>
            </div>
            <div class="category-name">${cat.name}</div>
            <div class="category-count">${cat.productCount || 0} منتج</div>
        </div>
    `).join('');
}

// تحميل المنتجات
async function loadProducts() {
    try {
        // تحميل المنتجات المميزة
        const featuredSnapshot = await db.collection('products')
            .where('featured', '==', true)
            .where('stock', '>', 0)
            .limit(6)
            .get();
        
        renderProducts('featuredContainer', featuredSnapshot.docs, 'featured');
        
        // تحميل العروض
        const offersSnapshot = await db.collection('products')
            .where('discount', '>', 0)
            .where('stock', '>', 0)
            .limit(6)
            .get();
        
        renderProducts('offersContainer', offersSnapshot.docs, 'offers');
        
        // تحميل المنتجات الجديدة
        const newSnapshot = await db.collection('products')
            .where('stock', '>', 0)
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();
        
        renderProducts('newProductsContainer', newSnapshot.docs, 'new');
        
        // حفظ جميع المنتجات للمستقبل
        const allSnapshot = await db.collection('products').limit(100).get();
        globalProducts = allSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// عرض المنتجات
function renderProducts(containerId, products, type = 'default') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted" style="grid-column: 1/-1; padding: 40px;">
                <i class="fas fa-box-open fa-3x mb-3" style="color: #e0e0e0;"></i>
                <p>لا توجد منتجات</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(doc => {
        const product = doc.data();
        const productId = doc.id;
        const isFavorite = favorites.some(fav => fav.id === productId);
        const isInCart = cart.some(item => item.id === productId);
        
        let badge = '';
        if (type === 'offers' && product.discount > 0) {
            badge = `<div class="product-badge">${product.discount}% خصم</div>`;
        } else if (type === 'featured') {
            badge = `<div class="product-badge featured"><i class="fas fa-star"></i></div>`;
        } else if (type === 'new') {
            const daysAgo = Math.floor((new Date() - (product.createdAt?.toDate?.() || new Date())) / (1000 * 60 * 60 * 24));
            if (daysAgo < 7) {
                badge = `<div class="product-badge new">جديد</div>`;
            }
        }
        
        return `
            <div class="product-card" data-id="${productId}">
                ${badge}
                
                <div class="product-actions">
                    <button class="action-btn ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite('${productId}', this)"
                            title="المفضلة">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="quickView('${productId}')" title="عرض سريع">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                
                <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
                     alt="${product.name}"
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'">
                
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
                    
                    <button class="add-to-cart-btn ${isInCart ? 'btn-success' : ''}" 
                            onclick="addToCart('${productId}', this)"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="${isInCart ? 'fas fa-check' : 'fas fa-cart-plus'}"></i>
                        ${isInCart ? 'في العربة' : product.stock === 0 ? 'نفذت الكمية' : 'أضف إلى العربة'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// البحث عن منتجات
function searchProducts(searchTerm = null) {
    if (!searchTerm) {
        searchTerm = document.querySelector('.search-input').value.trim();
    }
    
    if (!searchTerm) {
        showNotification('يرجى إدخال كلمة للبحث', 'warning');
        return;
    }
    
    const results = globalProducts.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.name?.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        );
    });
    
    showSearchResults(results, searchTerm);
}

// عرض نتائج البحث
function showSearchResults(results, searchTerm) {
    const content = `
        <section class="hero-section" style="background: linear-gradient(135deg, rgba(255, 165, 0, 0.9), rgba(255, 140, 0, 0.9)), url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">🔍 نتائج البحث</h1>
                <p class="hero-subtitle">${results.length} منتج مطابق لـ "${searchTerm}"</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-search"></i>
                    نتائج البحث
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            <div class="products-grid" id="searchResultsGrid">
                ${results.length > 0 ? renderSearchResults(results) : `
                    <div class="text-center text-muted" style="grid-column: 1/-1; padding: 60px;">
                        <i class="fas fa-search fa-4x mb-3" style="color: #e0e0e0;"></i>
                        <h3 class="mb-3">لا توجد نتائج مطابقة</h3>
                        <p class="text-muted mb-4">حاول البحث بكلمات أخرى</p>
                        <button class="btn btn-primary" onclick="goHome()">
                            العودة للرئيسية
                        </button>
                    </div>
                `}
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// عرض نتائج البحث
function renderSearchResults(results) {
    return results.map(product => {
        const isFavorite = favorites.some(fav => fav.id === product.id);
        const isInCart = cart.some(item => item.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${product.discount > 0 ? `
                    <div class="product-badge">
                        ${product.discount}% خصم
                    </div>
                ` : ''}
                
                <div class="product-actions">
                    <button class="action-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${product.id}', this)">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="quickView('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                
                <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
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
                    
                    <button class="add-to-cart-btn ${isInCart ? 'btn-success' : ''}" 
                            onclick="addToCart('${product.id}', this)"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${isInCart ? 'في العربة' : product.stock === 0 ? 'نفذت الكمية' : 'أضف إلى العربة'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// العرض السريع للمنتج
function quickView(productId) {
    const product = globalProducts.find(p => p.id === productId);
    if (!product) return;
    
    const isFavorite = favorites.some(fav => fav.id === productId);
    const isInCart = cart.some(item => item.id === productId);
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()" style="max-width: 800px;">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">${product.name}</h2>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start;">
                        <div>
                            <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x300/6B5BFF/ffffff?text=صورة+المنتج'}" 
                                 alt="${product.name}"
                                 style="width: 100%; border-radius: var(--border-radius-md);"
                                 onerror="this.src='https://via.placeholder.com/300x300/6B5BFF/ffffff?text=صورة+المنتج'">
                            
                            <div style="display: flex; gap: 10px; margin-top: 20px;">
                                <button class="btn btn-primary btn-block" onclick="addToCart('${productId}'); closeModal();">
                                    <i class="fas fa-cart-plus"></i> أضف إلى العربة
                                </button>
                                <button class="btn btn-outline" onclick="toggleFavorite('${productId}')">
                                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <div>
                                    <h3 style="color: var(--primary-color); font-size: 1.8rem;">
                                        ${(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)} جنيه
                                    </h3>
                                    ${product.discount > 0 ? `
                                        <div style="color: var(--text-light); text-decoration: line-through;">
                                            ${product.price.toFixed(2)} جنيه
                                        </div>
                                    ` : ''}
                                </div>
                                ${product.discount > 0 ? `
                                    <span style="background: var(--cart-red); color: white; padding: 5px 15px; border-radius: 20px; font-weight: 600;">
                                        خصم ${product.discount}%
                                    </span>
                                ` : ''}
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <div style="color: var(--text-light); font-size: 0.9rem;">التصنيف:</div>
                                <div style="font-weight: 600;">${product.category || 'عام'}</div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <div style="color: var(--text-light); font-size: 0.9rem;">الوصف:</div>
                                <div>${product.description || 'لا يوجد وصف للمنتج'}</div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <div style="color: var(--text-light); font-size: 0.9rem;">المخزون:</div>
                                <div style="font-weight: 600; color: ${product.stock > 10 ? 'var(--whatsapp-green)' : product.stock > 0 ? 'var(--phone-orange)' : 'var(--cart-red)'}">
                                    <i class="fas fa-box"></i>
                                    ${product.stock > 10 ? 'متوفر بكثرة' : product.stock > 0 ? 'آخر الكمية' : 'نفذت الكمية'}
                                </div>
                            </div>
                            
                            <button class="btn btn-secondary btn-block" onclick="shareProduct('${productId}')">
                                <i class="fas fa-share-alt"></i> مشاركة المنتج
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// مشاركة المنتج
function shareProduct(productId) {
    const product = globalProducts.find(p => p.id === productId);
    if (!product) return;
    
    const shareData = {
        title: product.name,
        text: `اطلع على ${product.name} بسعر ${(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)} جنيه في سوبر ماركت الأستاذ`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // نسخ الرابط
        navigator.clipboard.writeText(shareData.url).then(() => {
            showNotification('تم نسخ رابط المنتج', 'success');
        });
    }
}

// عرض صفحة جميع المنتجات
function showAllProductsPage() {
    const content = `
        <section class="hero-section" style="margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">جميع المنتجات</h1>
                <p class="hero-subtitle">تصفح جميع منتجاتنا المميزة والعروض الحصرية</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-list"></i>
                    جميع المنتجات
                </h2>
                <div style="display: flex; gap: 10px;">
                    <select class="form-control" style="width: auto;" onchange="filterProducts(this.value)" id="filterSelect">
                        <option value="">جميع التصنيفات</option>
                        ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                        <option value="discount">العروض</option>
                        <option value="featured">المميزة</option>
                        <option value="new">الأحدث</option>
                    </select>
                    <select class="form-control" style="width: auto;" onchange="sortProducts(this.value)" id="sortSelect">
                        <option value="newest">الأحدث أولاً</option>
                        <option value="price_low">السعر: منخفض إلى مرتفع</option>
                        <option value="price_high">السعر: مرتفع إلى منخفض</option>
                        <option value="discount">أعلى خصم</option>
                    </select>
                </div>
            </div>
            <div class="products-grid" id="allProductsGrid">
                ${renderAllProducts(globalProducts)}
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// عرض جميع المنتجات
function renderAllProducts(products) {
    if (products.length === 0) {
        return `
            <div class="text-center text-muted" style="grid-column: 1/-1; padding: 60px;">
                <i class="fas fa-box-open fa-4x mb-3" style="color: #e0e0e0;"></i>
                <h3 class="mb-3">لا توجد منتجات</h3>
            </div>
        `;
    }
    
    return products.map(product => {
        const isFavorite = favorites.some(fav => fav.id === product.id);
        const isInCart = cart.some(item => item.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${product.discount > 0 ? `
                    <div class="product-badge">
                        ${product.discount}% خصم
                    </div>
                ` : ''}
                
                <div class="product-actions">
                    <button class="action-btn ${isFavorite ? 'active' : ''}" 
                            onclick="toggleFavorite('${product.id}', this)"
                            title="المفضلة">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="shareProduct('${product.id}')" title="مشاركة">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="action-btn" onclick="quickView('${product.id}')" title="عرض سريع">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                
                <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
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
                    
                    <button class="add-to-cart-btn ${isInCart ? 'btn-success' : ''}" 
                            onclick="addToCart('${product.id}', this)"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="${isInCart ? 'fas fa-check' : 'fas fa-cart-plus'}"></i>
                        ${isInCart ? 'في العربة' : product.stock === 0 ? 'نفذت الكمية' : 'أضف إلى العربة'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// فلترة المنتجات
function filterProducts(filterType) {
    let filteredProducts = [...globalProducts];
    
    switch(filterType) {
        case 'discount':
            filteredProducts = filteredProducts.filter(p => p.discount > 0);
            break;
        case 'featured':
            filteredProducts = filteredProducts.filter(p => p.featured);
            break;
        case 'new':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt || new Date();
                const dateB = b.createdAt || new Date();
                return dateB - dateA;
            });
            break;
        default:
            if (filterType) {
                filteredProducts = filteredProducts.filter(p => p.category === filterType);
            }
            break;
    }
    
    const currentSort = document.getElementById('sortSelect')?.value || 'newest';
    const sortedProducts = sortProductsByType(filteredProducts, currentSort);
    
    document.getElementById('allProductsGrid').innerHTML = renderAllProducts(sortedProducts);
}

// ترتيب المنتجات
function sortProducts(sortType) {
    const currentFilter = document.getElementById('filterSelect')?.value || '';
    let filteredProducts = [...globalProducts];
    
    // تطبيق الفلتر أولاً
    switch(currentFilter) {
        case 'discount':
            filteredProducts = filteredProducts.filter(p => p.discount > 0);
            break;
        case 'featured':
            filteredProducts = filteredProducts.filter(p => p.featured);
            break;
        case 'new':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt || new Date();
                const dateB = b.createdAt || new Date();
                return dateB - dateA;
            });
            break;
        default:
            if (currentFilter) {
                filteredProducts = filteredProducts.filter(p => p.category === currentFilter);
            }
            break;
    }
    
    const sortedProducts = sortProductsByType(filteredProducts, sortType);
    document.getElementById('allProductsGrid').innerHTML = renderAllProducts(sortedProducts);
}

// ترتيب المنتجات حسب النوع
function sortProductsByType(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
        case 'price_low':
            sorted.sort((a, b) => {
                const priceA = a.price * (1 - (a.discount || 0) / 100);
                const priceB = b.price * (1 - (b.discount || 0) / 100);
                return priceA - priceB;
            });
            break;
            
        case 'price_high':
            sorted.sort((a, b) => {
                const priceA = a.price * (1 - (a.discount || 0) / 100);
                const priceB = b.price * (1 - (b.discount || 0) / 100);
                return priceB - priceA;
            });
            break;
            
        case 'discount':
            sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
            break;
            
        case 'newest':
        default:
            sorted.sort((a, b) => {
                const dateA = a.createdAt || new Date();
                const dateB = b.createdAt || new Date();
                return dateB - dateA;
            });
            break;
    }
    
    return sorted;
}

// عرض صفحة العروض
function showOffersPage() {
    const offers = globalProducts.filter(p => p.discount > 0);
    
    const content = `
        <section class="hero-section" style="background: linear-gradient(135deg, rgba(255, 127, 0, 0.9), rgba(255, 107, 0, 0.9)), url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">🔥 العروض الحصرية 🔥</h1>
                <p class="hero-subtitle">خصومات تصل إلى 70% على منتجات مختارة | لفترة محدودة</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-fire"></i>
                    جميع العروض
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            <div class="products-grid" id="allOffersGrid">
                ${offers.length > 0 ? renderOffers(offers) : `
                    <div class="text-center text-muted" style="grid-column: 1/-1; padding: 60px;">
                        <i class="fas fa-percentage fa-4x mb-3" style="color: #e0e0e0;"></i>
                        <h3>لا توجد عروض حالياً</h3>
                        <p class="mb-4">يمكنك تصفح جميع منتجاتنا المميزة</p>
                        <button class="btn btn-secondary" onclick="showAllProductsPage()">
                            تصفح المنتجات
                        </button>
                    </div>
                `}
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// عرض العروض
function renderOffers(offers) {
    return offers.map(product => {
        const isFavorite = favorites.some(fav => fav.id === product.id);
        const isInCart = cart.some(item => item.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-badge">
                    ${product.discount}% خصم
                </div>
                
                <div class="product-actions">
                    <button class="action-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${product.id}', this)">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="shareProduct('${product.id}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                
                <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
                     alt="${product.name}"
                     class="product-image">
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category || 'عام'}</div>
                    
                    <div class="product-price">
                        <span class="price-current">
                            ${(product.price * (1 - product.discount / 100)).toFixed(2)} جنيه
                        </span>
                        <span class="price-old">${product.price.toFixed(2)} جنيه</span>
                    </div>
                    
                    <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 15px;">
                        وفر ${(product.price * product.discount / 100).toFixed(2)} جنيه
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

// عرض صفحة التصنيفات
function showCategoriesPage() {
    const content = `
        <section class="hero-section" style="background: linear-gradient(135deg, rgba(107, 91, 255, 0.9), rgba(124, 100, 255, 0.9)), url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">🏷️ جميع التصنيفات</h1>
                <p class="hero-subtitle">تصفح منتجاتنا من خلال التصنيفات المتنوعة</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-tags"></i>
                    تصفح حسب التصنيف
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            <div class="categories-grid" id="allCategoriesGrid">
                <div class="loading" style="grid-column: 1/-1;">
                    <div class="spinner"></div>
                </div>
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    loadAllCategories();
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// تحميل جميع التصنيفات
async function loadAllCategories() {
    try {
        const snapshot = await db.collection('categories').orderBy('order', 'asc').get();
        const container = document.getElementById('allCategoriesGrid');
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center text-muted" style="grid-column: 1/-1; padding: 60px;">
                    <i class="fas fa-tags fa-4x mb-3" style="color: #e0e0e0;"></i>
                    <h3>لا توجد تصنيفات</h3>
                </div>
            `;
            return;
        }
        
        const allCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = allCategories.map(cat => `
            <div class="category-card" onclick="filterByCategory('${cat.name}')">
                <div class="category-icon" style="color: ${cat.color || '#6B5BFF'}">
                    <i class="${cat.icon || 'fas fa-tag'}"></i>
                </div>
                <div class="category-name">${cat.name}</div>
                <div class="category-count">${cat.productCount || 0} منتج</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading all categories:', error);
    }
}

// فلترة حسب التصنيف
function filterByCategory(categoryName) {
    const filteredProducts = globalProducts.filter(p => p.category === categoryName);
    
    const content = `
        <section class="hero-section" style="margin-bottom: 30px;">
            <div class="hero-content">
                <h1 class="hero-title">${categoryName}</h1>
                <p class="hero-subtitle">${filteredProducts.length} منتج في هذا التصنيف</p>
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-filter"></i>
                    ${categoryName}
                </h2>
                <div class="view-all" onclick="goHome()">
                    العودة للرئيسية
                    <i class="fas fa-arrow-left"></i>
                </div>
            </div>
            <div class="products-grid" id="categoryProductsGrid">
                ${filteredProducts.length > 0 ? renderCategoryProducts(filteredProducts) : `
                    <div class="text-center text-muted" style="grid-column: 1/-1; padding: 60px;">
                        <i class="fas fa-box-open fa-4x mb-3" style="color: #e0e0e0;"></i>
                        <h3>لا توجد منتجات في هذا التصنيف</h3>
                        <p class="mb-4">يمكنك تصفح تصنيفات أخرى</p>
                        <button class="btn btn-primary" onclick="showCategoriesPage()">
                            تصفح التصنيفات
                        </button>
                    </div>
                `}
            </div>
        </section>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth' });
}

// عرض منتجات التصنيف
function renderCategoryProducts(products) {
    return products.map(product => {
        const isFavorite = favorites.some(fav => fav.id === product.id);
        const isInCart = cart.some(item => item.id === product.id);
        
        return `
            <div class="product-card" data-id="${product.id}">
                ${product.discount > 0 ? `
                    <div class="product-badge">
                        ${product.discount}% خصم
                    </div>
                ` : ''}
                
                <div class="product-actions">
                    <button class="action-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${product.id}', this)">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="action-btn" onclick="shareProduct('${product.id}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                
                <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/300x200/6B5BFF/ffffff?text=صورة+المنتج'}" 
                     alt="${product.name}"
                     class="product-image">
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    
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

// Export الدوال للاستخدام في ملفات أخرى
window.loadCategories = loadCategories;
window.loadProducts = loadProducts;
window.searchProducts = searchProducts;
window.quickView = quickView;
window.shareProduct = shareProduct;
window.showAllProductsPage = showAllProductsPage;
window.showOffersPage = showOffersPage;
window.showCategoriesPage = showCategoriesPage;
window.filterByCategory = filterByCategory;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;