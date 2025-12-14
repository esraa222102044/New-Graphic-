// WhatsApp Integration
class WhatsAppManager {
    constructor() {
        this.phoneNumber = whatsappConfig.phoneNumber;
        this.init();
    }

    init() {
        // Setup WhatsApp button
        const whatsappBtn = document.getElementById('whatsappBtn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openWhatsApp();
            });
        }
    }

    openWhatsApp(message = null, orderId = null) {
        let messageText = message || whatsappConfig.defaultMessage;

        // If order ID is provided, create a custom message
        if (orderId) {
            messageText = this.createOrderMessage(orderId);
        }

        const encodedMessage = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }

    createOrderMessage(orderId) {
        const order = this.getOrderById(orderId);
        
        if (!order) {
            return `مرحبًا، هذا بخصوص طلب رقم #${orderId}`;
        }

        const userName = order.userName || authManager.currentUser?.fullName || 'عميل';
        const serviceName = order.serviceName || 'خدمة';
        const statusLabel = orderStatusLabels[order.status] || order.status;

        return `مرحبًا، هذا بخصوص طلب رقم #${orderId}
الاسم: ${userName}
الخدمة: ${serviceName}
الحالة الحالية: ${statusLabel}

أرغب في الاستفسار عن هذا الطلب.`;
    }

    createGeneralInquiry(serviceName) {
        return `مرحبًا، أرغب في الاستفسار عن خدمة ${serviceName}`;
    }

    createComplaint(orderId, issue) {
        return `مرحبًا، لدي مشكلة بخصوص طلب رقم #${orderId}

المشكلة: ${issue}

أرجو التواصل معي في أقرب وقت.`;
    }

    createFollowUp(orderId) {
        return `مرحبًا، أرغب في متابعة طلب رقم #${orderId}

متى سيكون الطلب جاهزاً؟`;
    }

    getOrderById(orderId) {
        // This would need to be implemented to fetch order from Firestore
        // For now, return null
        return null;
    }

    // Add WhatsApp button to order cards
    addWhatsAppButtonToOrder(orderElement, orderId) {
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'btn btn-success btn-small';
        whatsappBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 32 32" fill="white" style="vertical-align: middle; margin-left: 5px;">
                <path d="M16 0C7.164 0 0 7.164 0 16c0 2.827.743 5.484 2.043 7.787L0 32l8.428-2.007A15.894 15.894 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0z"/>
            </svg>
            تواصل عبر واتساب
        `;
        whatsappBtn.addEventListener('click', () => {
            this.openWhatsApp(null, orderId);
        });

        orderElement.appendChild(whatsappBtn);
    }
}

// Initialize WhatsApp Manager
const whatsappManager = new WhatsAppManager();

// Export for global access
window.whatsappManager = whatsappManager;

// Helper function to add WhatsApp quick actions to various parts of the app
document.addEventListener('DOMContentLoaded', () => {
    // Add WhatsApp contact methods to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const whatsappContactItem = document.createElement('div');
        whatsappContactItem.className = 'contact-item';
        
        const heading = document.createElement('h3');
        heading.textContent = 'واتساب';
        
        const description = document.createElement('p');
        description.textContent = 'تواصل معنا مباشرة';
        
        const button = document.createElement('button');
        button.className = 'btn btn-success';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 32 32" fill="white" style="vertical-align: middle; margin-left: 5px;">
                <path d="M16 0C7.164 0 0 7.164 0 16c0 2.827.743 5.484 2.043 7.787L0 32l8.428-2.007A15.894 15.894 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0z"/>
            </svg>
            افتح واتساب
        `;
        button.addEventListener('click', () => whatsappManager.openWhatsApp());
        
        whatsappContactItem.appendChild(heading);
        whatsappContactItem.appendChild(description);
        whatsappContactItem.appendChild(button);
        
        const contactInfo = contactSection.querySelector('.contact-info');
        if (contactInfo) {
            contactInfo.appendChild(whatsappContactItem);
        }
    }
});

// Add CSS for success button
const style = document.createElement('style');
style.textContent = `
    .btn-success {
        background: #25D366;
        color: white;
    }

    .btn-success:hover {
        background: #20BA5A;
    }
`;
document.head.appendChild(style);
