// Global Header Component JavaScript
// This script handles header transformations, navigation, and user interactions

class HeaderManager {
    constructor() {
        this.header = null;
        this.isTransformed = false;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupHeader());
        } else {
            this.setupHeader();
        }
    }

    setupHeader() {
        this.header = document.getElementById('globalHeader');
        if (!this.header) {
            // Header not ready yet, wait for it
            console.log('Header element not ready, waiting...');
            setTimeout(() => this.setupHeader(), 100);
            return;
        }

        console.log('Header element found, setting up...');
        this.setupEventListeners();
        this.checkAuthState();
        // highlightCurrentPage() is now called after auth state is determined
    }

    setupEventListeners() {
        // Navigation dropdown toggle
        const navToggle = document.getElementById('navToggle');
        const navDropdown = document.querySelector('.nav-dropdown');
        
        if (navToggle && navDropdown) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navDropdown.classList.toggle('active');
                this.closeUserDropdown();
            });
        }

        // User dropdown toggle
        const userToggle = document.getElementById('userToggle');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userToggle && userDropdown) {
            userToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
                this.closeNavDropdown();
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Close dropdowns on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        // Logo click to go home - only on landing page (logoFull), not on other pages (logoIcon)
        const logoFull = document.getElementById('logoFull');
        const logoIcon = document.getElementById('logoIcon');
        
        if (logoFull) {
            logoFull.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goHome();
            });
        }
        
        // Removed logoIcon click handler - users shouldn't go back from other pages
        if (logoIcon) {
            logoIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                // No action - icon is not clickable on other pages
            });
        }
    }

    // Header transformation methods
    transformHeader(pageType = null) {
        if (!this.header || this.isTransformed) return;
        
        console.log(`🎯 Transforming header for ${pageType || 'unknown'} page - showing navigation`);
        this.header.classList.add('transformed');
        
        // CSS will handle logo switching automatically via .transformed class
        console.log('✅ Header transformed, CSS handling logo switch');
        
        // Show navigation
        const headerNav = document.getElementById('headerNav');
        if (headerNav) {
            headerNav.style.display = 'flex';
            console.log('✅ Navigation shown');
        } else {
            console.log('❌ Navigation element not found');
        }

        // Don't show user menu - options moved to dashboard
        // User state is handled through nav button text change only

        this.isTransformed = true;
        console.log('✅ Header transformation complete');
    }

    resetHeader() {
        if (!this.header || !this.isTransformed) return;
        
        this.header.classList.remove('transformed');
        
        // CSS will handle logo switching automatically via removing .transformed class
        console.log('✅ Header reset, CSS handling logo switch');
        
        // Hide navigation
        const headerNav = document.getElementById('headerNav');
        if (headerNav) {
            setTimeout(() => {
                headerNav.style.display = 'none';
            }, 300);
        }

        // Hide user menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            setTimeout(() => {
                userMenu.style.display = 'none';
            }, 300);
        }

        this.isTransformed = false;
        this.closeAllDropdowns();
        console.log('Header reset');
    }

    // Authentication state management
    setLoggedIn(user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.updateUserDisplay();
        
        // Update navigation items for logged-in state
        this.updateNavForLoggedIn();
    }

    setLoggedOut() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.updateUserDisplay();
        
        // Update navigation items for logged-out state
        this.updateNavForLoggedOut();
    }

    updateUserDisplay() {
        const userMenu = document.getElementById('userMenu');
        const navAuth = document.querySelector('.nav-auth');
        
        if (this.isLoggedIn && this.currentUser) {
            // Hide user menu since options moved to dashboard
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            // Change login button to "My Dashboard"
            if (navAuth) {
                // Check if we're on mobile by looking for mobile in the URL or checking window width
                const isMobile = window.location.pathname.includes('mobile') || window.innerWidth <= 768;
                
                if (isMobile) {
                    navAuth.innerHTML = 'My<br>Dashboard';
                } else {
                    navAuth.textContent = 'My Dashboard';
                }
                
                navAuth.onclick = function() { 
                    goToDashboard(); 
                    return false; 
                };
            }
        } else {
            // Hide user menu
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            // Show original login link in nav
            if (navAuth) {
                // Check if we're on mobile for logout state too
                const isMobile = window.location.pathname.includes('mobile') || window.innerWidth <= 768;
                
                if (isMobile) {
                    navAuth.innerHTML = 'Login/<br>Register';
                } else {
                    navAuth.textContent = 'Login/Register';
                }
                
                navAuth.onclick = function() { 
                    loginAccount(); 
                    return false; 
                };
            }
        }
    }

    updateNavForLoggedIn() {
        // Transform "View Website Samples" to "My Websites"
        const sampleNavItem = document.querySelector('.nav-item[onclick*="viewSamples"]');
        if (sampleNavItem) {
            // Check if we're on mobile by looking for <br> tags in the text
            const isMobileNav = sampleNavItem.innerHTML.includes('<br>');
            
            if (isMobileNav) {
                sampleNavItem.innerHTML = 'My<br>Websites';
            } else {
                sampleNavItem.textContent = 'My Websites';
            }
            
            // Update the onclick handler
            sampleNavItem.onclick = () => {
                if (typeof window.goToMyWebsites !== 'undefined') {
                    window.goToMyWebsites();
                } else {
                    // Fallback navigation
                    this.navigateToMyWebsites();
                }
                return false;
            };
            
            console.log('✅ Transformed samples nav to My Websites');
        }
        
        // Check if user has purchased websites and transform "Plans" to "My Plans"
        this.checkAndUpdatePlansNav();
        
        // Highlight current page after navigation update
        setTimeout(() => this.highlightCurrentPage(), 100);
    }
    
    async checkAndUpdatePlansNav() {
        // Wait for Firebase to be available
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.log('⚠️ Firebase not available for plans nav check');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        try {
            // Check if user has any websites
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const websitesMap = userData.websites || {};
                const hasWebsites = Object.keys(websitesMap).length > 0;
                
                if (hasWebsites) {
                    // Transform "Plans" to "My Plans"
                    const plansNavItem = document.querySelector('.nav-item[onclick*="viewPricing"]');
                    if (plansNavItem) {
                        const isMobileNav = plansNavItem.innerHTML.includes('<br>');
                        
                        if (isMobileNav) {
                            plansNavItem.innerHTML = 'My<br>Plans';
                        } else {
                            plansNavItem.textContent = 'My Plans';
                        }
                        
                        // Update onclick to go to My Plans page
                        plansNavItem.onclick = () => {
                            if (typeof window.goToMyPlans !== 'undefined') {
                                window.goToMyPlans();
                            } else {
                                this.navigateToMyPlans();
                            }
                            return false;
                        };
                        
                        console.log('✅ Transformed Plans nav to My Plans');
                    }
                    
                    // Transform "Referral Program" to "My Referrals"
                    const referralsNavItem = document.querySelector('.nav-item[onclick*="affiliateProgram"]');
                    if (referralsNavItem) {
                        const isMobileNav = referralsNavItem.innerHTML.includes('<br>');
                        
                        if (isMobileNav) {
                            referralsNavItem.innerHTML = 'My<br>Referrals';
                        } else {
                            referralsNavItem.textContent = 'My Referrals';
                        }
                        
                        // Update onclick to go to My Referrals page
                        referralsNavItem.onclick = () => {
                            if (typeof window.goToMyReferrals !== 'undefined') {
                                window.goToMyReferrals();
                            } else {
                                this.navigateToMyReferrals();
                            }
                            return false;
                        };
                        
                        console.log('✅ Transformed Referral Program nav to My Referrals');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error checking user websites:', error);
        }
    }

    updateNavForLoggedOut() {
        // Restore "My Websites" back to "View Website Samples"
        const myWebsitesNavItem = document.querySelector('.nav-item[onclick*="goToMyWebsites"], .nav-item[onclick*="navigateToMyWebsites"]');
        if (myWebsitesNavItem) {
            // Check if we're on mobile by looking for <br> tags in the text
            const isMobileNav = myWebsitesNavItem.innerHTML.includes('<br>');
            
            if (isMobileNav) {
                myWebsitesNavItem.innerHTML = 'Website<br>Samples';
            } else {
                myWebsitesNavItem.textContent = 'View Website Samples';
            }
            
            // Restore the original onclick handler
            myWebsitesNavItem.onclick = () => {
                if (typeof window.viewSamples !== 'undefined') {
                    window.viewSamples();
                } else {
                    // Fallback navigation to samples
                    this.navigateToSamples();
                }
                return false;
            };
            
            console.log('✅ Restored My Websites nav to View Website Samples');
        }
        
        // Highlight current page after navigation update
        setTimeout(() => this.highlightCurrentPage(), 100);
    }

    // Dropdown management
    closeNavDropdown() {
        const navDropdown = document.querySelector('.nav-dropdown');
        if (navDropdown) {
            navDropdown.classList.remove('active');
        }
    }

    closeUserDropdown() {
        const userDropdown = document.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.classList.remove('active');
        }
    }

    closeAllDropdowns() {
        this.closeNavDropdown();
        this.closeUserDropdown();
    }

    // Navigation methods
    goHome() {
        // Reset header when going home
        this.resetHeader();
        
        // Use smooth navigation if available
        const homeUrl = (window.location.pathname.includes('/html/') || window.location.pathname.includes('/pages/')) 
            ? '../index.html' 
            : './index.html';
            
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(homeUrl);
        } else {
            window.location.href = homeUrl;
        }
    }

    goToDashboard() {
        this.closeAllDropdowns();
        
        // Use centralized utilities if available
        if (typeof window.PageUtils !== 'undefined') {
            window.PageUtils.trackButtonClick('dashboard', 'header');
            const dashboardFile = window.PageUtils.getDeviceSpecificUrl('dashboard');
            const dashboardUrl = (window.location.pathname.includes('/html/') || window.location.pathname.includes('/pages/')) 
                ? dashboardFile 
                : `./html/${dashboardFile}`;
                
            if (typeof NavigationUtils !== 'undefined') {
                NavigationUtils.navigateTo(dashboardUrl);
            } else {
                window.location.href = dashboardUrl;
            }
        } else {
            // Fallback device detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const dashboardFile = (isMobile && !isTablet) ? 'dashboard-mobile.html' : 'dashboard-desktop.html';
            const dashboardUrl = (window.location.pathname.includes('/html/') || window.location.pathname.includes('/pages/')) 
                ? dashboardFile 
                : `./html/${dashboardFile}`;
            window.location.href = dashboardUrl;
        }
    }

    // Auth integration
    checkAuthState() {
        // TODO: Check with Firebase auth state
        // For now, check if AuthUtils exists and has auth state
        if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
            this.setLoggedIn(AuthUtils.getCurrentUser());
        } else {
            this.setLoggedOut();
        }
    }

    // Public API methods
    onPageChange(pageType) {
        // Transform header for non-landing pages
        if (pageType && pageType !== 'landing') {
            setTimeout(() => {
                this.transformHeader();
                // Highlight current page after transformation
                // Add delay to ensure any async nav updates (like My Plans) complete first
                setTimeout(() => this.highlightCurrentPage(), 500);
            }, 100);
        } else {
            this.resetHeader();
        }
    }

    // Highlight current page in navigation
    highlightCurrentPage() {
        // Get current page from URL
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop().toLowerCase();
        
        // Remove existing active classes
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // Determine which navigation item should be active
        let activeItem = null;
        
        if (currentPage.includes('samples')) {
            // Find the "View Website Samples" or "My Websites" button
            activeItem = Array.from(navItems).find(item => 
                item.onclick && (item.onclick.toString().includes('viewSamples') || item.onclick.toString().includes('goToMyWebsites'))
            );
        } else if (currentPage.includes('my-websites')) {
            // Find the "My Websites" button (when user is logged in)
            activeItem = Array.from(navItems).find(item => 
                item.onclick && item.onclick.toString().includes('goToMyWebsites')
            );
        } else if (currentPage.includes('my-plans')) {
            // Find the "My Plans" button (when user has purchased websites)
            activeItem = Array.from(navItems).find(item => 
                item.onclick && item.onclick.toString().includes('goToMyPlans')
            );
        } else if (currentPage.includes('pricing')) {
            // Find the "Pricing" or "My Plans" button
            activeItem = Array.from(navItems).find(item => 
                item.onclick && (item.onclick.toString().includes('viewPricing') || item.onclick.toString().includes('goToMyPlans'))
            );
        } else if (currentPage.includes('affiliate')) {
            // Find the "Affiliate Program" button
            activeItem = Array.from(navItems).find(item => 
                item.onclick && item.onclick.toString().includes('affiliateProgram')
            );
        } else if (currentPage.includes('my-referrals')) {
            // Find the "My Referrals" button (when user has purchased websites)
            activeItem = Array.from(navItems).find(item => 
                item.onclick && item.onclick.toString().includes('goToMyReferrals')
            );
        } else if (currentPage.includes('dashboard')) {
            // Find the "My Dashboard" button (when user is logged in and on dashboard)
            activeItem = Array.from(navItems).find(item => 
                item.onclick && item.onclick.toString().includes('goToDashboard')
            );
        }
        
        // Add active class to the matching item
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}

