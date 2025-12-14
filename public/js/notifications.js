// Notifications Management
class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        // Setup FCM message handler
        if (messaging) {
            // Handle foreground messages
            messaging.onMessage((payload) => {
                console.log('Message received:', payload);
                this.handleNotification(payload);
            });
        }

        // Load notifications when user is authenticated
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadNotifications();
                this.listenForNewNotifications();
            }
        });
    }

    async loadNotifications() {
        if (!authManager.isAuthenticated()) return;

        try {
            const notificationsSnapshot = await db.collection(collections.notifications)
                .where('userId', '==', authManager.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            this.notifications = notificationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.updateUnreadCount();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    listenForNewNotifications() {
        if (!authManager.isAuthenticated()) return;

        db.collection(collections.notifications)
            .where('userId', '==', authManager.currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notification = {
                            id: change.doc.id,
                            ...change.doc.data()
                        };
                        
                        // Add to beginning of array if not already present
                        if (!this.notifications.find(n => n.id === notification.id)) {
                            this.notifications.unshift(notification);
                            this.updateUnreadCount();
                            this.updateNotificationBadge();
                            
                            // Show browser notification
                            this.showBrowserNotification(notification);
                        }
                    }
                });
            });
    }

    handleNotification(payload) {
        const notification = {
            title: payload.notification?.title || payload.data?.title,
            body: payload.notification?.body || payload.data?.body,
            ...payload.data
        };

        this.showBrowserNotification(notification);
    }

    showBrowserNotification(notification) {
        if (Notification.permission === 'granted') {
            const title = notification.title || 'New Graphic';
            const options = {
                body: notification.body || notification.message,
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-192.png',
                tag: notification.id || 'default',
                requireInteraction: false
            };

            const notif = new Notification(title, options);

            notif.onclick = () => {
                window.focus();
                if (notification.link) {
                    window.location.href = notification.link;
                }
                notif.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => notif.close(), 5000);
        }
    }

    async markAsRead(notificationId) {
        try {
            await db.collection(collections.notifications).doc(notificationId).update({
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.updateUnreadCount();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const batch = db.batch();
            
            this.notifications
                .filter(n => !n.read)
                .forEach(notification => {
                    const ref = db.collection(collections.notifications).doc(notification.id);
                    batch.update(ref, {
                        read: true,
                        readAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

            await batch.commit();

            this.notifications.forEach(n => n.read = true);
            this.updateUnreadCount();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        // Update bottom nav badge
        const bottomNavNotif = document.querySelector('.bottom-nav-item[href="#notifications"]');
        if (bottomNavNotif) {
            let badge = bottomNavNotif.querySelector('.badge');
            if (!badge && this.unreadCount > 0) {
                badge = document.createElement('span');
                badge.className = 'badge';
                badge.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 10px;
                    background: var(--danger-color);
                    color: white;
                    border-radius: 10px;
                    padding: 2px 6px;
                    font-size: 0.7rem;
                    font-weight: bold;
                `;
                bottomNavNotif.style.position = 'relative';
                bottomNavNotif.appendChild(badge);
            }
            
            if (badge) {
                if (this.unreadCount > 0) {
                    badge.textContent = this.unreadCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    }

    displayNotifications(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد إشعارات</div>';
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">🔔</div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message || notification.body}</p>
                    <small>${utils.formatDate(notification.createdAt)}</small>
                </div>
                ${!notification.read ? '<div class="notification-badge"></div>' : ''}
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.id;
                const notification = this.notifications.find(n => n.id === notificationId);
                
                if (notification && !notification.read) {
                    this.markAsRead(notificationId);
                }

                if (notification && notification.link) {
                    window.location.href = notification.link;
                }
            });
        });
    }

    getUnreadCount() {
        return this.unreadCount;
    }
}

// Initialize Notifications Manager
const notificationsManager = new NotificationsManager();

// Export for global access
window.notificationsManager = notificationsManager;

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: var(--transition);
        position: relative;
        border-right: 3px solid transparent;
    }

    .notification-item.unread {
        background: #E3F2FD;
        border-right-color: var(--primary-color);
    }

    .notification-item:hover {
        box-shadow: var(--shadow);
    }

    .notification-icon {
        font-size: 2rem;
    }

    .notification-content {
        flex: 1;
    }

    .notification-content h4 {
        margin-bottom: 0.5rem;
        color: var(--dark-color);
    }

    .notification-content p {
        color: var(--gray-color);
        margin-bottom: 0.5rem;
    }

    .notification-content small {
        color: var(--gray-color);
        font-size: 0.85rem;
    }

    .notification-badge {
        width: 10px;
        height: 10px;
        background: var(--primary-color);
        border-radius: 50%;
        position: absolute;
        top: 1rem;
        left: 1rem;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
