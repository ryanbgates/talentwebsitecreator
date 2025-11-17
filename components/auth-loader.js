// Auth Component Loader
// Include this script on any page where you want to use the auth modal system

class AuthModalLoader {
    constructor() {
        this.loaded = false;
        this.loading = false;
    }

    async loadAuthModal() {
        if (this.loaded || this.loading) return;
        this.loading = true;

        try {
            // Check if auth modal is already in DOM
            if (document.getElementById('authSection')) {
                this.loaded = true;
                return;
            }
            
            // Smart path detection for HTML
            const isSubdirectory = window.location.pathname.includes('/html/') || 
                                 window.location.pathname.includes('/pages/');
            const htmlPath = isSubdirectory ? '../components/auth-modal.html' : './components/auth-modal.html';
            
            // Load auth modal HTML
            const response = await fetch(htmlPath);
            if (!response.ok) {
                // Try alternative path as fallback
                const altPath = isSubdirectory ? './components/auth-modal.html' : '../components/auth-modal.html';
                const altResponse = await fetch(altPath);
                if (!altResponse.ok) {
                    throw new Error('Could not load auth modal HTML from either path');
                }
                const html = await altResponse.text();
                this.injectHTML(html);
            } else {
                const html = await response.text();
                this.injectHTML(html);
            }

            // Load auth modal CSS
            this.loadCSS();

            // Load auth modal JavaScript
            this.loadJS();

            this.loaded = true;
            console.log('Auth modal component loaded successfully');
        } catch (error) {
            console.error('Error loading auth modal component:', error);
        } finally {
            this.loading = false;
        }
    }

    injectHTML(html) {


        
        // Insert the auth modal HTML at the end of the body
        const div = document.createElement('div');
        div.innerHTML = html;
        const authElement = div.firstElementChild;
        document.body.appendChild(authElement);
        


    }

    loadCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="auth-modal.css"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        // Smart path detection
        const isSubdirectory = window.location.pathname.includes('/html/') || 
                             window.location.pathname.includes('/pages/');
        link.href = isSubdirectory ? '../components/auth-modal.css' : './components/auth-modal.css';
        
        document.head.appendChild(link);
    }

    loadJS() {
        // Check if JavaScript is already loaded
        if (document.querySelector('script[src*="auth-modal.js"]')) {
            return;
        }
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        
        // Smart path detection
        const isSubdirectory = window.location.pathname.includes('/html/') || 
                             window.location.pathname.includes('/pages/');
        script.src = isSubdirectory ? '../components/auth-modal.js' : './components/auth-modal.js';
        
        document.body.appendChild(script);
    }

    // Method to show auth modal (can be called from anywhere)
    showAuth() {
        if (!this.loaded) {
            this.loadAuthModal().then(() => {
                // Wait a moment for scripts to initialize
                setTimeout(() => {
                    if (typeof showAuthSection === 'function') {
                        showAuthSection();
                    }
                }, 100);
            });
        } else {
            if (typeof showAuthSection === 'function') {
                showAuthSection();
            }
        }
    }
}

// Create global instance
window.authModal = new AuthModalLoader();

// Convenience function for easy access
window.loginAccount = function() {
    window.authModal.showAuth();
};

// Auto-load if page contains auth trigger buttons
document.addEventListener('DOMContentLoaded', function() {
    const authTriggers = document.querySelectorAll(
        '[onclick*="loginAccount"], [onclick*="showAuth"], .login-btn, .auth-trigger'
    );
    if (authTriggers.length > 0) {
        console.log('Auth triggers found, preloading auth modal component');
        window.authModal.loadAuthModal();
    }
});

// Utility functions for other pages to use
window.AuthUtils = {
    // Check if user is logged in
    isLoggedIn: function() {
        if (window.FirebaseAuth && window.FirebaseAuth.isLoggedIn) {
            return window.FirebaseAuth.isLoggedIn();
        }
        return false;
    },
    
    // Get current user data
    getCurrentUser: function() {
        if (window.FirebaseAuth && window.FirebaseAuth.getCurrentUser) {
            const user = window.FirebaseAuth.getCurrentUser();
            if (user) {
                return {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    name: user.displayName || user.email.split('@')[0]
                };
            }
        }
        return null;
    },
    
    // Show specific auth form
    showLogin: function() {
        window.authModal.showAuth();
        setTimeout(() => {
            if (typeof showLogin === 'function') {
                showLogin();
            }
        }, 150);
    },
    
    showSignup: function() {
        window.authModal.showAuth();
        setTimeout(() => {
            if (typeof showCreateAccount === 'function') {
                showCreateAccount();
            }
        }, 150);
    },
    
    // Hide auth modal
    hideAuth: function() {
        if (typeof hideAuthSection === 'function') {
            hideAuthSection();
        }
    }
};