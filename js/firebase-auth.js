// Firebase Authentication Service
// This file handles all Firebase authentication operations

class FirebaseAuthService {
    constructor() {
        console.log('🔵 FirebaseAuthService constructor called');

        
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.authStateCallbacks = [];
        this.freshLoginFlag = false; // Track fresh logins for redirect
        this.checkingEmailVerification = false; // Prevent redirects during verification check

        this.init();
    }

    async init() {
        console.log('🔵 FirebaseAuthService.init() called');
        
        // Wait for Firebase services to be available
        console.log('⏳ Waiting for Firebase services...');
        await this.waitForFirebase();
        console.log('✅ Firebase wait completed');
        
        console.log('🔍 Checking Firebase Services availability...');
        console.log('window.FirebaseServices exists:', !!window.FirebaseServices);
        
        if (window.FirebaseServices) {
            console.log('window.FirebaseServices.isInitialized():', window.FirebaseServices.isInitialized());
            console.log('FirebaseServices.auth:', window.FirebaseServices.auth);
            console.log('FirebaseServices.db:', window.FirebaseServices.db);
        }
        
        if (window.FirebaseServices && window.FirebaseServices.isInitialized()) {
            this.auth = window.FirebaseServices.auth;
            this.db = window.FirebaseServices.db;
            
            console.log('🔐 Auth service assigned:', this.auth);
            console.log('🗄️ DB service assigned:', this.db);
            
            // Set up auth state listener
            console.log('👂 Setting up auth state listener...');
            this.setupAuthStateListener();
            console.log('✅ FirebaseAuthService initialized successfully');
        } else {
            console.error('❌ Firebase services not available or not initialized');
            console.error('Available services:', window.FirebaseServices);
        }
    }

    // Wait for Firebase to be loaded and initialized
    async waitForFirebase() {
        console.log('⏳ waitForFirebase() - Starting to wait for Firebase...');
        let attempts = 0;
        
        return new Promise((resolve) => {
            const checkFirebase = () => {
                attempts++;
                console.log(`🔍 waitForFirebase attempt ${attempts}`);
                console.log('  window.FirebaseServices exists:', !!window.FirebaseServices);
                
                if (window.FirebaseServices) {
                    console.log('  FirebaseServices.isInitialized():', window.FirebaseServices.isInitialized());
                }
                
                if (window.FirebaseServices && window.FirebaseServices.isInitialized()) {
                    console.log('✅ Firebase is ready! Resolving...');
                    resolve();
                } else {
                    if (attempts > 50) { // 5 second timeout
                        console.error('💥 TIMEOUT: Firebase never became available after 5 seconds');
                        resolve(); // Resolve anyway to prevent hanging
                    } else {
                        setTimeout(checkFirebase, 100);
                    }
                }
            };
            checkFirebase();
        });
    }

    // Set up Firebase auth state listener
    setupAuthStateListener() {
        if (!this.auth) return;

        this.auth.onAuthStateChanged((user) => {
            console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
            this.currentUser = user;
            
            // Notify all registered callbacks
            this.authStateCallbacks.forEach(callback => {
                try {
                    callback(user);
                } catch (error) {
                    console.error('Error in auth state callback:', error);
                }
            });
            
            // Update header state
            this.updateHeaderState(user);
            
            // Handle page-specific logic
            this.handleAuthStateChange(user);
        });
    }

    // Register callback for auth state changes
    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
        
        // If user is already loaded, call immediately
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    // Update header based on auth state
    updateHeaderState(user) {
        if (typeof window.HeaderManager !== 'undefined') {
            if (user) {
                window.HeaderManager.setLoggedIn({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    name: user.displayName || user.email.split('@')[0]
                });
            } else {
                window.HeaderManager.setLoggedOut();
            }
        }
    }

