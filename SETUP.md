# 🚀 Quick Setup Guide for New Graphic Platform

## Prerequisites
- Node.js 18+ installed
- Firebase account
- Git

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "new-graphic" (or your preferred name)
4. Enable Google Analytics (optional)
5. Wait for project creation

### 2. Enable Firebase Services

#### Authentication
1. Go to "Authentication" → "Get started"
2. Enable "Email/Password" sign-in method

#### Firestore Database
1. Go to "Firestore Database" → "Create database"
2. Start in **production mode**
3. Choose your region (closest to your users)

#### Storage
1. Go to "Storage" → "Get started"
2. Start in **production mode**

#### Cloud Messaging
1. Go to "Project settings" → "Cloud Messaging"
2. Generate a new Web Push certificate
3. Note the Key Pair

#### Cloud Functions
1. Upgrade to Blaze plan (pay-as-you-go)
2. Cloud Functions will be automatically enabled

### 3. Get Firebase Configuration

1. Go to "Project settings" → "General"
2. Scroll to "Your apps"
3. Click "Web app" (</>) icon
4. Register your app (name: "New Graphic")
5. Copy the `firebaseConfig` object

### 4. Configure the Project

#### Update `/public/js/config.js`
Replace the placeholder values:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "G-XXXXXXXXXX"
};
```

#### Update `/public/firebase-messaging-sw.js`
Replace with the same config (lines 5-10)

#### Update WhatsApp Number in `/public/js/config.js`
```javascript
const whatsappConfig = {
    phoneNumber: '201234567890', // Your WhatsApp with country code
    defaultMessage: 'مرحبًا، أرغب في الاستفسار عن خدماتكم'
};
```

### 5. Initialize Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
cd /path/to/New-Graphic-
firebase use --add
# Select your Firebase project from the list
```

### 6. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 7. Setup Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Return to root
cd ..
```

### 8. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy:
- `onOrderCreated` - Sends notifications when orders are created
- `onOrderStatusChanged` - Sends notifications on status updates
- `onOrderDelivered` - Creates invoices for completed orders
- `cleanupOldNotifications` - Scheduled cleanup task
- `sendTestNotification` - HTTP endpoint for testing
- `getStatistics` - HTTP endpoint for stats

### 9. Deploy Website

```bash
firebase deploy --only hosting
```

Your site will be live at: `https://YOUR_PROJECT_ID.web.app`

### 10. Generate PWA Icons

You need to create actual PNG icons. Use one of these tools:

**Option A: Online Generator**
1. Visit https://realfavicongenerator.net/
2. Upload your logo/icon (at least 512x512)
3. Generate all sizes
4. Download and extract to `/public/assets/`

**Option B: PWA Asset Generator (CLI)**
```bash
npx pwa-asset-generator path/to/your-logo.svg public/assets/ \
  --background "#2196F3" \
  --index public/index.html \
  --manifest public/manifest.json
```

**Required sizes:**
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-192.png
- icon-384.png
- icon-512.png

### 11. Create First Admin User

1. Open your deployed website
2. Register a new account with email/password
3. Go to Firebase Console → Firestore Database
4. Find the user in `users` collection
5. Edit the document and change `role` field from `"client"` to `"admin"`
6. Refresh the website - you now have admin access!

### 12. Add Sample Services (Optional)

In Firestore, manually add to `services` collection:

```javascript
// Example service document
{
  name: "تصميم سوشيال ميديا",
  description: "تصميم منشورات احترافية لمواقع التواصل الاجتماعي",
  price: 500,
  imageUrl: "https://via.placeholder.com/400x300",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

And to `packages` collection:
```javascript
// Example package document
{
  serviceId: "SERVICE_ID_FROM_ABOVE",
  name: "الباقة الأساسية",
  description: "10 تصاميم شهرياً",
  price: 1500,
  features: ["10 تصاميم", "مراجعتين", "تسليم خلال 5 أيام"],
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

## 🧪 Testing

### Test Locally
```bash
# Serve hosting locally
firebase serve

# Visit http://localhost:5000
```

### Test Functions Locally
```bash
# Start functions emulator
cd functions
npm run serve

# Functions will run at http://localhost:5001
```

### Test Notifications
Once deployed, you can test notifications by:
1. Creating a test order
2. Updating order status from admin dashboard
3. Checking browser notifications

## 📱 Install as PWA

### Android (Chrome)
1. Open the website
2. Tap menu (⋮) → "Add to Home screen"
3. Confirm installation

### iOS (Safari)
1. Open the website in Safari
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. Confirm

### Desktop (Chrome/Edge)
1. Open the website
2. Click install icon in address bar
3. Or: Menu → "Install New Graphic"

## 🔧 Troubleshooting

### Issue: "Firebase not defined"
- Make sure Firebase config is properly set in `config.js`
- Check browser console for errors
- Verify Firebase SDK scripts are loading

### Issue: "Permission denied" in Firestore
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user is logged in
- Verify user role in Firestore

### Issue: Notifications not working
- Check browser notification permissions
- Verify FCM is enabled in Firebase Console
- Check service worker is registered (DevTools → Application → Service Workers)
- Ensure HTTPS (required for notifications)

### Issue: PWA not installing
- Verify manifest.json is accessible
- Check service worker registration
- Ensure HTTPS
- Generate actual PNG icons (not just placeholder)

## 📊 Monitoring

### Firebase Console
- **Authentication**: View registered users
- **Firestore**: Browse database content
- **Storage**: View uploaded files
- **Functions**: Check function logs and metrics
- **Hosting**: Monitor deployments and traffic

### Browser DevTools
- **Console**: Check for JavaScript errors
- **Application**: 
  - View service worker status
  - Check cache storage
  - Inspect IndexedDB
  - View manifest
- **Network**: Monitor API calls

## 🔄 Updates

To update the site after making changes:

```bash
# Update hosting
firebase deploy --only hosting

# Update functions
firebase deploy --only functions

# Update everything
firebase deploy
```

## 📝 Best Practices

1. **Always test locally first**: `firebase serve`
2. **Use environment variables**: For sensitive config
3. **Monitor Functions logs**: Catch errors early
4. **Regular backups**: Export Firestore data periodically
5. **Security rules**: Keep them restrictive
6. **Performance**: Monitor load times and optimize

## 🎉 Success!

Your New Graphic platform is now live! Users can:
- ✅ Register and login
- ✅ Browse services
- ✅ Create orders
- ✅ Upload payment receipts
- ✅ Receive real-time notifications
- ✅ Install as mobile app (PWA)
- ✅ Contact via WhatsApp
- ✅ Track order status

Admins can:
- ✅ Manage all orders
- ✅ Update order status
- ✅ View payment receipts
- ✅ See analytics
- ✅ Manage services and packages

---

Need help? Check the README.md or create an issue on GitHub.
