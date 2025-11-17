// Pricing Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Pricing DOM loaded - starting initialization');
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('pricing', () => {
            // Custom initialization after header is set up
            initPricingCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initPricingPageFallback();
    }
});

// Custom initialization function called after header setup
function initPricingCustom() {
    // Wait a moment for everything to be ready, then show the page
    setTimeout(() => {
        showPricingPage();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initPricingPageFallback() {
    console.log('Pricing Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('pricing');
        }
        // Show page after a delay
        showPricingPage();
    }, 800);
}

// Show the page with smooth fade-in
function showPricingPage() {
    // Hide loading screen with fade-out effect (like landing page)
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        console.log('✨ Hiding pricing loading screen with fade-out');
        
        // Remove loading screen completely after fade-out completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 800); // Match the CSS transition duration
    }
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        console.log('✨ Showing pricing page content');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Navigate to affiliate page when referral program is clicked
function navigateToAffiliate() {
    console.log('🔗 Navigating to affiliate page');
    
    // Check if we're on desktop or mobile version
    const isMobile = window.innerWidth <= 768;
    const affiliatePage = isMobile ? 
        '../html/affiliate-mobile.html' : 
        '../html/affiliate-desktop.html';
    
    // Navigate to the affiliate page
    window.location.href = affiliatePage;
}

// Smooth scroll to specific section
function scrollToSection(sectionId) {
    console.log('📍 Scrolling to section:', sectionId);
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Show button loading state
function showButtonLoading(button) {
    if (!button) return;
    
    // Store original text and HTML
    button.dataset.originalText = button.textContent;
    button.dataset.originalHTML = button.innerHTML;
    
    // Disable button
    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'wait';
    
    // Add loading dots
    button.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span class="btn-loader-inline">
                <span class="loader-dot"></span>
                <span class="loader-dot"></span>
                <span class="loader-dot"></span>
            </span>
            <span>Loading...</span>
        </span>
    `;
}

// Hide button loading state
function hideButtonLoading(button) {
    if (!button) return;
    
    // Restore original HTML
    button.innerHTML = button.dataset.originalHTML || button.dataset.originalText || 'Continue';
    
    // Re-enable button
    button.disabled = false;
    button.style.opacity = '';
    button.style.cursor = '';
}

// Handle "Secure Your Website" button clicks
function handleSecureWebsiteClick(planType = null, event = null) {
    console.log('🔒 Secure Website clicked, Plan:', planType);
    
    // Get button reference
    const button = event ? event.target.closest('button') : null;
    
    // Show loading state on button
    if (button) {
        showButtonLoading(button);
    }
    
    // Check if user is authenticated - try multiple global references
    const authService = window.firebaseAuthService || window.FirebaseAuth || window.AuthService;
    const isAuthenticated = authService && authService.currentUser;
    
    console.log('🔍 Auth check:', {
        authService: !!authService,
        currentUser: authService?.currentUser,
        isAuthenticated
    });
    
    if (isAuthenticated) {
        console.log('✅ User is authenticated, proceeding to checkout...');
        initiateCheckout(planType, button);
    } else {
        console.log('❌ User not authenticated, showing login modal...');
        
        // Hide loading state
        if (button) {
            hideButtonLoading(button);
        }
        
        // Show auth modal
        if (typeof window.authModal !== 'undefined') {
            window.authModal.showAuth();
        } else {
            console.error('Auth modal not available');
            alert('Please log in to continue');
        }
    }
}

// Initiate Stripe checkout
function initiateCheckout(planType, button = null) {
    console.log('💳 Initiating checkout for plan:', planType);
    
    // Show checkout modal
    if (typeof window.checkoutModal !== 'undefined') {
        // Call show and hide button loading after modal is displayed
        const showPromise = window.checkoutModal.show(planType);
        
        // If show returns a promise, wait for it
        if (showPromise && showPromise.then) {
            showPromise.then(() => {
                if (button) {
                    hideButtonLoading(button);
                }
            }).catch((error) => {
                console.error('Error showing checkout modal:', error);
                if (button) {
                    hideButtonLoading(button);
                }
            });
        } else {
            // If no promise, hide loading after a short delay
            setTimeout(() => {
                if (button) {
                    hideButtonLoading(button);
                }
            }, 500);
        }
    } else {
        console.error('Checkout modal not available');
        if (button) {
            hideButtonLoading(button);
        }
        alert('Checkout system is loading. Please try again in a moment.');
    }
}