    // Handle auth state changes for page navigation
    handleAuthStateChange(user) {
        const currentPath = window.location.pathname;
        
        if (user) {
            // User is logged in
            console.log('✅ User authenticated:', user.email);
            console.log('🔍 Current path:', currentPath);
            console.log('🔍 Fresh login flag:', this.freshLoginFlag);
            console.log('🔍 Checking email verification:', this.checkingEmailVerification);
            console.log('🔍 Path includes dashboard:', currentPath.includes('dashboard'));
            
            // Don't redirect if we're in the middle of checking email verification
            if (this.checkingEmailVerification) {
                console.log('⏸️ Email verification check in progress - skipping redirect');
                return;
            }
            
            // Only redirect to dashboard on fresh logins (not for existing users browsing)
            if (this.freshLoginFlag && !currentPath.includes('dashboard')) {
                console.log('🎯 Fresh login detected - redirecting to dashboard');
                this.freshLoginFlag = false; // Reset flag
                this.redirectToDashboard();
            } else if (this.freshLoginFlag) {
                console.log('⏭️ Fresh login but already on dashboard - not redirecting');
                this.freshLoginFlag = false; // Reset flag anyway
            } else {
                console.log('📍 Existing user browsing - no redirect needed');
            }
        } else {
            // User is logged out
            console.log('❌ User not authenticated');

            console.log('🔍 Current path:', currentPath);
            

            
            // Only redirect from dashboard to landing for normal logouts
            if (currentPath.includes('dashboard')) {
                console.log('🏠 Normal logout from dashboard - redirecting to landing');
                this.redirectToLanding();
            } else {
                console.log('📍 Logout from non-dashboard page - staying put');
            }
            // For other pages (samples, pricing, affiliate), just stay there
        }
    }

