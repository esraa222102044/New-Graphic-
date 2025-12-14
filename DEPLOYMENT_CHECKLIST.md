# 📋 Deployment Checklist

Use this checklist to track your deployment progress.

## Before Deployment

- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Authentication (Email/Password)
- [ ] Enable Firestore Database
- [ ] Enable Storage
- [ ] Enable Cloud Messaging
- [ ] Upgrade to Blaze plan for Cloud Functions
- [ ] Get Firebase configuration object
- [ ] Get Web Push certificate (FCM)

## Configuration

- [ ] Update Firebase config in `/public/js/config.js`
- [ ] Update Firebase config in `/public/firebase-messaging-sw.js`
- [ ] Update WhatsApp phone number in `/public/js/config.js`
- [ ] Generate PWA icons (see `/public/assets/README.md`)
- [ ] Place generated icons in `/public/assets/` directory

## Firebase CLI Setup

- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Link project: `firebase use --add`
- [ ] Select your Firebase project

## Deploy Security Rules

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Verify rules in Firebase Console

## Deploy Cloud Functions

- [ ] Navigate to functions: `cd functions`
- [ ] Install dependencies: `npm install`
- [ ] Return to root: `cd ..`
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Verify functions in Firebase Console

## Deploy Website

- [ ] Deploy hosting: `firebase deploy --only hosting`
- [ ] Open your site: `https://YOUR_PROJECT_ID.web.app`
- [ ] Test site loads correctly
- [ ] Check browser console for errors

## Post-Deployment Setup

- [ ] Register first user account
- [ ] Make first user an admin (edit `role` in Firestore)
- [ ] Login as admin
- [ ] Add sample services in Firestore
- [ ] Add sample packages in Firestore
- [ ] Test creating a service via admin dashboard
- [ ] Test creating a package via admin dashboard

## Testing Checklist

### Authentication
- [ ] Test user registration
- [ ] Test user login
- [ ] Test logout
- [ ] Test password validation
- [ ] Test email validation

### Client Features
- [ ] Browse services
- [ ] View service details
- [ ] Create new order
- [ ] View orders in dashboard
- [ ] Upload payment receipt
- [ ] Check order status updates
- [ ] Receive notifications

### Admin Features
- [ ] View all orders
- [ ] Update order status
- [ ] View payment receipts
- [ ] View client information
- [ ] Access statistics
- [ ] Manage services
- [ ] Manage packages

### PWA Features
- [ ] Test install prompt appears
- [ ] Install app on mobile
- [ ] Install app on desktop
- [ ] Test offline functionality
- [ ] Test service worker caching
- [ ] Verify app icon displays correctly

### Notifications
- [ ] Request notification permission
- [ ] Receive order created notification
- [ ] Receive status change notification
- [ ] Receive order ready notification
- [ ] Click notification opens correct page
- [ ] Admin receives new order notification

### WhatsApp Integration
- [ ] Click WhatsApp float button
- [ ] Opens WhatsApp with default message
- [ ] Order-specific WhatsApp message works
- [ ] WhatsApp button on order details works
- [ ] Message includes order details correctly

### Mobile Responsiveness
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on tablet
- [ ] Bottom navigation displays on mobile
- [ ] All buttons are touch-friendly
- [ ] Forms work on mobile keyboard

### Performance
- [ ] Check page load time
- [ ] Verify images are optimized
- [ ] Check Lighthouse score
- [ ] Test on slow 3G connection
- [ ] Verify caching works

## Security Checklist

- [ ] Verify Firestore rules prevent unauthorized access
- [ ] Verify Storage rules prevent unauthorized uploads
- [ ] Test non-admin cannot access admin features
- [ ] Test user can only view their own orders
- [ ] Test file upload size limits work
- [ ] Verify HTTPS is enforced

## SEO & Metadata

- [ ] Update meta description in index.html
- [ ] Update manifest.json name and description
- [ ] Add favicon
- [ ] Add Open Graph tags (optional)
- [ ] Submit sitemap to Google (optional)

## Monitoring Setup

- [ ] Check Firebase Console for errors
- [ ] Monitor Cloud Functions logs
- [ ] Set up Firebase Performance Monitoring (optional)
- [ ] Set up Firebase Analytics (optional)
- [ ] Monitor Hosting usage

## Documentation

- [ ] Update README.md with your project details
- [ ] Document custom features added
- [ ] Document known issues
- [ ] Create user guide (optional)
- [ ] Create admin guide (optional)

## Launch Day

- [ ] Test everything one final time
- [ ] Announce launch
- [ ] Share website URL
- [ ] Share install instructions
- [ ] Monitor for issues
- [ ] Be ready to respond to user feedback

## Post-Launch

- [ ] Collect user feedback
- [ ] Monitor error logs
- [ ] Address critical issues immediately
- [ ] Plan feature updates
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Quick Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# Test locally
firebase serve

# View logs
firebase functions:log

# Open Firebase Console
firebase open
```

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Remember:** Keep this checklist updated as you progress through deployment!