// Global header instance
let headerManager;

// Initialize header when DOM is ready AND header HTML is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for header-loader to finish loading the HTML
    const waitForHeaderLoader = () => {
        if (typeof window.headerLoader !== 'undefined' && window.headerLoader.loaded) {
            console.log('✅ Header HTML loaded, initializing HeaderManager');
            headerManager = new HeaderManager();
            
            // Make header manager globally available with multiple references
            window.HeaderManager = headerManager;
            window.headerManager = headerManager;
            
            console.log('Header component initialized');
            console.log('HeaderManager available globally:', typeof window.HeaderManager !== 'undefined');
        } else {
            console.log('⏳ Waiting for header HTML to load...');
            setTimeout(waitForHeaderLoader, 50);
        }
    };
    
    waitForHeaderLoader();
});

// Global logout function
async function logoutUser() {
    if (headerManager) {
        headerManager.closeAllDropdowns();
    }
    
    const currentPath = window.location.pathname;
    const isOnDashboard = currentPath.includes('dashboard');
    
    // Firebase logout
    if (window.FirebaseAuth) {
        const result = await window.FirebaseAuth.signOut();
        if (result.success) {
            console.log('User logged out successfully');
            
            // Only redirect to home if on dashboard, otherwise just refresh current page
            if (isOnDashboard) {
                // Redirect to samples page instead of landing
                const samplesUrl = currentPath.includes('mobile') ? 'samples-mobile.html' : 'samples-desktop.html';
                window.location.href = samplesUrl;
            } else {
                // Just reload current page to update auth state
                window.location.reload();
            }
        } else {
            console.error('Logout failed:', result.error);
            // Still redirect on error
            if (headerManager) {
                headerManager.goHome();
            }
        }
    } else {
        console.warn('Firebase Auth not available, performing local logout');
        if (headerManager) {
            headerManager.setLoggedOut();
            if (isOnDashboard) {
                headerManager.goHome();
            } else {
                window.location.reload();
            }
        }
    }
}

