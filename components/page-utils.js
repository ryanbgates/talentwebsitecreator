// Shared Page Utilities
// Common functions used across all pages to eliminate duplication

class PageUtils {
    /**
     * Initialize header for any non-landing page
     * @param {string} pageType - The type of page (samples, pricing, affiliate, dashboard, etc.)
     */
    static initPageHeader(pageType) {
        console.log(`${pageType} page initialized`);
        
        // Use HeaderUtils from header-loader if available, otherwise fallback to direct HeaderManager
        if (typeof window.HeaderUtils !== 'undefined' && window.HeaderUtils.setPageType) {
            console.log('Using HeaderUtils.setPageType for header transformation');
            window.HeaderUtils.setPageType(pageType);
        } else {
            // Fallback to direct HeaderManager with retry logic
            this.transformHeaderWithRetry(pageType, 0);
        }
    }

    /**
     * Initialize header for non-landing pages without animation
     * @param {string} pageType - The type of page
     */
    static initPageHeaderNoAnimation(pageType) {
        console.log(`${pageType} page initialized (no animation)`);
        
        // Use HeaderUtils from header-loader if available, otherwise fallback to direct HeaderManager
        if (typeof window.HeaderUtils !== 'undefined' && window.HeaderUtils.setPageType) {
            console.log('Using HeaderUtils.setPageType for header transformation (no animation)');
            window.HeaderUtils.setPageType(pageType);
        } else {
            // Fallback to direct HeaderManager with retry logic
            this.transformHeaderWithRetryNoAnimation(pageType, 0);
        }
    }

    /**
     * Transform header with retry logic for reliability
     * @param {string} pageType - The type of page
     * @param {number} attempt - Current attempt number
     */
    static transformHeaderWithRetry(pageType, attempt = 0) {
        const maxAttempts = 5;
        const baseDelay = 200;
        
        setTimeout(() => {
            if (window.HeaderManager && window.HeaderManager.transformHeader) {
                console.log(`Transforming header for ${pageType} page...`);
                window.HeaderManager.transformHeader(pageType);
            } else if (attempt < maxAttempts) {
                console.log(`HeaderManager not ready, retrying... (${attempt + 1}/${maxAttempts})`);
                this.transformHeaderWithRetry(pageType, attempt + 1);
            } else {
                console.warn(`Failed to initialize header after ${maxAttempts} attempts`);
            }
        }, baseDelay * (attempt + 1)); // Increasing delay with each retry
    }

    /**
     * Transform header with retry logic without animation
     * @param {string} pageType - The type of page
     * @param {number} attempt - Current attempt number
     */
    static transformHeaderWithRetryNoAnimation(pageType, attempt = 0) {
        const maxAttempts = 5;
        const baseDelay = 50; // Shorter delay since no animation needed
        
        setTimeout(() => {
            if (window.HeaderManager && window.HeaderManager.transformHeader) {
                console.log(`Transforming header for ${pageType} page (no animation)...`);
                window.HeaderManager.transformHeader(pageType);
            } else if (attempt < maxAttempts) {
                console.log(`HeaderManager not ready, retrying... (${attempt + 1}/${maxAttempts})`);
                this.transformHeaderWithRetryNoAnimation(pageType, attempt + 1);
            } else {
                console.warn(`Failed to initialize header after ${maxAttempts} attempts`);
            }
        }, baseDelay * (attempt + 1)); // Increasing delay with each retry
    }

    /**
     * Standard page initialization that all pages should call
     * @param {string} pageType - The type of page
     * @param {Function} customInit - Optional custom initialization function
     */
    static initPage(pageType, customInit = null) {
        console.log(`${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page - Loaded`);
        
        // For non-landing pages, initialize header without animation
        this.initPageHeaderNoAnimation(pageType);
        
        // Run custom initialization if provided
        if (typeof customInit === 'function') {
            customInit();
        }
        
        // Set up common page functionality
        this.setupCommonPageFeatures();
    }

    /**
     * Set up features common to all pages
     */
    static setupCommonPageFeatures() {
        // Add any common functionality here (error handling, analytics, etc.)
        
        // Add transition effect to main content when loaded
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
            setTimeout(() => {
                mainWrapper.style.opacity = '1';
            }, 100);
        }
    }

    /**
     * Device detection utilities - shared across all pages
     */
    static isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTablet() {
        return /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    static isMobileDevice() {
        return this.isMobile() && !this.isTablet();
    }

    /**
     * Generate device-specific URL for navigation
     * @param {string} baseName - The base name of the page (e.g., 'samples', 'pricing')
     * @returns {string} - The device-specific URL
     */
    static getDeviceSpecificUrl(baseName) {
        return (this.isMobileDevice()) ? `${baseName}-mobile.html` : `${baseName}-desktop.html`;
    }

    /**
     * Analytics tracking function - centralized for all pages
     * @param {string} buttonType - The type of button clicked
     * @param {string} page - The page where the click occurred (optional)
     */
    static trackButtonClick(buttonType, page = 'unknown') {
        console.log(`Button clicked: ${buttonType} on ${page} page`);
        // Future implementation: Send to analytics service
        // Example: gtag('event', 'click', { event_category: 'navigation', event_label: buttonType });
    }
}

// Make PageUtils globally available
window.PageUtils = PageUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageUtils };
}