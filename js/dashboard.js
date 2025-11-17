// Dashboard Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Dashboard DOM loaded - starting initialization');
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('dashboard', () => {
            // Custom initialization after header is set up
            initDashboardCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initDashboardPageFallback();
    }
});

// Custom initialization function called after header setup
function initDashboardCustom() {
    // Wait a moment for header animation to complete before starting auth check
    setTimeout(() => {
        waitForAuthAndShowDashboard();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initDashboardPageFallback() {
    console.log('Dashboard Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('dashboard');
        }
        waitForAuthAndShowDashboard();
    }, 300);
}

// Wait for authentication to be ready, then show dashboard with user info
async function waitForAuthAndShowDashboard() {
    console.log('⏳ Waiting for authentication to be ready...');
    
    // Wait for Firebase Auth to be available
    let attempts = 0;
    while (attempts < 50) { // 5 second timeout
        if (typeof window.FirebaseAuth !== 'undefined' && window.FirebaseAuth.auth) {
            console.log('✅ Firebase Auth is available');
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (attempts >= 50) {
        console.error('❌ Firebase Auth never became available');
        showDashboardWithFallback();
        return;
    }
    
    // Wait for user authentication state
    const user = await waitForAuthenticatedUser();
    
    if (user) {
        console.log('✅ User authenticated, updating greeting and checking website status');
        await updateUserGreeting(user);
        
        // Check if user has purchased websites
        const hasWebsites = await checkUserHasWebsites(user);
        
        if (hasWebsites) {
            console.log('✅ User has websites - showing full dashboard with billing');
            showDashboard();
            // Load billing data automatically on page load
            if (typeof window.loadBillingData === 'function') {
                window.loadBillingData();
            }
        } else {
            console.log('📋 User has no websites - showing simplified dashboard');
            showSimplifiedDashboard();
        }
    } else {
        console.log('❌ User not authenticated, redirecting...');
        // If user is not authenticated on dashboard page, redirect to landing
        if (typeof window.FirebaseAuth !== 'undefined' && window.FirebaseAuth.redirectToLanding) {
            window.FirebaseAuth.redirectToLanding();
        }
    }
}

// Check if user has purchased any websites
async function checkUserHasWebsites(user) {
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = userData.websites || {};
            const hasWebsites = Object.keys(websitesMap).length > 0;
            console.log(`📊 User has ${Object.keys(websitesMap).length} website(s)`);
            return hasWebsites;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error checking user websites:', error);
        return false;
    }
}

// Wait for authenticated user with timeout
function waitForAuthenticatedUser() {
    return new Promise((resolve) => {
        let timeoutId;
        
        // Check if user is already available
        if (window.FirebaseAuth.auth.currentUser) {
            console.log('👤 User already available');
            resolve(window.FirebaseAuth.auth.currentUser);
            return;
        }
        
        // Listen for auth state changes
        const unsubscribe = window.FirebaseAuth.auth.onAuthStateChanged((user) => {
            console.log('🔄 Auth state changed in dashboard:', user ? 'User logged in' : 'User logged out');
            clearTimeout(timeoutId);
            unsubscribe(); // Clean up listener
            resolve(user);
        });
        
        // Timeout after 3 seconds
        timeoutId = setTimeout(() => {
            console.log('⏰ Auth state timeout in dashboard');
            unsubscribe();
            resolve(null);
        }, 3000);
    });
}

// Update the user greeting with their name
async function updateUserGreeting(user) {
    const greetingElement = document.getElementById('userGreeting');
    if (!greetingElement) return;
    
    if (user) {
        try {
            // Fetch displayName from Firestore instead of Auth object
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .get();
            
            let userName = user.email.split('@')[0]; // Default fallback
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                userName = userData.displayName || userName;
            }
            
            greetingElement.textContent = `Hello ${userName}`;
            console.log('✅ User greeting updated:', userName);
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
            // Fallback to email username if Firestore fails
            const userName = user.email.split('@')[0];
            greetingElement.textContent = `Hello ${userName}`;
            console.log('⚠️ Using email fallback for greeting:', userName);
        }
    } else {
        greetingElement.textContent = 'Hello';
        console.log('⚠️ No user provided for greeting');
    }
}

// Show the dashboard with smooth fade-in
function showDashboard() {
    // Hide loading screen with fade-out effect (like landing page)
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        console.log('✨ Hiding loading screen with fade-out');
        
        // Remove loading screen completely after fade-out completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 800); // Match the CSS transition duration
    }
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        console.log('✨ Showing dashboard with fade-in');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Fallback function to show dashboard even if auth fails
function showDashboardWithFallback() {
    console.log('⚠️ Showing dashboard with fallback (no auth)');
    updateUserGreeting(null);
    showDashboard();
}

// Show simplified dashboard for users without websites (3 buttons only)
function showSimplifiedDashboard() {
    // Hide the billing section
    const billingSection = document.getElementById('billingSection');
    if (billingSection) {
        billingSection.style.display = 'none';
    }
    
    // Hide the sign-out button in page-hero (only show in simplified menu)
    const pageHeroSignOut = document.querySelector('.page-hero .sign-out');
    if (pageHeroSignOut) {
        pageHeroSignOut.style.display = 'none';
    }
    
    // Create simplified button menu
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Check if simplified menu already exists
    let simplifiedMenu = document.getElementById('simplifiedDashboardMenu');
    if (!simplifiedMenu) {
        // Create the simplified menu HTML
        simplifiedMenu = document.createElement('div');
        simplifiedMenu.id = 'simplifiedDashboardMenu';
        simplifiedMenu.className = 'simplified-dashboard-menu';
        simplifiedMenu.innerHTML = `
            <a href="#" class="simplified-menu-btn primary-btn" onclick="goToPricing(); return false;">
                <span class="btn-icon">🌐</span>
                <span class="btn-text">Get Your Website and Pick Your Service Plan</span>
            </a>
            <a href="#" class="simplified-menu-btn tertiary-btn" onclick="goToReferrals(); return false;">
                <span class="btn-icon green-dollar">$</span>
                <span class="btn-text">Earn Cash with Our Referral Program</span>
            </a>
            <a href="#" class="simplified-menu-btn secondary-btn" onclick="goToWebsiteSamples(); return false;">
                <span class="btn-icon" style="display: flex; align-items: center; justify-content: center; overflow: hidden;"><img src="../assets/images/twc-icon-logo.jpg" alt="TWC" style="width: 36px; height: 36px; border-radius: 4px; filter: brightness(0) invert(1);"></span>
                <span class="btn-text">View Website Samples</span>
            </a>
            <a href="#" class="simplified-menu-btn logout-btn" onclick="logoutUser(); return false;">
                <span class="btn-text">Sign Out</span>
            </a>
        `;
        
        // Insert after the page-hero section
        const pageHero = document.querySelector('.page-hero');
        if (pageHero && pageHero.parentNode) {
            pageHero.parentNode.insertBefore(simplifiedMenu, pageHero.nextSibling);
        }
    }
    
    // Show simplified menu
    simplifiedMenu.style.display = 'flex';
    
    // Show the dashboard with fade-in
    showDashboard();
}

// Navigation functions for simplified dashboard
function goToPricing() {
    console.log('📋 Navigating to pricing page');
    if (typeof window.PageUtils !== 'undefined') {
        const pricingUrl = window.PageUtils.getDeviceSpecificUrl('pricing');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? pricingUrl 
            : `./html/${pricingUrl}`;
        window.location.href = fullUrl;
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const pricingFile = (isMobile && !isTablet) ? 'pricing-mobile.html' : 'pricing-desktop.html';
        const pricingUrl = window.location.pathname.includes('/html/') 
            ? pricingFile 
            : `./html/${pricingFile}`;
        window.location.href = pricingUrl;
    }
}

function goToReferrals() {
    console.log('💰 Navigating to referral program');
    if (typeof window.PageUtils !== 'undefined') {
        const affiliateUrl = window.PageUtils.getDeviceSpecificUrl('affiliate');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? affiliateUrl 
            : `./html/${affiliateUrl}`;
        window.location.href = fullUrl;
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const affiliateFile = (isMobile && !isTablet) ? 'affiliate-mobile.html' : 'affiliate-desktop.html';
        const affiliateUrl = window.location.pathname.includes('/html/') 
            ? affiliateFile 
            : `./html/${affiliateFile}`;
        window.location.href = affiliateUrl;
    }
}

function goToWebsiteSamples() {
    console.log('🎬 Navigating to website samples');
    // Navigate to samples page with from=my-websites parameter to show back button
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent);
    const samplesFile = (isMobile && !isTablet) ? 'samples-mobile.html' : 'samples-desktop.html';
    const samplesUrl = window.location.pathname.includes('/html/') 
        ? `${samplesFile}?from=my-websites`
        : `./html/${samplesFile}?from=my-websites`;
    window.location.href = samplesUrl;
}