// Navigation functions for header menu
function viewSamples() {
    console.log('View Samples clicked from header');
    
    // Start preloading videos immediately
    if (typeof startVideoPreloading === 'function') {
        startVideoPreloading();
    } else if (typeof window.startVideoPreloading === 'function') {
        window.startVideoPreloading();
    }
    
    if (headerManager) {
        headerManager.closeAllDropdowns();
    }
    
    // Use centralized utilities if available
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('view-samples', 'header');
        const url = window.PageUtils.getDeviceSpecificUrl('samples');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback device detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const url = (isMobile && !isTablet) ? 'samples-mobile.html' : 'samples-desktop.html';
        window.location.href = url;
    }
}

function viewPricing() {
    console.log('View Pricing clicked from header');
    if (headerManager) {
        headerManager.closeAllDropdowns();
    }
    
    // Use centralized utilities if available
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('pricing', 'header');
        const url = window.PageUtils.getDeviceSpecificUrl('pricing');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback device detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const url = (isMobile && !isTablet) ? 'pricing-mobile.html' : 'pricing-desktop.html';
        window.location.href = url;
    }
}

function affiliateProgram() {
    console.log('Referral Program clicked from header');
    if (headerManager) {
        headerManager.closeAllDropdowns();
    }
    
    // Use centralized utilities if available
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('referral-program', 'header');
        const url = window.PageUtils.getDeviceSpecificUrl('affiliate');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback device detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const url = (isMobile && !isTablet) ? 'affiliate-mobile.html' : 'affiliate-desktop.html';
        window.location.href = url;
    }
}

