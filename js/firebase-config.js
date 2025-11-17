// Firebase Configuration and Initialization
// This file sets up Firebase services for the Talent Website Creator project

// Firebase configuration object - YOUR ACTUAL PROJECT CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBWJ6v5ASvFEkaPSTKZ2JdGfxgefc0gAoo",
    authDomain: "talentwebsitecreator-8356b.firebaseapp.com",
    projectId: "talentwebsitecreator-8356b",
    storageBucket: "talentwebsitecreator-8356b.firebasestorage.app",
    messagingSenderId: "217557398927",
    appId: "1:217557398927:web:e3a0ad1c283f66035e07fa",
    measurementId: "G-1NXM6B8TZW"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let analytics;
let functions;

console.log('🔍 Starting Firebase initialization...');

// The issue is that v9 compat loads differently. Let's handle this properly.
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔵 DOM loaded, initializing Firebase...');
    
    // Small delay to ensure all Firebase modules are loaded
    setTimeout(initFirebase, 100);
});

function initFirebase() {
    const log = console; // Simple console logging fallback
    
    if (log.firebaseInit) log.firebaseInit('Firebase object check', { 
        typeofFirebase: typeof firebase, 
        firebaseAvailable: !!firebase 
    });

    try {
        log.firebaseInit && log.firebaseInit('Initializing Firebase app', firebaseConfig);
        // Initialize Firebase app
        app = firebase.initializeApp(firebaseConfig);
        log.firebaseInit && log.firebaseInit('Firebase app initialized successfully', { appName: app.name });

        log.firebaseInit && log.firebaseInit('Initializing Firebase Auth...');
        // Initialize Firebase Authentication  
        auth = firebase.auth();
        log.firebaseInit && log.firebaseInit('Firebase Auth initialized successfully');

        log.firebaseInit && log.firebaseInit('Initializing Firestore...');
        // Initialize Firestore (for user data storage)
        db = firebase.firestore();
        log.firebaseInit && log.firebaseInit('Firestore initialized successfully');

        // Initialize Firebase Storage (optional - only if SDK is loaded)
        console.log('🔍 Checking for Firebase Storage SDK:', {
            typeofStorage: typeof firebase.storage,
            storageExists: !!firebase.storage
        });
        if (firebase.storage) {
            console.log('✅ Firebase Storage SDK detected, initializing...');
            storage = firebase.storage();
            console.log('✅ Firebase Storage initialized successfully');
        } else {
            console.log('⚠️ Firebase Storage SDK not loaded - skipping');
        }

        // Initialize Firebase Functions (optional - only if SDK is loaded)
        console.log('🔍 Checking for Firebase Functions SDK:', {
            typeofFunctions: typeof firebase.functions,
            functionsExists: !!firebase.functions
        });
        if (firebase.functions) {
            console.log('✅ Firebase Functions SDK detected, initializing...');
            functions = firebase.app().functions();  // Use firebase.app().functions() for compat SDK
            console.log('✅ Firebase Functions initialized:', !!functions);
        } else {
            console.log('⚠️ Firebase Functions SDK not loaded - skipping');
        }

        // Initialize Analytics (optional - only if SDK is loaded)
        if (firebaseConfig.measurementId && firebase.analytics) {
            try {
                analytics = firebase.analytics();
                log.firebaseInit && log.firebaseInit('Firebase Analytics initialized');
            } catch (error) {
                console.log('⚠️ Firebase Analytics SDK not loaded - skipping');
            }
        }

        // Configure Auth persistence
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                log.firebaseInit && log.firebaseInit('Firebase Auth persistence set to LOCAL');
            })
            .catch((error) => {
                log.error && log.error('Could not set auth persistence', error);
            });

        // Export services immediately after initialization
        updateFirebaseExports();
        
    } catch (error) {
        log.error && log.error('Firebase initialization failed', error);
    }
}

// Function to update exports after Firebase is initialized
function updateFirebaseExports() {

    
    // Export Firebase services for use in other files
    window.FirebaseServices = {
        app: app,
        auth: auth,
        db: db,
        storage: storage,
        analytics: analytics,
        functions: functions,
        
        // Helper function to check if Firebase is properly initialized
        isInitialized: function() {
            return !!(app && auth && db);
        },
        
        // Helper function to get current user
        getCurrentUser: function() {
            return auth ? auth.currentUser : null;
        },
        
        // Helper function to check if user is logged in
        isLoggedIn: function() {
            return !!(auth && auth.currentUser);
        }
    };

    // Global exports for backward compatibility
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;

    console.log('✅ Firebase configuration loaded. Services available via window.FirebaseServices');
}

// Global error handlers for debugging
window.addEventListener('error', function(event) {
    console.error('💥 GLOBAL ERROR CAUGHT:', event.error);
    console.error('Error message:', event.message);
    console.error('Source:', event.filename + ':' + event.lineno);
    console.error('Stack:', event.error ? event.error.stack : 'No stack trace');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('💥 UNHANDLED PROMISE REJECTION:', event.reason);
    console.error('Promise:', event.promise);
});

console.log('🛡️ Global error handlers set up');