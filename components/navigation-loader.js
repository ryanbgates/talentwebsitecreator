// Navigation Loading System
// Provides smooth page transitions while keeping header intact

class NavigationLoader {
    constructor() {
        this.isNavigating = false;
        this.loadingOverlay = null;
        this.init();
    }

    init() {
        this.createLoadingOverlay();
        this.setupBeforeUnloadHandler();
    }

    createLoadingOverlay() {
        // Create navigation loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'navigation-loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="navigation-header-overlay"></div>
            <div class="navigation-loading-content">
                <div class="loading-animation">
                    <div class="scroll-dots">
                        <div class="dot active"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .navigation-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                background-color: #f8f9fa;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .navigation-loading-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .navigation-header-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: var(--header-height, 84px);
                background-color: transparent;
                z-index: 1;
                pointer-events: none;
            }

            .navigation-loading-content {
                text-align: center;
                max-width: 100%;
                max-height: 100%;
                z-index: 2;
                position: relative;
            }

            .navigation-loading-overlay .loading-animation {
                margin-top: 20px;
            }

            .navigation-loading-overlay .scroll-dots {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
            }

            .navigation-loading-overlay .dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #ccc;
                animation: pulse 1.5s ease-in-out infinite;
            }

            .navigation-loading-overlay .dot.active {
                background-color: #000;
            }

            .navigation-loading-overlay .dot:nth-child(1) {
                animation-delay: 0s;
            }

            .navigation-loading-overlay .dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .navigation-loading-overlay .dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes pulse {
                0%, 20% {
                    transform: scale(1);
                    background-color: #ccc;
                }
                50% {
                    transform: scale(1.2);
                    background-color: #000;
                }
                80%, 100% {
                    transform: scale(1);
                    background-color: #ccc;
                }
            }

            /* Prevent any content overflow during navigation */
            .navigation-loading-overlay.active ~ * {
                overflow: hidden !important;
                position: relative !important;
                z-index: 1 !important;
            }

            /* Ensure loading overlay covers everything */
            .navigation-loading-overlay.active {
                z-index: 9999 !important;
            }

            /* Hide any content that might peek through */
            body.navigation-loading .main-wrapper,
            body.navigation-loading main,
            body.navigation-loading .hero-section {
                visibility: hidden !important;
            }

            /* Prevent layout shifts during content transitions */
            .main-wrapper {
                will-change: opacity, transform;
            }

            /* When content is loading, prevent it from affecting page height */
            .main-wrapper[style*="opacity: 0"] {
                position: absolute !important;
                top: var(--header-height, 84px) !important;
                left: 0 !important;
                right: 0 !important;
                transform: translateY(0) !important;
                overflow: hidden !important;
            }

            /* Ensure body doesn't expand during transitions */
            body:has(.main-wrapper[style*="opacity: 0"]) {
                overflow: hidden !important;
                height: 100vh !important;
            }

            /* Mobile webkit fix */
            @media screen and (-webkit-min-device-pixel-ratio: 0) {
                body {
                    -webkit-transform: translateZ(0);
                    transform: translateZ(0);
                }
                
                .main-wrapper {
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    -webkit-transform: translateZ(0);
                    transform: translateZ(0);
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.loadingOverlay);
    }

    setupBeforeUnloadHandler() {
        // Show loading overlay when navigating away
        window.addEventListener('beforeunload', () => {
            this.showNavigationLoading();
        });
    }

    showNavigationLoading() {
        if (this.isNavigating) return;
        this.isNavigating = true;
        
        // Add loading class to body
        document.body.classList.add('navigation-loading');
        
        // Aggressively prevent scrolling during navigation
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
        }
    }

    hideNavigationLoading() {
        this.isNavigating = false;
        
        // Remove loading class from body
        document.body.classList.remove('navigation-loading');
        
        // Re-enable scrolling and reset body styles
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.width = '';
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('active');
        }
    }

    // Smooth navigation method
    navigateTo(url, delay = 200) {
        this.showNavigationLoading();
        
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    }

    // Method to hide main content during navigation
    hideMainContent() {
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
            mainWrapper.style.opacity = '0';
            mainWrapper.style.transform = 'translateY(20px)';
            mainWrapper.style.transition = 'all 0.3s ease';
        }
    }

    // Method to show main content after navigation
    showMainContent() {
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
            // Prevent layout shift by using absolute positioning during transition
            mainWrapper.style.position = 'absolute';
            mainWrapper.style.top = 'var(--header-height, 84px)';
            mainWrapper.style.left = '0';
            mainWrapper.style.right = '0';
            mainWrapper.style.transform = 'translateY(0)';
            mainWrapper.style.opacity = '0';
            
            setTimeout(() => {
                mainWrapper.style.opacity = '1';
                
                // After animation, switch back to normal positioning
                setTimeout(() => {
                    mainWrapper.style.position = '';
                    mainWrapper.style.top = '';
                    mainWrapper.style.left = '';
                    mainWrapper.style.right = '';
                }, 300);
            }, 50);
        }
    }
}

// Global navigation instance
let navigationLoader;

// Global navigation utility (always available)
window.NavigationUtils = {
    // Smooth navigate to URL
    navigateTo: function(url, delay = 200) {
        if (navigationLoader) {
            navigationLoader.navigateTo(url, delay);
        } else {
            // Fallback for landing pages or when navigation loader isn't available
            setTimeout(() => {
                window.location.href = url;
            }, delay);
        }
    },
    
    // Show navigation loading
    showLoading: function() {
        if (navigationLoader) {
            navigationLoader.showNavigationLoading();
        }
    },
    
    // Hide navigation loading
    hideLoading: function() {
        if (navigationLoader) {
            navigationLoader.hideNavigationLoading();
        }
    }
};

// Initialize navigation loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is a landing page - skip navigation loader if it is
    const isLandingPage = document.querySelector('#loadingScreen') || 
                         window.location.pathname.includes('landing-') ||
                         window.location.pathname.endsWith('index.html') ||
                         window.location.pathname === '/' ||
                         document.body.innerHTML.includes('loading-screen');
    
    if (isLandingPage) {
        console.log('Landing page detected - skipping navigation loader');
        return;
    }
    
    // Add loading class to body initially
    document.body.classList.add('navigation-loading');
    
    // Aggressively prevent scrollbar during page load
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    navigationLoader = new NavigationLoader();
    
    // Show loading overlay immediately
    navigationLoader.showNavigationLoading();
    
    // Make navigation loader globally available
    window.NavigationLoader = navigationLoader;
    
    // Show main content smoothly with faster timing for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const showDelay = isMobile ? 50 : 100;
    
    setTimeout(() => {
        navigationLoader.showMainContent();
        
        // Wait for content animation to complete before hiding loading
        setTimeout(() => {
            navigationLoader.hideNavigationLoading();
            // Re-enable scrolling after everything is fully settled
            setTimeout(() => {
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }, 100);
        }, 400);
    }, showDelay);
    
    console.log('Navigation loader initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationLoader };
}