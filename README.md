# New Graphic Platform

منصة احترافية لإدارة وطلب خدمات الدعاية والإعلان مع دعم PWA والإشعارات

## 🎯 المميزات

### ✅ المنصة الأساسية
- **نظام المصادقة**: تسجيل الدخول والتسجيل باستخدام Firebase Authentication
- **إدارة الخدمات**: عرض وطلب خدمات الدعاية والإعلان
- **نظام الطلبات**: إنشاء وتتبع الطلبات بحالات مختلفة
- **رفع الملفات**: رفع الملفات والمستندات المرفقة بالطلبات
- **طرق الدفع المتعددة**: فيزا، تحويل بنكي، محافظ إلكترونية، إنستاباي
- **رفع إيصالات الدفع**: إمكانية رفع صور الإيصالات

### 📱 PWA (Progressive Web App)
- **تطبيق قابل للتثبيت**: يعمل كتطبيق مستقل
- **العمل دون اتصال**: إمكانية التصفح بدون إنترنت
- **Service Worker**: تحسين الأداء والتخزين المؤقت
- **تجربة موبايل محسنة**: قائمة سفلية وواجهة ملائمة للموبايل

### 🔔 الإشعارات
- **Firebase Cloud Messaging**: إشعارات فورية
- **إشعارات العملاء**:
  - تأكيد الطلب
  - تغيير حالة الطلب
  - جاهز للتسليم
  - تأكيد الدفع
- **إشعارات المشرفين**:
  - طلب جديد
  - إيصال مرفوع
  - رسائل العملاء

### 💬 تكامل واتساب
- **WhatsApp Click-to-Chat**: رابط مباشر للتواصل
- **رسائل ديناميكية**: تتضمن تفاصيل الطلب
- **زر واتساب عائم**: سهولة الوصول من أي صفحة

### 👥 الأدوار
- **العميل**: طلب الخدمات ومتابعة الطلبات
- **المشرف**: إدارة الطلبات والخدمات والعملاء

## 🚀 التثبيت والإعداد

### المتطلبات
- Node.js (v18 أو أحدث)
- حساب Firebase
- Git

### خطوات الإعداد

#### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد
3. فعّل **Authentication** (Email/Password)
4. فعّل **Firestore Database**
5. فعّل **Storage**
6. فعّل **Cloud Messaging**
7. فعّل **Cloud Functions**

#### 2. إعداد ملف الإعدادات

1. افتح ملف `/public/js/config.js`
2. استبدل قيم Firebase بقيم مشروعك:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

3. قم بتحديث رقم الواتساب:

```javascript
const whatsappConfig = {
    phoneNumber: '201234567890', // رقمك مع كود الدولة
    defaultMessage: 'مرحبًا، أرغب في الاستفسار عن خدماتكم'
};
```

#### 3. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

#### 4. ربط المشروع

```bash
firebase use --add
# اختر مشروعك من القائمة
```

#### 5. نشر القواعد

```bash
# نشر قواعد Firestore
firebase deploy --only firestore:rules

# نشر قواعد Storage
firebase deploy --only storage:rules
```

#### 6. تثبيت وظائف Cloud Functions

```bash
cd functions
npm install
cd ..
```

#### 7. نشر Cloud Functions

```bash
firebase deploy --only functions
```

#### 8. نشر الموقع

```bash
firebase deploy --only hosting
```

## 📊 هيكل قاعدة البيانات

### Collections

#### users
```javascript
{
  fullName: "string",
  email: "string",
  phone: "string",
  role: "client" | "admin",
  fcmToken: "string",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### services
```javascript
{
  name: "string",
  description: "string",
  price: number,
  imageUrl: "string",
  createdAt: timestamp
}
```

#### packages
```javascript
{
  serviceId: "string",
  name: "string",
  description: "string",
  price: number,
  features: ["string"],
  createdAt: timestamp
}
```

#### orders
```javascript
{
  userId: "string",
  userName: "string",
  userEmail: "string",
  userPhone: "string",
  serviceId: "string",
  serviceName: "string",
  packageId: "string",
  packageName: "string",
  description: "string",
  status: "pending" | "in_progress" | "ready" | "delivered" | "cancelled",
  paymentMethod: "visa" | "transfer" | "wallet" | "instapay",
  paymentReceipt: "string",
  totalPrice: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### notifications
```javascript
{
  userId: "string",
  title: "string",
  message: "string",
  link: "string",
  read: boolean,
  createdAt: timestamp
}
```

#### invoices
```javascript
{
  orderId: "string",
  userId: "string",
  userName: "string",
  userEmail: "string",
  serviceName: "string",
  packageName: "string",
  totalPrice: number,
  paymentMethod: "string",
  createdAt: timestamp
}
```

## 🎨 إضافة الأيقونات

يجب إنشاء أيقونات التطبيق في المسار `/public/assets/` بالأحجام التالية:
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

يمكن استخدام أدوات مثل [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) لإنشاء الأيقونات تلقائياً.

## 👤 إنشاء أول مشرف

بعد نشر المشروع، قم بإنشاء حساب عادي ثم:

1. اذهب إلى Firebase Console
2. افتح Firestore Database
3. ابحث عن المستخدم في collection `users`
4. عدّل حقل `role` إلى `"admin"`

## 🧪 الاختبار المحلي

### تشغيل الموقع محلياً

```bash
firebase serve
```

### تشغيل Cloud Functions محلياً

```bash
cd functions
npm run serve
```

## 📱 تثبيت التطبيق كـ PWA

### على أندرويد (Chrome)
1. افتح الموقع في Chrome
2. اضغط على القائمة (⋮)
3. اختر "إضافة إلى الشاشة الرئيسية"

### على iOS (Safari)
1. افتح الموقع في Safari
2. اضغط على زر المشاركة
3. اختر "إضافة إلى الشاشة الرئيسية"

### على سطح المكتب (Chrome/Edge)
1. افتح الموقع
2. اضغط على أيقونة التثبيت في شريط العنوان
3. أو: القائمة → تثبيت New Graphic

## 🔒 الأمان

- ✅ Firebase Authentication لتأمين المصادقة
- ✅ Firestore Security Rules لحماية البيانات
- ✅ Storage Security Rules لحماية الملفات
- ✅ التحقق من صلاحيات المستخدم
- ✅ HTTPS فقط

## 🛠️ التخصيص

### الألوان
عدّل الألوان في `/public/css/main.css`:

```css
:root {
    --primary-color: #2196F3;
    --secondary-color: #FF9800;
    /* ... */
}
```

### النصوص
النصوص بالعربية ومدمجة في الكود. يمكن تعديلها مباشرة في الملفات.

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى فتح Issue في GitHub.

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح تحت رخصة MIT.

---

**تم بناؤه بـ ❤️ باستخدام Firebase وتقنيات الويب الحديثة**