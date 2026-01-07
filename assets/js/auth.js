// =============== نظام المصادقة ===============

// فتح نموذج تسجيل الدخول
function openLoginModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-sign-in-alt"></i>
                        تسجيل الدخول
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">البريد الإلكتروني</label>
                        <input type="email" class="form-control" id="loginEmail" 
                               placeholder="example@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">كلمة المرور</label>
                        <input type="password" class="form-control" id="loginPassword" 
                               placeholder="********" required>
                    </div>
                    
                    <div style="text-align: left; margin-bottom: 15px;">
                        <a href="#" onclick="openForgotPasswordModal()" 
                           style="color: var(--primary-color); font-size: 0.9rem;">
                            <i class="fas fa-question-circle"></i>
                            نسيت كلمة المرور؟
                        </a>
                    </div>
                    
                    <button class="btn btn-primary btn-block mb-3" onclick="emailLogin()">
                        <i class="fas fa-sign-in-alt"></i>
                        تسجيل الدخول
                    </button>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <div style="position: relative;">
                            <div style="height: 1px; background: var(--border-color);"></div>
                            <span style="background: white; padding: 0 10px; position: absolute; 
                                   top: -10px; right: calc(50% - 20px); color: var(--text-light);">
                                أو
                            </span>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline btn-block" onclick="googleSignIn()">
                        <i class="fab fa-google"></i>
                        تسجيل الدخول بجوجل
                    </button>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="#" onclick="openRegisterModal()" 
                           style="color: var(--primary-color);">
                            ليس لديك حساب؟ إنشاء حساب جديد
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// تسجيل الدخول بالبريد الإلكتروني
async function emailLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('يرجى إدخال البريد وكلمة المرور', 'warning');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('مرحباً بعودتك!', 'success');
        closeModal();
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'خطأ في تسجيل الدخول';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'المستخدم غير موجود';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'كلمة المرور غير صحيحة';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'تم محاولة تسجيل الدخول مرات كثيرة، حاول لاحقاً';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'البريد الإلكتروني غير صالح';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// تسجيل الدخول بجوجل
async function googleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        await auth.signInWithPopup(provider);
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        closeModal();
    } catch (error) {
        console.error('Google sign in error:', error);
        
        let errorMessage = 'خطأ في تسجيل الدخول بجوجل';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'تم إغلاق نافذة التسجيل';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'تم إلغاء طلب التسجيل';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// فتح نموذج إنشاء حساب
function openRegisterModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-user-plus"></i>
                        إنشاء حساب جديد
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">الاسم الكامل</label>
                        <input type="text" class="form-control" id="registerName" 
                               placeholder="أحمد محمد" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">البريد الإلكتروني</label>
                        <input type="email" class="form-control" id="registerEmail" 
                               placeholder="example@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">كلمة المرور</label>
                        <input type="password" class="form-control" id="registerPassword" 
                               placeholder="********" minlength="6" required>
                        <small style="color: var(--text-light);">يجب أن تكون 6 أحرف على الأقل</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">تأكيد كلمة المرور</label>
                        <input type="password" class="form-control" id="registerConfirmPassword" 
                               placeholder="********" required>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="emailRegister()">
                        <i class="fas fa-user-plus"></i>
                        إنشاء حساب
                    </button>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="#" onclick="openLoginModal()" 
                           style="color: var(--primary-color);">
                            لديك حساب بالفعل؟ سجل دخول
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// إنشاء حساب جديد
async function emailRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // التحقق من البيانات
    if (!name || !email || !password || !confirmPassword) {
        showNotification('يرجى ملء جميع الحقول', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمتا المرور غير متطابقتين', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('البريد الإلكتروني غير صالح', 'warning');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // تحديث الاسم المعروض
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6B5BFF&color=fff&size=64`
        });
        
        // إنشاء مستند المستخدم في Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: 'customer',
            phone: '',
            address: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6B5BFF&color=fff&size=64`
        });
        
        showNotification('تم إنشاء الحساب بنجاح!', 'success');
        closeModal();
        
    } catch (error) {
        console.error('Register error:', error);
        
        let errorMessage = 'خطأ في إنشاء الحساب';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'بريد إلكتروني غير صالح';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'كلمة المرور ضعيفة جداً';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'خطأ في الاتصال بالشبكة';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// فتح نموذج نسيت كلمة المرور
function openForgotPasswordModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal" onclick="event.stopPropagation()">
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fas fa-key"></i>
                        نسيت كلمة المرور
                    </h2>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">أدخل بريدك الإلكتروني</label>
                        <input type="email" class="form-control" id="forgotEmail" 
                               placeholder="example@email.com" required>
                        <small style="color: var(--text-light);">
                            سنرسل رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                        </small>
                    </div>
                    
                    <button class="btn btn-primary btn-block" onclick="resetPassword()">
                        <i class="fas fa-paper-plane"></i>
                        إرسال رابط إعادة التعيين
                    </button>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="#" onclick="openLoginModal()" 
                           style="color: var(--primary-color);">
                            العودة لتسجيل الدخول
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

// إعادة تعيين كلمة المرور
async function resetPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!email) {
        showNotification('يرجى إدخال البريد الإلكتروني', 'warning');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('البريد الإلكتروني غير صالح', 'warning');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showNotification('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
        closeModal();
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'حدث خطأ في إرسال رابط إعادة التعيين';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'البريد الإلكتروني غير صالح';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'تم طلب إعادة تعيين كلمة المرور كثيراً، حاول لاحقاً';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// تسجيل الخروج
async function logoutUser() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    
    try {
        await auth.signOut();
        showNotification('تم تسجيل الخروج', 'info');
        
        // إعادة تحميل الصفحة
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// تحديث الملف الشخصي
async function updateUserProfile(updates) {
    if (!currentUser) return;
    
    try {
        // تحديث في Firebase Auth
        if (updates.name) {
            await currentUser.updateProfile({
                displayName: updates.name,
                photoURL: updates.photoURL || currentUser.photoURL
            });
        }
        
        // تحديث في Firestore
        await db.collection('users').doc(currentUser.uid).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // تحديث البيانات المحلية
        if (userData) {
            Object.assign(userData, updates);
        }
        
        showNotification('تم تحديث الملف الشخصي بنجاح', 'success');
        return true;
    } catch (error) {
        console.error('Update profile error:', error);
        showNotification('حدث خطأ في تحديث الملف الشخصي', 'error');
        return false;
    }
}

// Export الدوال للاستخدام في ملفات أخرى
window.openLoginModal = openLoginModal;
window.emailLogin = emailLogin;
window.googleSignIn = googleSignIn;
window.openRegisterModal = openRegisterModal;
window.emailRegister = emailRegister;
window.openForgotPasswordModal = openForgotPasswordModal;
window.resetPassword = resetPassword;
window.logoutUser = logoutUser;
window.updateUserProfile = updateUserProfile;