function loginAccount() {
    console.log('Login Account clicked from header');
    
    if (headerManager) {
        headerManager.closeAllDropdowns();
    }
    
    // Auth system is handled by auth-loader.js
    if (typeof window.authModal !== 'undefined') {
        window.authModal.showAuth();
    } else {
        // Fallback - could redirect to login page or show alert
        console.log('Auth modal not available');
    }
    return false; // Prevent page reload
}

// Global dashboard navigation function
function goToDashboard() {
    console.log('Dashboard clicked from header');
    if (headerManager) {
        headerManager.goToDashboard();
    }
}

// Add navigation methods to HeaderManager class
HeaderManager.prototype.navigateToMyWebsites = function() {
    console.log('🌐 Navigating to My Websites (fallback)');
    if (typeof window.PageUtils !== 'undefined') {
        const myWebsitesUrl = window.PageUtils.getDeviceSpecificUrl('my-websites');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? myWebsitesUrl 
            : `./html/${myWebsitesUrl}`;
        window.location.href = fullUrl;
    } else {
        // Fallback navigation
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const myWebsitesFile = (isMobile && !isTablet) ? 'my-websites-mobile.html' : 'my-websites-desktop.html';
        const myWebsitesUrl = window.location.pathname.includes('/html/') 
            ? myWebsitesFile 
            : `./html/${myWebsitesFile}`;
        window.location.href = myWebsitesUrl;
    }
};

