// Main JavaScript for Talent Website Creator

// Loading Screen Management
let loadingComplete = false;
let resourcesLoaded = 0;
let totalResources = 0;

// Initialize loading screen
const initLoadingScreen = () => {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainWrapper = document.getElementById('mainWrapper');
    
    if (!loadingScreen || !mainWrapper) return;
    
    // Count total resources to load
    const images = document.querySelectorAll('img');
    const fonts = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    totalResources = images.length + fonts.length;
    
    // Track image loading
    images.forEach(img => {
        if (img.complete) {
            resourcesLoaded++;
        } else {
            img.addEventListener('load', () => {
                resourcesLoaded++;
                checkLoadingComplete();
            });
            img.addEventListener('error', () => {
                resourcesLoaded++;
                checkLoadingComplete();
            });
        }
    });
    
    // Track font loading
    if (document.fonts) {
        document.fonts.ready.then(() => {
            resourcesLoaded += fonts.length;
            checkLoadingComplete();
        });
    } else {
        resourcesLoaded += fonts.length;
    }
    
    // Minimum loading time for better UX
    setTimeout(() => {
        loadingComplete = true;
        checkLoadingComplete();
    }, 1500);
    
    // Check initial state
    checkLoadingComplete();
};

// Check if loading is complete
const checkLoadingComplete = () => {
    if (loadingComplete && resourcesLoaded >= totalResources) {
        setTimeout(hideLoadingScreen, 300);
    }
};

// Hide loading screen and show main content
const hideLoadingScreen = () => {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainWrapper = document.getElementById('mainWrapper');
    
    if (!loadingScreen || !mainWrapper) return;
    
    loadingScreen.classList.add('fade-out');
    mainWrapper.classList.add('fade-in');
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 800);
};

// Performance optimizations
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Safari viewport height fix with debouncing
const setVH = debounce(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}, 100);

// Intersection Observer for future performance improvements
const observeElements = () => {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        // Observe hero container for future animations
        const heroContainer = document.querySelector('.hero-container');
        if (heroContainer) observer.observe(heroContainer);
    }
};

// Optimized button interactions
const initializeButtons = () => {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        // Prevent double-tap zoom on iOS
        button.addEventListener('touchstart', function(e) {
            this.style.transform = 'translateY(1px)';
        }, { passive: true });
        
        button.addEventListener('touchend', function(e) {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        }, { passive: true });

        // Add ripple effect for better UX
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
};

// Function to view website samples
function viewSamples() {
    // Start preloading videos immediately when navigation is triggered
    startVideoPreloading();
    
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('view-samples', 'landing');
        const url = window.PageUtils.getDeviceSpecificUrl('samples');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback if PageUtils not available
        console.log('Button clicked: view-samples');
        const url = (isMobile() && !isTablet()) ? 'samples-mobile.html' : 'samples-desktop.html';
        window.location.href = url;
    }
}

// Function to handle login/create account
function loginAccount() {
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('login-account', 'landing');
    } else {
        console.log('Button clicked: login-account');
    }
    
    // Auth system is now handled by auth-loader.js
    if (typeof window.authModal !== 'undefined') {
        window.authModal.showAuth();
    }
}

// Function to view pricing
function viewPricing() {
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('pricing', 'landing');
        const url = window.PageUtils.getDeviceSpecificUrl('pricing');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback if PageUtils not available
        console.log('Button clicked: pricing');
        const url = (isMobile() && !isTablet()) ? 'pricing-mobile.html' : 'pricing-desktop.html';
        window.location.href = url;
    }
}

// Function to view referral program
function affiliateProgram() {
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.trackButtonClick('referral-program', 'landing');
        const url = window.PageUtils.getDeviceSpecificUrl('affiliate');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        // Fallback if PageUtils not available
        console.log('Button clicked: referral-program');
        const url = (isMobile() && !isTablet()) ? 'affiliate-mobile.html' : 'affiliate-desktop.html';
        window.location.href = url;
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Talent Website Creator - Landing Page Loaded');
    
    // Initialize loading screen first
    initLoadingScreen();
    
    // Initialize viewport height
    setVH();
    
    // Initialize button interactions
    initializeButtons();
    
    // Initialize observers for future use
    observeElements();
    
    // Add CSS animation for ripple effect
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});

// Event listeners with optimizations
window.addEventListener('resize', setVH, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(setVH, 100), { passive: true });

// Device detection utilities - now available via PageUtils
// Kept as local fallbacks in case PageUtils isn't loaded
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = () => /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Note: Main utilities moved to PageUtils for shared usage

// Video Preloading System
window.startVideoPreloading = function() {
    console.log('🚀 Starting video preloading during navigation...');
    
    // Create a global preloader if it doesn't exist
    if (!window.VideoPreloader) {
        window.VideoPreloader = {
            desktopVideo: null,
            mobileVideo: null,
            preloadStatus: {
                desktop: 'not-started',
                mobile: 'not-started'
            }
        };
    }
    
    // Start preloading desktop video (high priority)
    preloadVideo('desktop', '../sample-videos/sample-smallvideo-R-PC.mp4', 'high');
    
    // Start preloading mobile video after a short delay (lower priority)
    setTimeout(() => {
        preloadVideo('mobile', '../sample-videos/sample-smallvideo-R-mobile.mp4', 'low');
    }, 1000);
};

function startVideoPreloading() {
    return window.startVideoPreloading();
}

window.preloadVideo = function(type, src, priority) {
    console.log(`📥 Preloading ${type} video with ${priority} priority...`);
    
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.style.display = 'none';
    
    // Set loading priority
    if (priority === 'high') {
        video.setAttribute('importance', 'high');
    } else {
        video.setAttribute('importance', 'low');
    }
    
    // Create source element
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);
    
    // Track loading progress
    video.addEventListener('loadstart', () => {
        window.VideoPreloader.preloadStatus[type] = 'loading';
        console.log(`📊 ${type} video loading started`);
    });
    
    video.addEventListener('progress', () => {
        if (video.buffered.length > 0) {
            const buffered = video.buffered.end(0) / video.duration;
            console.log(`📈 ${type} video preload: ${Math.round(buffered * 100)}%`);
        }
    });
    
    video.addEventListener('canplay', () => {
        window.VideoPreloader.preloadStatus[type] = 'ready';
        console.log(`✅ ${type} video preloaded and ready`);
    });
    
    video.addEventListener('error', (e) => {
        window.VideoPreloader.preloadStatus[type] = 'error';
        console.error(`❌ ${type} video preload error:`, e);
    });
    
    // Store reference and start loading
    window.VideoPreloader[type + 'Video'] = video;
    document.body.appendChild(video);
    video.load();
};

// Alias for global access
function preloadVideo(type, src, priority) {
    return window.preloadVideo(type, src, priority);
}

// Form Handlers (Firebase integration will be added here later)
document.addEventListener('DOMContentLoaded', function() {

});