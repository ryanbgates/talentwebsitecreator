// Admin Dashboard Firebase Configuration (Separate Auth Instance)
console.log('🔧 Initializing Admin Firebase configuration...');

// Firebase configuration (same as main site)
const firebaseConfig = {
    apiKey: "AIzaSyBWJ6v5ASvFEkaPSTKZ2JdGfxgefc0gAoo",
    authDomain: "talentwebsitecreator-8356b.firebaseapp.com",
    projectId: "talentwebsitecreator-8356b",
    storageBucket: "talentwebsitecreator-8356b.firebasestorage.app",
    messagingSenderId: "217557398927",
    appId: "1:217557398927:web:e3a0ad1c283f66035e07fa",
    measurementId: "G-1NXM6B8TZW"
};

// Initialize Firebase admin app with a different name
const adminApp = firebase.initializeApp(firebaseConfig, 'adminApp');

// Create separate auth instance for admin
const adminAuth = adminApp.auth();
const adminDb = adminApp.firestore();
const adminStorage = adminApp.storage();

// Store in global namespace for admin dashboard
window.AdminFirebaseServices = {
    app: adminApp,
    auth: adminAuth,
    db: adminDb,
    storage: adminStorage,
    isInitialized: () => true
};

console.log('✅ Admin Firebase services initialized separately');