HeaderManager.prototype.navigateToMyPlans = function() {
    console.log('📋 Navigating to My Plans (fallback)');
    if (typeof window.PageUtils !== 'undefined') {
        const myPlansUrl = window.PageUtils.getDeviceSpecificUrl('my-plans');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? myPlansUrl 
            : `./html/${myPlansUrl}`;
        window.location.href = fullUrl;
    } else {
        // Fallback navigation
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const myPlansFile = (isMobile && !isTablet) ? 'my-plans-mobile.html' : 'my-plans-desktop.html';
        const myPlansUrl = window.location.pathname.includes('/html/') 
            ? myPlansFile 
            : `./html/${myPlansFile}`;
        window.location.href = myPlansUrl;
    }
};

HeaderManager.prototype.navigateToSamples = function() {
    console.log('📄 Navigating to Samples (fallback)');
    if (typeof window.PageUtils !== 'undefined') {
        const samplesUrl = window.PageUtils.getDeviceSpecificUrl('samples');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? samplesUrl 
            : `./html/${samplesUrl}`;
        window.location.href = fullUrl;
    } else {
        // Fallback navigation
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const samplesFile = (isMobile && !isTablet) ? 'samples-mobile.html' : 'samples-desktop.html';
        const samplesUrl = window.location.pathname.includes('/html/') 
            ? samplesFile 
            : `./html/${samplesFile}`;
        window.location.href = samplesUrl;
    }
};

HeaderManager.prototype.navigateToMyReferrals = function() {
    console.log('🎁 Navigating to My Referrals (fallback)');
    if (typeof window.PageUtils !== 'undefined') {
        const myReferralsUrl = window.PageUtils.getDeviceSpecificUrl('my-referrals');
        const fullUrl = window.location.pathname.includes('/html/') 
            ? myReferralsUrl 
            : `./html/${myReferralsUrl}`;
        window.location.href = fullUrl;
    } else {
        // Fallback navigation
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const myReferralsFile = (isMobile && !isTablet) ? 'my-referrals-mobile.html' : 'my-referrals-desktop.html';
        const myReferralsUrl = window.location.pathname.includes('/html/') 
            ? myReferralsFile 
            : `./html/${myReferralsFile}`;
        window.location.href = myReferralsUrl;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeaderManager };
}