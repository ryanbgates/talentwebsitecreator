// Header Component Loader
// Include this script on any page where you want to use the global header

class HeaderLoader {
    constructor() {
        this.loaded = false;
        this.loading = false;
    }

    async loadHeader() {
        if (this.loaded || this.loading) return;
        this.loading = true;

        try {
            // Check if header is already in DOM
            if (document.getElementById('globalHeader')) {
                this.loaded = true;
                return;
            }
            
            // Detect mobile vs desktop for HTML
            const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Smart path detection for HTML
            const isSubdirectory = window.location.pathname.includes('/html/') || 
                                 window.location.pathname.includes('/pages/');
            
            // Load appropriate HTML file
            let htmlPath;
            if (isMobile) {
                htmlPath = isSubdirectory ? '../components/header-mobile.html' : './components/header-mobile.html';
            } else {
                htmlPath = isSubdirectory ? '../components/header-desktop.html' : './components/header-desktop.html';
            }
            
            // Load header HTML
            const response = await fetch(htmlPath);
            if (!response.ok) {
                throw new Error(`Could not load header HTML from ${htmlPath}`);
            }
            const html = await response.text();
            this.injectHTML(html);

            // Load header CSS
            this.loadCSS();

            // Load header JavaScript
            this.loadJS();

            this.loaded = true;
            console.log('Header component loaded successfully');
        } catch (error) {
            console.error('Error loading header component:', error);
        } finally {
            this.loading = false;
        }
    }

    injectHTML(html) {
        // Insert the header HTML at the beginning of the body
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const headerElement = tempDiv.firstElementChild;
        
        // Check if we're on a non-landing page and pre-transform the header
        const currentPath = window.location.pathname;
        const isLandingPage = currentPath === '/' || 
                             currentPath.includes('index.html') || 
                             currentPath.includes('landing-');
        
        if (!isLandingPage && headerElement) {
            console.log('🎯 Pre-transforming header for non-landing page');
            headerElement.classList.add('transformed');
            
            // Ensure navigation is visible from the start
            const headerNav = headerElement.querySelector('#headerNav');
            if (headerNav) {
                headerNav.style.display = 'flex'; // CRITICAL: Remove display: none
                headerNav.style.opacity = '1';
                headerNav.style.transform = 'translateX(0)';
                console.log('✅ Pre-set navigation to visible state');
            }
        }
        
        // Insert at the very beginning of body
        document.body.insertBefore(headerElement, document.body.firstChild);
    }

    loadCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="header"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        
        // Detect mobile vs desktop
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Smart path detection
        const isSubdirectory = window.location.pathname.includes('/html/') || 
                             window.location.pathname.includes('/pages/');
        
        // Load appropriate CSS file
        if (isMobile) {
            link.href = isSubdirectory ? '../components/header-mobile.css' : './components/header-mobile.css';
        } else {
            link.href = isSubdirectory ? '../components/header-desktop.css' : './components/header-desktop.css';
        }
        
        document.head.appendChild(link);
    }

    loadJS() {
        // Check if JavaScript is already loaded
        if (document.querySelector('script[src*="header.js"]')) {
            return;
        }
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        
        // Smart path detection
        const isSubdirectory = window.location.pathname.includes('/html/') || 
                             window.location.pathname.includes('/pages/');
        script.src = isSubdirectory ? '../components/header.js' : './components/header.js';
        
        document.head.appendChild(script);
    }

    // Method to notify header of page type for transformations
    setPageType(pageType) {
        console.log('🎯 Setting page type:', pageType);
        
        if (this.loaded && typeof window.HeaderManager !== 'undefined' && window.HeaderManager.onPageChange) {
            console.log('✅ Calling HeaderManager.onPageChange immediately');
            window.HeaderManager.onPageChange(pageType);
        } else {
            // Store page type for when header loads
            this.pendingPageType = pageType;
            console.log('⏰ Storing page type for later, header not ready yet');
            
            // Try multiple times with increasing delays
            let attempts = 0;
            const maxAttempts = 10;
            
            const trySetPageType = () => {
                attempts++;
                console.log(`🔄 Attempt ${attempts} to set page type`);
                
                if (typeof window.HeaderManager !== 'undefined' && window.HeaderManager.onPageChange) {
                    console.log('✅ HeaderManager now available, setting page type');
                    window.HeaderManager.onPageChange(pageType);
                } else if (attempts < maxAttempts) {
                    setTimeout(trySetPageType, 200 * attempts); // Increasing delay
                } else {
                    console.log('❌ Failed to set page type after', maxAttempts, 'attempts');
                }
            };
            
            setTimeout(trySetPageType, 200);
        }
    }
}

// Create global instance
window.headerLoader = new HeaderLoader();

// Auto-load header on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auto-loading header component');
    window.headerLoader.loadHeader();
    
    // Ensure HeaderManager is available globally after loading with multiple attempts
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkHeaderManager = () => {
        attempts++;
        console.log(`🔄 Checking for HeaderManager, attempt ${attempts}`);
        
        if (typeof window.headerManager !== 'undefined' && window.headerManager) {
            console.log('✅ HeaderManager found, exposing globally');
            window.HeaderManager = window.headerManager;
        } else if (attempts < maxAttempts) {
            setTimeout(checkHeaderManager, 100 * attempts);
        } else {
            console.log('❌ HeaderManager not found after', maxAttempts, 'attempts');
        }
    };
    
    setTimeout(checkHeaderManager, 100);
});

// Utility functions for pages to use
window.HeaderUtils = {
    // Transform header for non-landing pages
    transformHeader: function() {
        console.log('🎯 HeaderUtils.transformHeader called');
        if (typeof window.HeaderManager !== 'undefined' && window.HeaderManager.transformHeader) {
            console.log('✅ Calling HeaderManager.transformHeader');
            window.HeaderManager.transformHeader();
        } else {
            console.log('❌ HeaderManager not available for transformation');
        }
    },
    
    // Reset header for landing page
    resetHeader: function() {
        if (typeof window.HeaderManager !== 'undefined' && window.HeaderManager.resetHeader) {
            window.HeaderManager.resetHeader();
        }
    },
    
    // Set page type
    setPageType: function(pageType) {
        console.log('🎯 HeaderUtils.setPageType called with:', pageType);
        window.headerLoader.setPageType(pageType);
    },
    
    // Set user login state
    setLoggedIn: function(user) {
        if (typeof window.HeaderManager !== 'undefined' && window.HeaderManager.setLoggedIn) {
            window.HeaderManager.setLoggedIn(user);
        }
    },
    
    // Set user logged out
    setLoggedOut: function() {
        if (typeof window.HeaderManager !== 'undefined' && window.HeaderManager.setLoggedOut) {
            window.HeaderManager.setLoggedOut();
        }
    }
};