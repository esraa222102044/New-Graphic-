// Services Management
class ServicesManager {
    constructor() {
        this.services = [];
        this.packages = [];
    }

    async loadServices() {
        try {
            const servicesSnapshot = await db.collection(collections.services)
                .orderBy('createdAt', 'desc')
                .get();
            
            this.services = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.services;
        } catch (error) {
            console.error('Error loading services:', error);
            return [];
        }
    }

    async loadPackages(serviceId = null) {
        try {
            let query = db.collection(collections.packages);
            
            if (serviceId) {
                query = query.where('serviceId', '==', serviceId);
            }
            
            const packagesSnapshot = await query.orderBy('price', 'asc').get();
            
            this.packages = packagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return this.packages;
        } catch (error) {
            console.error('Error loading packages:', error);
            return [];
        }
    }

    async displayServices(containerId = 'servicesGrid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        utils.showLoading(container);

        const services = await this.loadServices();

        if (services.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد خدمات متاحة حالياً</div>';
            return;
        }

        container.innerHTML = services.map(service => `
            <div class="service-card" data-service-id="${service.id}">
                ${service.imageUrl ? `<img src="${utils.escapeHtml(service.imageUrl)}" alt="${utils.escapeHtml(service.name)}">` : ''}
                <h3>${utils.escapeHtml(service.name)}</h3>
                <p>${utils.escapeHtml(service.description || '')}</p>
                ${service.price ? `<div class="price">${utils.formatPrice(service.price)}</div>` : ''}
                <button class="btn btn-primary btn-block view-service-btn" data-service-id="${service.id}">
                    عرض التفاصيل
                </button>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.view-service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.serviceId;
                this.showServiceDetails(serviceId);
            });
        });
    }

    async showServiceDetails(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        // Load packages for this service
        const packages = await this.loadPackages(serviceId);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'serviceDetailsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${utils.escapeHtml(service.name)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${service.imageUrl ? `<img src="${utils.escapeHtml(service.imageUrl)}" alt="${utils.escapeHtml(service.name)}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                    <p>${utils.escapeHtml(service.description || '')}</p>
                    
                    ${packages.length > 0 ? `
                        <h3 style="margin: 2rem 0 1rem;">الباقات المتاحة</h3>
                        <div class="packages-list">
                            ${packages.map(pkg => `
                                <div class="package-item" style="background: var(--light-color); padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
                                    <h4>${utils.escapeHtml(pkg.name)}</h4>
                                    <p>${utils.escapeHtml(pkg.description || '')}</p>
                                    <div class="price" style="margin: 0.5rem 0;">${utils.formatPrice(pkg.price)}</div>
                                    <button class="btn btn-primary btn-small order-package-btn" data-package-id="${pkg.id}" data-service-id="${serviceId}">
                                        اطلب الآن
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <button class="btn btn-primary btn-block" onclick="window.location.href='/dashboard.html?action=order&serviceId=${serviceId}'">
                            اطلب هذه الخدمة
                        </button>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add click handlers for package orders
        modal.querySelectorAll('.order-package-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!authManager.isAuthenticated()) {
                    utils.showToast('يرجى تسجيل الدخول أولاً', 'error');
                    openModal('loginModal');
                    modal.remove();
                    return;
                }
                
                const packageId = btn.dataset.packageId;
                const serviceId = btn.dataset.serviceId;
                window.location.href = `/dashboard.html?action=order&serviceId=${serviceId}&packageId=${packageId}`;
            });
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getServiceById(serviceId) {
        return this.services.find(s => s.id === serviceId);
    }

    getPackageById(packageId) {
        return this.packages.find(p => p.id === packageId);
    }
}

// Initialize Services Manager
const servicesManager = new ServicesManager();

// Export for global access
window.servicesManager = servicesManager;

// Load services on page load
document.addEventListener('DOMContentLoaded', () => {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesManager.displayServices();
    }

    // View Services Button
    const viewServicesBtn = document.getElementById('viewServicesBtn');
    if (viewServicesBtn) {
        viewServicesBtn.addEventListener('click', () => {
            document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Start Order Button
    const startOrderBtn = document.getElementById('startOrderBtn');
    if (startOrderBtn) {
        startOrderBtn.addEventListener('click', () => {
            if (!authManager.isAuthenticated()) {
                utils.showToast('يرجى تسجيل الدخول أولاً', 'error');
                openModal('loginModal');
                return;
            }
            window.location.href = '/dashboard.html?action=order';
        });
    }
});

// Order Management
class OrderManager {
    async createOrder(orderData) {
        try {
            if (!authManager.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            const order = {
                userId: authManager.currentUser.uid,
                userName: authManager.currentUser.fullName,
                userEmail: authManager.currentUser.email,
                userPhone: authManager.currentUser.phone,
                status: orderStatus.PENDING,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...orderData
            };

            const docRef = await db.collection(collections.orders).add(order);
            
            utils.showToast('تم إنشاء الطلب بنجاح', 'success');
            
            return { success: true, orderId: docRef.id };
        } catch (error) {
            console.error('Error creating order:', error);
            utils.showToast('فشل إنشاء الطلب', 'error');
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            await db.collection(collections.orders).doc(orderId).update({
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('تم تحديث حالة الطلب', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error updating order status:', error);
            utils.showToast('فشل تحديث حالة الطلب', 'error');
            return { success: false, error: error.message };
        }
    }

    async uploadPaymentReceipt(orderId, file) {
        try {
            // Upload file to storage
            const storageRef = storage.ref(`receipts/${orderId}/${file.name}`);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Update order with receipt URL
            await db.collection(collections.orders).doc(orderId).update({
                paymentReceipt: downloadURL,
                paymentReceiptName: file.name,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            utils.showToast('تم رفع الإيصال بنجاح', 'success');
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Error uploading receipt:', error);
            utils.showToast('فشل رفع الإيصال', 'error');
            return { success: false, error: error.message };
        }
    }

    async getUserOrders(userId) {
        try {
            const ordersSnapshot = await db.collection(collections.orders)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            return ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting user orders:', error);
            return [];
        }
    }

    async getAllOrders() {
        try {
            const ordersSnapshot = await db.collection(collections.orders)
                .orderBy('createdAt', 'desc')
                .get();

            return ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all orders:', error);
            return [];
        }
    }
}

// Initialize Order Manager
const orderManager = new OrderManager();

// Export for global access
window.orderManager = orderManager;
