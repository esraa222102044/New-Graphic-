// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });
    }

    async handleUserLogin(user) {
        try {
            // Get user document from Firestore
            const userDoc = await db.collection(collections.users).doc(user.uid).get();
            
            if (userDoc.exists) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    ...userDoc.data()
                };
            } else {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    role: userRoles.CLIENT
                };
            }

            this.updateUI(true);
            
            // Request notification permission
            if (messaging && Notification.permission === 'default') {
                this.requestNotificationPermission();
            }
        } catch (error) {
            console.error('Error handling user login:', error);
        }
    }

    handleUserLogout() {
        this.currentUser = null;
        this.updateUI(false);
    }

    updateUI(isLoggedIn) {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userBtn = document.getElementById('userBtn');
        const userName = document.getElementById('userName');
        const bottomNav = document.getElementById('bottomNav');

        if (isLoggedIn && this.currentUser) {
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
            userBtn.style.display = 'block';
            userName.textContent = this.currentUser.fullName || this.currentUser.email;
            
            // Show bottom nav on mobile
            if (window.innerWidth <= 768 && bottomNav) {
                bottomNav.style.display = 'flex';
            }
        } else {
            loginBtn.style.display = 'block';
            registerBtn.style.display = 'block';
            userBtn.style.display = 'none';
            
            if (bottomNav) {
                bottomNav.style.display = 'none';
            }
        }
    }

    async register(email, password, fullName, phone) {
        try {
            // Create user account
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await db.collection(collections.users).doc(user.uid).set({
                fullName,
                email,
                phone,
                role: userRoles.CLIENT,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('تم إنشاء الحساب بنجاح', 'success');
            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            let message = 'فشل إنشاء الحساب';
            
            if (error.code === 'auth/email-already-in-use') {
                message = 'البريد الإلكتروني مستخدم بالفعل';
            } else if (error.code === 'auth/weak-password') {
                message = 'كلمة المرور ضعيفة جداً';
            } else if (error.code === 'auth/invalid-email') {
                message = 'البريد الإلكتروني غير صالح';
            }
            
            utils.showToast(message, 'error');
            return { success: false, error: message };
        }
    }

    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            utils.showToast('تم تسجيل الدخول بنجاح', 'success');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            let message = 'فشل تسجيل الدخول';
            
            if (error.code === 'auth/user-not-found') {
                message = 'المستخدم غير موجود';
            } else if (error.code === 'auth/wrong-password') {
                message = 'كلمة المرور غير صحيحة';
            } else if (error.code === 'auth/invalid-email') {
                message = 'البريد الإلكتروني غير صالح';
            }
            
            utils.showToast(message, 'error');
            return { success: false, error: message };
        }
    }

    async logout() {
        try {
            await auth.signOut();
            utils.showToast('تم تسجيل الخروج بنجاح', 'success');
            
            // Redirect to home
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            utils.showToast('فشل تسجيل الخروج', 'error');
        }
    }

    async requestNotificationPermission() {
        try {
            if (!messaging) return;
            
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Get FCM token
                const token = await messaging.getToken();
                
                // Save token to user document
                if (this.currentUser) {
                    await db.collection(collections.users).doc(this.currentUser.uid).update({
                        fcmToken: token,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                console.log('FCM Token:', token);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === userRoles.ADMIN;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for global access
window.authManager = authManager;

// Form Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const result = await authManager.login(email, password);
            
            if (result.success) {
                // Close modal
                closeModal('loginModal');
                loginForm.reset();
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            }
        });
    }

    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const fullName = formData.get('fullName');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const password = formData.get('password');
            
            // Validate inputs
            if (!utils.isValidEmail(email)) {
                utils.showToast('البريد الإلكتروني غير صالح', 'error');
                return;
            }
            
            if (!utils.isValidPhone(phone)) {
                utils.showToast('رقم الهاتف غير صالح', 'error');
                return;
            }
            
            const result = await authManager.register(email, password, fullName, phone);
            
            if (result.success) {
                // Close modal
                closeModal('registerModal');
                registerForm.reset();
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
            }
        });
    }

    // Login Button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('loginModal'));
    }

    // Register Button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => openModal('registerModal'));
    }

    // User Button (shows dropdown menu)
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', () => {
            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <a href="/dashboard.html">لوحة التحكم</a>
                <a href="#" id="logoutLink">تسجيل الخروج</a>
            `;
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-radius: 4px;
                padding: 0.5rem 0;
                min-width: 150px;
                z-index: 1000;
            `;
            
            // Style dropdown links
            dropdown.querySelectorAll('a').forEach(link => {
                link.style.cssText = `
                    display: block;
                    padding: 0.5rem 1rem;
                    color: var(--dark-color);
                    text-decoration: none;
                    transition: background 0.2s;
                `;
                link.addEventListener('mouseenter', () => {
                    link.style.background = 'var(--light-color)';
                });
                link.addEventListener('mouseleave', () => {
                    link.style.background = 'transparent';
                });
            });
            
            // Add logout handler
            dropdown.querySelector('#logoutLink').addEventListener('click', (e) => {
                e.preventDefault();
                authManager.logout();
                dropdown.remove();
            });
            
            // Position dropdown
            userBtn.style.position = 'relative';
            userBtn.appendChild(dropdown);
            
            // Remove dropdown when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function removeDropdown(e) {
                    if (!userBtn.contains(e.target)) {
                        dropdown.remove();
                        document.removeEventListener('click', removeDropdown);
                    }
                });
            }, 100);
        });
    }
});

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Modal close button handlers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            closeModal(modalId);
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});
