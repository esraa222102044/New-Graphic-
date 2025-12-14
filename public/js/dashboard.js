// Dashboard Management
class DashboardManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentTab = 'orders';
        this.init();
    }

    init() {
        // Wait for auth state
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadDashboard();
            } else {
                // Redirect to home if not logged in
                window.location.href = '/';
            }
        });
    }

    async loadDashboard() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        if (authManager.isAdmin()) {
            this.showAdminDashboard();
        } else {
            this.showClientDashboard();
        }
    }

    async showClientDashboard() {
        const dashboard = document.getElementById('clientDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }

        await this.loadClientOrders();
        this.setupClientEventHandlers();
    }

    async showAdminDashboard() {
        const dashboard = document.getElementById('adminDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
        }

        await this.loadAdminData();
        this.setupAdminEventHandlers();
    }

    async loadClientOrders() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        const orders = await orderManager.getUserOrders(user.uid);
        
        // Update stats
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('pendingOrders').textContent = 
            orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
        document.getElementById('completedOrders').textContent = 
            orders.filter(o => o.status === 'delivered').length;

        this.displayOrders(orders, 'ordersList');
    }

    async loadAdminData() {
        const orders = await orderManager.getAllOrders();
        const services = await servicesManager.loadServices();
        
        // Get unique clients
        const clientIds = new Set(orders.map(o => o.userId));
        
        // Calculate revenue
        const revenue = orders
            .filter(o => o.status === 'delivered' && o.totalPrice)
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        // Update stats
        document.getElementById('adminTotalOrders').textContent = orders.length;
        document.getElementById('totalClients').textContent = clientIds.size;
        document.getElementById('totalRevenue').textContent = utils.formatPrice(revenue);
        document.getElementById('totalServices').textContent = services.length;

        this.displayOrders(orders, 'adminOrdersList');
    }

    displayOrders(orders, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Filter orders
        let filteredOrders = orders;
        if (this.currentFilter !== 'all') {
            filteredOrders = orders.filter(o => o.status === this.currentFilter);
        }

        if (filteredOrders.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد طلبات</div>';
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');

        // Add event handlers
        container.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', () => {
                const orderId = card.dataset.orderId;
                this.showOrderDetails(orderId);
            });
        });
    }

    createOrderCard(order) {
        const statusClass = order.status || 'pending';
        const statusLabel = orderStatusLabels[order.status] || order.status;
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-number">#${utils.escapeHtml(order.id.substr(-6))}</div>
                    <div class="order-status status-${statusClass}">${utils.escapeHtml(statusLabel)}</div>
                </div>
                <div class="order-body">
                    <h4>${utils.escapeHtml(order.serviceName || 'خدمة')}</h4>
                    ${order.packageName ? `<p>الباقة: ${utils.escapeHtml(order.packageName)}</p>` : ''}
                    ${order.description ? `<p class="order-description">${utils.escapeHtml(order.description)}</p>` : ''}
                    ${order.totalPrice ? `<p class="order-price">${utils.formatPrice(order.totalPrice)}</p>` : ''}
                </div>
                <div class="order-footer">
                    <small>${utils.formatDate(order.createdAt)}</small>
                    ${authManager.isAdmin() ? `<small>العميل: ${utils.escapeHtml(order.userName || order.userEmail)}</small>` : ''}
                </div>
            </div>
        `;
    }

    async showOrderDetails(orderId) {
        // Fetch order details
        const orderDoc = await db.collection(collections.orders).doc(orderId).get();
        if (!orderDoc.exists) {
            utils.showToast('الطلب غير موجود', 'error');
            return;
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };
        const statusLabel = orderStatusLabels[order.status] || order.status;
        const isAdmin = authManager.isAdmin();
        const isOwner = authManager.getCurrentUser()?.uid === order.userId;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'orderDetailsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>تفاصيل الطلب #${order.id.substr(-6)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-details">
                        <div class="detail-row">
                            <strong>الحالة:</strong>
                            <span class="order-status status-${order.status}">${statusLabel}</span>
                        </div>
                        <div class="detail-row">
                            <strong>الخدمة:</strong>
                            <span>${order.serviceName || 'غير محدد'}</span>
                        </div>
                        ${order.packageName ? `
                            <div class="detail-row">
                                <strong>الباقة:</strong>
                                <span>${order.packageName}</span>
                            </div>
                        ` : ''}
                        <div class="detail-row">
                            <strong>تاريخ الطلب:</strong>
                            <span>${utils.formatDate(order.createdAt)}</span>
                        </div>
                        ${order.totalPrice ? `
                            <div class="detail-row">
                                <strong>السعر:</strong>
                                <span>${utils.formatPrice(order.totalPrice)}</span>
                            </div>
                        ` : ''}
                        ${order.paymentMethod ? `
                            <div class="detail-row">
                                <strong>طريقة الدفع:</strong>
                                <span>${paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
                            </div>
                        ` : ''}
                        ${order.description ? `
                            <div class="detail-row">
                                <strong>الوصف:</strong>
                                <p>${order.description}</p>
                            </div>
                        ` : ''}
                        ${isAdmin && order.userName ? `
                            <div class="detail-row">
                                <strong>العميل:</strong>
                                <span>${order.userName}</span>
                            </div>
                            <div class="detail-row">
                                <strong>البريد الإلكتروني:</strong>
                                <span>${order.userEmail}</span>
                            </div>
                            <div class="detail-row">
                                <strong>الهاتف:</strong>
                                <span>${order.userPhone || 'غير متوفر'}</span>
                            </div>
                        ` : ''}
                        ${order.paymentReceipt ? `
                            <div class="detail-row">
                                <strong>إيصال الدفع:</strong>
                                <a href="${order.paymentReceipt}" target="_blank" class="btn btn-small btn-secondary">عرض الإيصال</a>
                            </div>
                        ` : ''}
                    </div>

                    <div class="order-actions" style="margin-top: 2rem;">
                        ${isAdmin ? `
                            <h4>إجراءات المشرف</h4>
                            <div class="status-buttons">
                                <button class="btn btn-small btn-primary" onclick="dashboardManager.updateOrderStatus('${order.id}', 'in_progress')">
                                    قيد التنفيذ
                                </button>
                                <button class="btn btn-small btn-success" onclick="dashboardManager.updateOrderStatus('${order.id}', 'ready')">
                                    جاهز للتسليم
                                </button>
                                <button class="btn btn-small btn-success" onclick="dashboardManager.updateOrderStatus('${order.id}', 'delivered')">
                                    تم التسليم
                                </button>
                                <button class="btn btn-small btn-danger" onclick="dashboardManager.updateOrderStatus('${order.id}', 'cancelled')">
                                    إلغاء
                                </button>
                            </div>
                        ` : isOwner && !order.paymentReceipt && order.status === 'pending' ? `
                            <button class="btn btn-primary" id="uploadReceiptBtn">
                                رفع إيصال الدفع
                            </button>
                            <input type="file" id="receiptInput" accept="image/*" style="display: none;">
                        ` : ''}
                        
                        <button class="btn btn-success" onclick="whatsappManager.openWhatsApp(null, '${order.id}')">
                            تواصل عبر واتساب
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Upload receipt handler
        const uploadBtn = modal.querySelector('#uploadReceiptBtn');
        const receiptInput = modal.querySelector('#receiptInput');
        
        if (uploadBtn && receiptInput) {
            uploadBtn.addEventListener('click', () => receiptInput.click());
            receiptInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const result = await orderManager.uploadPaymentReceipt(order.id, file);
                    if (result.success) {
                        modal.remove();
                        this.loadClientOrders();
                    }
                }
            });
        }

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async updateOrderStatus(orderId, newStatus) {
        const result = await orderManager.updateOrderStatus(orderId, newStatus);
        
        if (result.success) {
            // Close modal
            const modal = document.getElementById('orderDetailsModal');
            if (modal) modal.remove();
            
            // Reload orders
            this.loadAdminData();
        }
    }

    setupClientEventHandlers() {
        // New Order Button
        const newOrderBtn = document.getElementById('newOrderBtn');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.showNewOrderForm();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentFilter = btn.dataset.status;
                await this.loadClientOrders();
            });
        });

        // Check for action in URL
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'order') {
            this.showNewOrderForm(urlParams.get('serviceId'), urlParams.get('packageId'));
        }
    }

    setupAdminEventHandlers() {
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentFilter = btn.dataset.status;
                await this.loadAdminData();
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        const activePane = document.getElementById(`${tabName}Tab`);
        if (activePane) {
            activePane.classList.add('active');
        }

        this.currentTab = tabName;
    }

    showNewOrderForm(serviceId = null, packageId = null) {
        // Create modal with order form
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>طلب جديد</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="newOrderForm">
                        <div class="form-group">
                            <label>الخدمة *</label>
                            <select name="serviceId" id="serviceSelect" required>
                                <option value="">اختر الخدمة</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>الباقة</label>
                            <select name="packageId" id="packageSelect">
                                <option value="">اختر الباقة (اختياري)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>الوصف *</label>
                            <textarea name="description" required placeholder="اشرح تفاصيل طلبك"></textarea>
                        </div>
                        <div class="form-group">
                            <label>طريقة الدفع *</label>
                            <select name="paymentMethod" required>
                                <option value="">اختر طريقة الدفع</option>
                                <option value="visa">فيزا</option>
                                <option value="transfer">تحويل بنكي</option>
                                <option value="wallet">محفظة إلكترونية</option>
                                <option value="instapay">إنستاباي</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ملفات مرفقة</label>
                            <input type="file" name="files" multiple accept="image/*,.pdf">
                            <small>يمكنك رفع الملفات بعد إنشاء الطلب</small>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">إرسال الطلب</button>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Load services
        this.populateServiceSelect(serviceId);

        // Service change handler
        const serviceSelect = modal.querySelector('#serviceSelect');
        serviceSelect.addEventListener('change', async (e) => {
            const selectedServiceId = e.target.value;
            if (selectedServiceId) {
                await this.populatePackageSelect(selectedServiceId, packageId);
            }
        });

        // Form submit
        const form = modal.querySelector('#newOrderForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitNewOrder(form, modal);
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async populateServiceSelect(selectedId = null) {
        const services = await servicesManager.loadServices();
        const select = document.getElementById('serviceSelect');
        
        if (select) {
            select.innerHTML = '<option value="">اختر الخدمة</option>' +
                services.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name}</option>`).join('');
            
            if (selectedId) {
                select.dispatchEvent(new Event('change'));
            }
        }
    }

    async populatePackageSelect(serviceId, selectedId = null) {
        const packages = await servicesManager.loadPackages(serviceId);
        const select = document.getElementById('packageSelect');
        
        if (select) {
            select.innerHTML = '<option value="">اختر الباقة (اختياري)</option>' +
                packages.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name} - ${utils.formatPrice(p.price)}</option>`).join('');
        }
    }

    async submitNewOrder(form, modal) {
        const formData = new FormData(form);
        const serviceId = formData.get('serviceId');
        const packageId = formData.get('packageId');
        
        const service = servicesManager.getServiceById(serviceId);
        const pkg = packageId ? servicesManager.getPackageById(packageId) : null;

        const orderData = {
            serviceId,
            serviceName: service?.name || 'خدمة',
            packageId: packageId || null,
            packageName: pkg?.name || null,
            description: formData.get('description'),
            paymentMethod: formData.get('paymentMethod'),
            totalPrice: pkg?.price || service?.price || 0
        };

        const result = await orderManager.createOrder(orderData);
        
        if (result.success) {
            modal.remove();
            await this.loadClientOrders();
            
            // Show WhatsApp option
            setTimeout(() => {
                if (confirm('هل تريد التواصل معنا عبر واتساب بخصوص هذا الطلب؟')) {
                    whatsappManager.openWhatsApp(null, result.orderId);
                }
            }, 1000);
        }
    }
}

// Initialize Dashboard Manager
const dashboardManager = new DashboardManager();

// Export for global access
window.dashboardManager = dashboardManager;

// Add dashboard styles
const style = document.createElement('style');
style.textContent = `
    .dashboard-container {
        padding: 2rem 0;
        min-height: calc(100vh - 200px);
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
    }

    .dashboard-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .stat-icon {
        font-size: 3rem;
    }

    .stat-content h3 {
        font-size: 2rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }

    .stat-content p {
        color: var(--gray-color);
    }

    .orders-section {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: var(--shadow);
    }

    .orders-filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: var(--transition);
    }

    .filter-btn.active,
    .filter-btn:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .orders-list {
        display: grid;
        gap: 1rem;
    }

    .order-card {
        background: var(--light-color);
        padding: 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        transition: var(--transition);
        border-right: 4px solid transparent;
    }

    .order-card:hover {
        box-shadow: var(--shadow);
        transform: translateX(-5px);
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .order-number {
        font-weight: bold;
        color: var(--primary-color);
    }

    .order-status {
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: bold;
    }

    .status-pending {
        background: #FFF3E0;
        color: #F57C00;
    }

    .status-in_progress {
        background: #E3F2FD;
        color: #1976D2;
    }

    .status-ready {
        background: #F1F8E9;
        color: #689F38;
    }

    .status-delivered {
        background: #E8F5E9;
        color: #388E3C;
    }

    .status-cancelled {
        background: #FFEBEE;
        color: #D32F2F;
    }

    .order-body h4 {
        margin-bottom: 0.5rem;
    }

    .order-description {
        color: var(--gray-color);
        font-size: 0.9rem;
        margin: 0.5rem 0;
    }

    .order-price {
        color: var(--success-color);
        font-weight: bold;
        font-size: 1.1rem;
    }

    .order-footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--gray-color);
    }

    .admin-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
    }

    .tab-btn {
        padding: 1rem 2rem;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1rem;
        color: var(--gray-color);
        border-bottom: 3px solid transparent;
        transition: var(--transition);
    }

    .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }

    .tab-pane {
        display: none;
    }

    .tab-pane.active {
        display: block;
    }

    .order-details {
        background: var(--light-color);
        padding: 1.5rem;
        border-radius: 8px;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);
    }

    .detail-row:last-child {
        border-bottom: none;
    }

    .status-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin: 1rem 0;
    }

    .btn-danger {
        background: var(--danger-color);
        color: white;
    }

    .btn-danger:hover {
        background: #D32F2F;
    }

    .badge {
        background: var(--danger-color);
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 0.7rem;
        font-weight: bold;
        margin-right: 5px;
    }

    @media (max-width: 768px) {
        .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .header-actions {
            flex-direction: column;
        }

        .stat-card {
            flex-direction: column;
            text-align: center;
        }

        .order-footer {
            flex-direction: column;
            gap: 0.5rem;
        }

        .admin-tabs {
            overflow-x: auto;
        }

        .tab-btn {
            white-space: nowrap;
        }
    }
`;
document.head.appendChild(style);
