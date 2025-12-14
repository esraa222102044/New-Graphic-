const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Order Status Labels in Arabic
const orderStatusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    ready: 'جاهز للتسليم',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
};

// ===== ORDER NOTIFICATIONS =====

// Trigger when a new order is created
exports.onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const orderId = context.params.orderId;

        try {
            // Send notification to client
            await sendNotificationToUser(
                order.userId,
                'تم إنشاء طلبك',
                `تم إنشاء طلب رقم #${orderId.substr(-6)} بنجاح. سيتم مراجعته قريباً.`,
                `/dashboard.html?orderId=${orderId}`
            );

            // Send notification to all admins
            await sendNotificationToAdmins(
                'طلب جديد',
                `طلب جديد من ${order.userName || order.userEmail}`,
                `/dashboard.html?orderId=${orderId}`
            );

            console.log('Order created notifications sent');
        } catch (error) {
            console.error('Error sending order created notifications:', error);
        }
    });

// Trigger when order status changes
exports.onOrderStatusChanged = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const orderId = context.params.orderId;

        // Check if status changed
        if (before.status !== after.status) {
            try {
                const statusLabel = orderStatusLabels[after.status] || after.status;
                
                // Send notification to client
                await sendNotificationToUser(
                    after.userId,
                    'تحديث حالة الطلب',
                    `تم تحديث حالة طلبك #${orderId.substr(-6)} إلى: ${statusLabel}`,
                    `/dashboard.html?orderId=${orderId}`
                );

                // If order is ready, send additional notification
                if (after.status === 'ready') {
                    await sendNotificationToUser(
                        after.userId,
                        'طلبك جاهز للتسليم! 🎉',
                        `طلب رقم #${orderId.substr(-6)} جاهز للتسليم`,
                        `/dashboard.html?orderId=${orderId}`
                    );
                }

                console.log('Order status change notifications sent');
            } catch (error) {
                console.error('Error sending order status change notifications:', error);
            }
        }

        // Check if payment receipt uploaded
        if (!before.paymentReceipt && after.paymentReceipt) {
            try {
                // Notify admins about payment receipt
                await sendNotificationToAdmins(
                    'إيصال دفع جديد',
                    `تم رفع إيصال دفع للطلب #${orderId.substr(-6)}`,
                    `/dashboard.html?orderId=${orderId}`
                );

                // Notify client
                await sendNotificationToUser(
                    after.userId,
                    'تم رفع الإيصال',
                    'تم رفع إيصال الدفع بنجاح. سيتم مراجعته قريباً.',
                    `/dashboard.html?orderId=${orderId}`
                );

                console.log('Payment receipt notifications sent');
            } catch (error) {
                console.error('Error sending payment receipt notifications:', error);
            }
        }
    });

// ===== HELPER FUNCTIONS =====

// Send notification to a specific user
async function sendNotificationToUser(userId, title, message, link = null) {
    try {
        // Create notification document
        const notificationData = {
            userId,
            title,
            message,
            link,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('notifications').add(notificationData);

        // Get user's FCM token
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            console.log('User not found:', userId);
            return;
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            console.log('No FCM token for user:', userId);
            return;
        }

        // Send push notification
        const payload = {
            notification: {
                title,
                body: message
            },
            data: {
                link: link || '/',
                title,
                message
            },
            token: fcmToken
        };

        await messaging.send(payload);
        console.log('Push notification sent to user:', userId);
    } catch (error) {
        console.error('Error sending notification to user:', error);
    }
}

// Send notification to all admins
async function sendNotificationToAdmins(title, message, link = null) {
    try {
        // Get all admin users
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();

        if (adminsSnapshot.empty) {
            console.log('No admin users found');
            return;
        }

        // Send notification to each admin
        const promises = adminsSnapshot.docs.map(async (doc) => {
            const adminId = doc.id;
            await sendNotificationToUser(adminId, title, message, link);
        });

        await Promise.all(promises);
        console.log('Notifications sent to all admins');
    } catch (error) {
        console.error('Error sending notifications to admins:', error);
    }
}

// ===== UTILITY FUNCTIONS =====

// Create invoice when order is delivered
exports.onOrderDelivered = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const orderId = context.params.orderId;

        // Check if order was just delivered
        if (before.status !== 'delivered' && after.status === 'delivered') {
            try {
                // Create invoice
                const invoiceData = {
                    orderId,
                    userId: after.userId,
                    userName: after.userName,
                    userEmail: after.userEmail,
                    serviceName: after.serviceName,
                    packageName: after.packageName,
                    totalPrice: after.totalPrice || 0,
                    paymentMethod: after.paymentMethod,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('invoices').add(invoiceData);

                console.log('Invoice created for order:', orderId);
            } catch (error) {
                console.error('Error creating invoice:', error);
            }
        }
    });

// Clean up old notifications (run daily)
exports.cleanupOldNotifications = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldNotifications = await db.collection('notifications')
                .where('createdAt', '<', thirtyDaysAgo)
                .get();

            if (oldNotifications.empty) {
                console.log('No old notifications to delete');
                return null;
            }

            const batch = db.batch();
            oldNotifications.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`Deleted ${oldNotifications.size} old notifications`);
        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
        }

        return null;
    });

// HTTP endpoint to send test notification
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }

    try {
        // Verify authentication header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - Missing or invalid authorization header' });
            return;
        }

        // Verify the ID token
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // Check if user is admin
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            res.status(403).json({ error: 'Forbidden - Admin access required' });
            return;
        }

        const { userId, title, message } = req.body;

        if (!userId || !title || !message) {
            res.status(400).json({ error: 'Missing required parameters: userId, title, message' });
            return;
        }

        await sendNotificationToUser(userId, title, message);

        res.json({ success: true, message: 'Test notification sent' });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// HTTP endpoint to get statistics
exports.getStatistics = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    try {
        // Get total orders
        const ordersSnapshot = await db.collection('orders').get();
        const totalOrders = ordersSnapshot.size;

        // Get total users
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        // Get total services
        const servicesSnapshot = await db.collection('services').get();
        const totalServices = servicesSnapshot.size;

        // Calculate revenue from delivered orders
        let totalRevenue = 0;
        ordersSnapshot.docs.forEach((doc) => {
            const order = doc.data();
            if (order.status === 'delivered' && order.totalPrice) {
                totalRevenue += order.totalPrice;
            }
        });

        res.json({
            totalOrders,
            totalUsers,
            totalServices,
            totalRevenue
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: error.message });
    }
});