    // Sign up with email and password
    async signUp(email, password, displayName, phoneNumber) {
        try {
            console.log('🔄 Creating account for:', email);
            
            // Normalize phone number for consistent storage
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            
            // Check for uniqueness before creating the account
            const uniquenessCheck = await this.checkUniqueness(email, displayName, normalizedPhone);
            if (!uniquenessCheck.isUnique) {
                console.log('❌ Uniqueness check failed:', uniquenessCheck.message);
                return { success: false, error: uniquenessCheck.message };
            }
            
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name
            if (displayName) {
                await user.updateProfile({
                    displayName: displayName
                });
            }

            // Create user document in Firestore first
            await this.createUserDocument(user, { displayName, phoneNumber: normalizedPhone });

            // Send custom verification email via SendGrid
            console.log('📧 Sending custom verification email via SendGrid...');
            try {
                const sendCustomVerificationEmail = this.functions.httpsCallable('sendCustomVerificationEmail');
                await sendCustomVerificationEmail({ displayName: displayName || email });
                console.log('✅ Custom verification email sent via SendGrid');
            } catch (emailError) {
                console.error('⚠️ Error sending verification email:', emailError);
                // Continue anyway - user can request resend later
            }

            // Sign out the user immediately after signup - they need to verify email first
            await this.auth.signOut();

            console.log('✅ Account created successfully - email verification required');
            return { 
                success: true, 
                user, 
                emailVerificationSent: true,
                message: 'Account created! Please check your email and click the verification link before logging in.'
            };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Convert username to email if needed
    async getUserEmailFromUsername(usernameOrEmail) {
        // If it already looks like an email, return as-is
        if (usernameOrEmail.includes('@')) {
            return usernameOrEmail;
        }

        // Otherwise, look up the email by username in Firestore
        if (!this.db) {
            console.error('❌ Database not available for username lookup');
            throw new Error('Database service not available');
        }

        try {
            console.log('🔍 Looking up email for username:', usernameOrEmail);
            
            const usernameQuery = await this.db.collection('users')
                .where('displayName', '==', usernameOrEmail)
                .get();

            if (usernameQuery.empty) {
                console.log('❌ Username not found:', usernameOrEmail);
                throw new Error('Username not found');
            }

            const userDoc = usernameQuery.docs[0];
            const email = userDoc.data().email;
            
            console.log('✅ Found email for username:', usernameOrEmail, '->', email);
            return email;

        } catch (error) {
            console.error('❌ Error looking up username:', error);
            throw error;
        }
    }

    // Sign in with email and password
    async signIn(usernameOrEmail, password) {
        console.log('🔵 FirebaseAuthService.signIn() called');
        console.log('📧 Username or Email:', usernameOrEmail);
        console.log('🔐 Password length:', password ? password.length : 0);
        console.log('🔍 this.auth available:', !!this.auth);
        
        if (!this.auth) {
            console.error('💥 CRITICAL: this.auth is null - Firebase Auth not initialized');
            return { success: false, error: 'Authentication service not initialized' };
        }
        
        try {
            // Convert username to email if needed
            let email;
            try {
                email = await this.getUserEmailFromUsername(usernameOrEmail);
                console.log('📧 Using email for login:', email);
            } catch (usernameError) {
                // If username lookup fails, treat the input as an invalid username/email
                console.log('❌ Username lookup failed:', usernameError.message);
                return { 
                    success: false, 
                    error: usernameOrEmail.includes('@') 
                        ? 'Invalid email address or password'
                        : 'Username not found or invalid password'
                };
            }
            // Set flags to prevent premature redirects during verification check
            this.checkingEmailVerification = true;
            this.freshLoginFlag = true; // Will be cleared if verification fails
            console.log('🚩 Set verification check flag and fresh login flag');

            console.log('🚀 Calling this.auth.signInWithEmailAndPassword...');
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('📤 User credential received:', userCredential);
            
            const user = userCredential.user;
            console.log('👤 User object:', user);
            console.log('📧 Email verified (cached):', user.emailVerified);

            // Reload user to get fresh verification status from server
            console.log('🔄 Reloading user to get fresh verification status...');
            await user.reload();
            console.log('📧 Email verified (fresh):', user.emailVerified);

            // Check if email is verified (after reload)
            if (!user.emailVerified) {
                console.log('❌ Email not verified - clearing flags and signing out');
                this.freshLoginFlag = false; // Clear since verification failed
                this.checkingEmailVerification = false; // Allow normal auth state handling
                await this.auth.signOut();
                return { 
                    success: false, 
                    error: 'Please verify your email before logging in. Check your inbox for a verification link.',
                    emailNotVerified: true
                };
            }

            // Email is verified - clear verification check flag and trigger redirect
            this.checkingEmailVerification = false;
            console.log('✅ Email verified - cleared verification check flag, fresh login flag remains for redirect');
            
            // Clean up any old emailVerified field in Firestore (Firebase Auth handles this now)
            await this.cleanupUserDocument(user);
            
            // Manually trigger redirect since auth state change was blocked
            const currentPath = window.location.pathname;
            if (this.freshLoginFlag && !currentPath.includes('dashboard')) {
                console.log('🎯 Manually triggering dashboard redirect after verification');
                this.freshLoginFlag = false; // Reset flag
                this.redirectToDashboard();
            } else if (this.freshLoginFlag) {
                console.log('⏭️ Already on dashboard - resetting fresh login flag');
                this.freshLoginFlag = false; // Reset flag anyway
            }

            console.log('✅ Sign in successful - verified user');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Sign in error caught:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Clear fresh login flag since login failed
            this.freshLoginFlag = false;
            console.log('🚩 Cleared fresh login flag due to login error');
            
            const friendlyError = this.getErrorMessage(error);
            console.log('📝 Returning friendly error:', friendlyError);
            return { success: false, error: friendlyError };
        }
    }

    // Sign out
    async signOut() {
        try {
            console.log('🔄 Signing out user');
            await this.auth.signOut();
            console.log('✅ Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Normalize phone number for consistent storage
    normalizePhoneNumber(phoneNumber) {
        // Remove all non-digit characters except the leading +
        let normalized = phoneNumber.replace(/[^\d+]/g, '');
        
        // Ensure it starts with + if it doesn't already
        if (!normalized.startsWith('+')) {
            // If it's a 10-digit US number, add +1
            if (normalized.length === 10) {
                normalized = '+1' + normalized;
            } else if (normalized.length === 11 && normalized.startsWith('1')) {
                normalized = '+' + normalized;
            } else {
                // For other formats, just add +
                normalized = '+' + normalized;
            }
        }
        
        return normalized;
    }

    // Check uniqueness of username and phone number
    async checkUniqueness(email, username, phoneNumber) {
        if (!this.db) {
            console.error('❌ Database not available for uniqueness check');
            return { isUnique: false, message: 'Database service not available' };
        }

        try {
            console.log('🔍 Checking uniqueness for:', { email, username, phoneNumber });

            // Check username uniqueness
            const usernameQuery = await this.db.collection('users')
                .where('displayName', '==', username)
                .get();

            if (!usernameQuery.empty) {
                console.log('❌ Username already exists:', username);
                return { isUnique: false, message: 'This username is already taken. Please choose a different one.' };
            }

            // Check phone number uniqueness
            const phoneQuery = await this.db.collection('users')
                .where('phoneNumber', '==', phoneNumber)
                .get();

            if (!phoneQuery.empty) {
                console.log('❌ Phone number already exists:', phoneNumber);
                return { isUnique: false, message: 'This phone number is already associated with another account.' };
            }

            console.log('✅ Username and phone number are unique');
            return { isUnique: true };

        } catch (error) {
            console.error('❌ Error checking uniqueness:', error);
            return { isUnique: false, message: 'Unable to verify account uniqueness. Please try again.' };
        }
    }

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            console.log('🔄 Sending password reset to:', email);
            await this.auth.sendPasswordResetEmail(email);
            console.log('✅ Password reset email sent');
            return { success: true };
        } catch (error) {
            console.error('❌ Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Resend email verification
    async resendEmailVerification(usernameOrEmail, password) {
        try {
            console.log('🔄 Resending email verification for:', usernameOrEmail);
            
            // Convert username to email if needed
            let email;
            try {
                email = await this.getUserEmailFromUsername(usernameOrEmail);
                console.log('📧 Using email for verification resend:', email);
            } catch (usernameError) {
                console.log('❌ Username lookup failed for verification resend:', usernameError.message);
                return { 
                    success: false, 
                    error: usernameOrEmail.includes('@') 
                        ? 'Invalid email address'
                        : 'Username not found'
                };
            }
            
            // Sign in temporarily to get user object (but don't set fresh login flag)
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (user.emailVerified) {
                await this.auth.signOut();
                return { success: false, error: 'Email is already verified. Please try logging in.' };
            }

            // Send custom verification email via SendGrid
            try {
                const displayName = user.displayName || email;
                const sendCustomVerificationEmail = this.functions.httpsCallable('sendCustomVerificationEmail');
                await sendCustomVerificationEmail({ displayName });
                console.log('✅ Custom verification email resent via SendGrid');
            } catch (emailError) {
                console.error('⚠️ Error resending verification email:', emailError);
                await this.auth.signOut();
                return { success: false, error: 'Failed to send verification email. Please try again.' };
            }

            // Sign out immediately
            await this.auth.signOut();

            return { 
                success: true, 
                message: 'Verification email sent! Please check your inbox and click the verification link.' 
            };
        } catch (error) {
            console.error('❌ Resend verification error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Create user document in Firestore
    async createUserDocument(user, additionalData = {}) {
        if (!this.db) return;

        try {
            const userRef = this.db.collection('users').doc(user.uid);
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || additionalData.displayName || '',
                phoneNumber: additionalData.phoneNumber || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                ...additionalData
            };

            await userRef.set(userData, { merge: true });
            console.log('✅ User document created/updated');
        } catch (error) {
            console.error('❌ Error creating user document:', error);
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.currentUser;
    }

    // Navigation helpers
    redirectToDashboard() {
        setTimeout(() => {
            if (typeof window.PageUtils !== 'undefined') {
                const dashboardUrl = window.PageUtils.getDeviceSpecificUrl('dashboard');
                const fullUrl = window.location.pathname.includes('/html/') 
                    ? dashboardUrl 
                    : `./html/${dashboardUrl}`;
                window.location.href = fullUrl;
            } else {
                // Fallback
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isTablet = /iPad/i.test(navigator.userAgent);
                const dashboardFile = (isMobile && !isTablet) ? 'dashboard-mobile.html' : 'dashboard-desktop.html';
                const dashboardUrl = window.location.pathname.includes('/html/') 
                    ? dashboardFile 
                    : `./html/${dashboardFile}`;
                window.location.href = dashboardUrl;
            }
        }, 1000); // Small delay for UX
    }

    redirectToLanding() {
        setTimeout(() => {
            const landingUrl = window.location.pathname.includes('/html/') 
                ? '../index.html' 
                : './index.html';
            window.location.href = landingUrl;
        }, 1000);
    }

    // Convert Firebase error to user-friendly message
    // Clean up old emailVerified field from Firestore (Firebase Auth handles this now)
    async cleanupUserDocument(user) {
        if (!this.db) return;

        try {
            const userRef = this.db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists && userDoc.data().hasOwnProperty('emailVerified')) {
                console.log('🧹 Removing old emailVerified field from Firestore');
                await userRef.update({
                    emailVerified: firebase.firestore.FieldValue.delete()
                });
                console.log('✅ Cleaned up user document');
            }
        } catch (error) {
            console.log('⚠️ Could not cleanup user document:', error.message);
        }
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/invalid-login-credentials':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
}

// Create global instance
console.log('🔵 Creating FirebaseAuthService instance...');
window.firebaseAuthService = new FirebaseAuthService();

// Export for use in other files  
window.FirebaseAuth = window.firebaseAuthService;

// Backward compatibility
window.AuthService = window.firebaseAuthService;

console.log('✅ Firebase Auth Service loaded and ready');

// Server logging
