// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Check if messaging is supported
let messaging = null;
if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
}

// Collections
const collections = {
    users: 'users',
    services: 'services',
    packages: 'packages',
    orders: 'orders',
    invoices: 'invoices',
    notifications: 'notifications',
    settings: 'settings'
};

// Order Status
const orderStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Order Status Labels (Arabic)
const orderStatusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    ready: 'جاهز للتسليم',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
};

// Payment Methods
const paymentMethods = {
    VISA: 'visa',
    TRANSFER: 'transfer',
    WALLET: 'wallet',
    INSTAPAY: 'instapay'
};

// Payment Method Labels (Arabic)
const paymentMethodLabels = {
    visa: 'فيزا',
    transfer: 'تحويل بنكي',
    wallet: 'محفظة إلكترونية',
    instapay: 'إنستاباي'
};

// User Roles
const userRoles = {
    CLIENT: 'client',
    ADMIN: 'admin'
};

// WhatsApp Configuration
const whatsappConfig = {
    phoneNumber: '201234567890', // Replace with actual WhatsApp number (with country code)
    defaultMessage: 'مرحبًا، أرغب في الاستفسار عن خدماتكم'
};

// Helper Functions
const utils = {
    // Format date to Arabic
    formatDate: (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Format price
    formatPrice: (price) => {
        return `${price} جنيه`;
    },
    
    // Show toast notification
    showToast: (message, type = 'info') => {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Show loading
    showLoading: (container) => {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.innerHTML = '<div class="loading">جاري التحميل...</div>';
        }
    },
    
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Validate email
    isValidEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // Validate phone
    isValidPhone: (phone) => {
        return /^[0-9]{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
};

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;
window.storage = storage;
window.messaging = messaging;
window.collections = collections;
window.orderStatus = orderStatus;
window.orderStatusLabels = orderStatusLabels;
window.paymentMethods = paymentMethods;
window.paymentMethodLabels = paymentMethodLabels;
window.userRoles = userRoles;
window.whatsappConfig = whatsappConfig;
window.utils = utils;
