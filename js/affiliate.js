// Affiliate Program Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Affiliate DOM loaded - starting initialization');
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('affiliate', () => {
            // Custom initialization after header is set up
            initAffiliateCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initAffiliatePageFallback();
    }
});

// Custom initialization function called after header setup
function initAffiliateCustom() {
    // Wait a moment for everything to be ready, then show the page
    setTimeout(() => {
        showAffiliatePage();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initAffiliatePageFallback() {
    console.log('Affiliate Program Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('affiliate');
        }
        // Show page after a delay
        showAffiliatePage();
    }, 800);
}

// Show the page with smooth fade-in
function showAffiliatePage() {
    // Hide loading screen with fade-out effect (like landing page)
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        console.log('✨ Hiding affiliate loading screen with fade-out');
        
        // Remove loading screen completely after fade-out completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 800); // Match the CSS transition duration
    }
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        console.log('✨ Showing affiliate page content');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Function to handle "Get My Website" button click
function getMyWebsite() {
    console.log('Get My Website clicked from referral program page');
    
    // Use centralized utilities if available
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('get-my-website', 'referral-program');
        const url = window.PageUtils.getDeviceSpecificUrl('pricing');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback if PageUtils not available
        console.log('Button clicked: get-my-website');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const url = (isMobile && !isTablet) ? 'pricing-mobile.html' : 'pricing-desktop.html';
        window.location.href = url;
    }
}