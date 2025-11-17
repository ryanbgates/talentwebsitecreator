// Website Samples Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Samples DOM loaded - starting initialization');
    
    // Check if we came from My Websites and add back button
    const urlParams = new URLSearchParams(window.location.search);
    const fromMyWebsites = urlParams.get('from') === 'my-websites';
    
    if (fromMyWebsites) {
        console.log('🔙 Adding back to My Websites button');
        
        // Detect device type for styling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const isMobileDevice = isMobile && !isTablet;
        
        // Create tab-style back button
        const backButton = document.createElement('div');
        backButton.style.cssText = `
            position: fixed;
            top: ${isMobileDevice ? '70px' : '80px'};
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            text-align: center;
        `;
        backButton.innerHTML = `
            <button onclick="goBackToMyWebsites()" style="
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                color: #1a1a1a;
                border: 2px solid #e2e8f0;
                border-top: 3px solid #3b82f6;
                padding: 0;
                border-radius: 0 0 16px 16px;
                border-top-left-radius: 0;
                border-top-right-radius: 0;
                font-size: ${isMobileDevice ? '12px' : '13px'};
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(59,130,246,0.2);
                backdrop-filter: blur(10px);
                position: relative;
                min-width: ${isMobileDevice ? '140px' : '180px'};
                margin-top: ${isMobileDevice ? '0px' : '-10px'};
                z-index: 999;
                height: ${isMobileDevice ? '40px' : '50px'};
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding-bottom: ${isMobileDevice ? '6px' : '8px'};
                line-height: 1;
            " onmouseover="this.style.transform='translateY(3px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15), 0 3px 6px rgba(59,130,246,0.3)'; this.style.borderTopColor='#2563eb';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(59,130,246,0.2)'; this.style.borderTopColor='#3b82f6';">
                ← ${isMobileDevice ? 'My Websites' : 'Back to My Websites'}
            </button>
        `;
        
        // Add to page
        document.body.appendChild(backButton);
    }
    
    // Add enhanced visual debug overlay for mobile
    if (false && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Create main debug container
        const debugContainer = document.createElement('div');
        debugContainer.id = 'mobileDebugContainer';
        debugContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            height: 200px;
            z-index: 9999;
            font-family: monospace;
            transition: all 0.3s ease;
        `;
        
        // Create minimize/maximize button
        const debugTab = document.createElement('div');
        debugTab.id = 'mobileDebugTab';
        debugTab.innerHTML = '📱 Debug';
        debugTab.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: rgba(0,150,255,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 15px;
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            touch-action: none;
        `;
        
        // Create debug content area
        const debugContent = document.createElement('div');
        debugContent.id = 'mobileDebugContent';
        debugContent.style.cssText = `
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            font-size: 11px;
            border-radius: 5px;
            overflow-y: scroll;
            line-height: 1.2;
            height: 100%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        debugContent.innerHTML = 'Mobile Debug Log:<br>=================<br>';
        
        // Assemble the debug system
        debugContainer.appendChild(debugContent);
        debugContainer.appendChild(debugTab);
        document.body.appendChild(debugContainer);
        
        // State management
        let isMinimized = false;
        let dragStartX, dragStartY, initialX, initialY;
        let savedPosition = { top: 10, left: 10 }; // Remember where we moved the debug window
        
        // Toggle minimize/maximize
        function toggleDebug() {
            isMinimized = !isMinimized;
            if (isMinimized) {
                // Store current position before minimizing
                const rect = debugContainer.getBoundingClientRect();
                savedPosition.top = rect.top;
                savedPosition.left = rect.left;
                
                // Minimize: hide content, show small draggable tab
                debugContent.style.display = 'none';
                debugContainer.style.width = '80px';
                debugContainer.style.height = '35px';
                debugContainer.style.right = 'auto'; // Remove right constraint
                debugContainer.style.top = savedPosition.top + 'px';
                debugContainer.style.left = savedPosition.left + 'px';
                debugTab.innerHTML = '📱 Show';
                debugTab.style.position = 'static';
                debugTab.style.width = '100%';
                debugTab.style.textAlign = 'center';
            } else {
                // Maximize: show content at the current tab position
                const rect = debugContainer.getBoundingClientRect();
                
                debugContent.style.display = 'block';
                debugContainer.style.width = '300px'; // Fixed width instead of auto
                debugContainer.style.height = '200px';
                debugContainer.style.right = 'auto'; // Remove right constraint
                
                // Position the expanded window near the tab, but keep it on screen
                let newTop = rect.top;
                let newLeft = rect.left;
                
                // Adjust if would go off screen
                if (newLeft + 300 > window.innerWidth) {
                    newLeft = window.innerWidth - 310; // 10px margin
                }
                if (newTop + 200 > window.innerHeight) {
                    newTop = window.innerHeight - 210; // 10px margin
                }
                if (newLeft < 10) newLeft = 10;
                if (newTop < 10) newTop = 10;
                
                debugContainer.style.top = newTop + 'px';
                debugContainer.style.left = newLeft + 'px';
                
                debugTab.innerHTML = '📱 Hide';
                debugTab.style.position = 'absolute';
                debugTab.style.width = '';
                debugTab.style.textAlign = '';
                
                // Update saved position
                savedPosition.top = newTop;
                savedPosition.left = newLeft;
            }
        }
        
        // Click handler - works the same for both states
        debugTab.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDebug();
        });
        
        // Drag functionality - only active when minimized, and only prevent click if actually dragging
        let hasMoved = false;
        
        debugTab.addEventListener('touchstart', function(e) {
            if (isMinimized) {
                hasMoved = false;
                const touch = e.touches[0];
                dragStartX = touch.clientX;
                dragStartY = touch.clientY;
                
                const rect = debugContainer.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
            }
        });
        
        debugTab.addEventListener('touchmove', function(e) {
            if (isMinimized) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - dragStartX);
                const deltaY = Math.abs(touch.clientY - dragStartY);
                
                // Only start dragging if moved more than 10 pixels
                if (deltaX > 10 || deltaY > 10) {
                    hasMoved = true;
                    
                    const totalDeltaX = touch.clientX - dragStartX;
                    const totalDeltaY = touch.clientY - dragStartY;
                    
                    const newX = Math.max(0, Math.min(window.innerWidth - 80, initialX + totalDeltaX));
                    const newY = Math.max(0, Math.min(window.innerHeight - 35, initialY + totalDeltaY));
                    
                    debugContainer.style.left = newX + 'px';
                    debugContainer.style.top = newY + 'px';
                    
                    // Update saved position while dragging
                    savedPosition.left = newX;
                    savedPosition.top = newY;
                    
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });
        
        debugTab.addEventListener('touchend', function(e) {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
            hasMoved = false;
        });
        
        // Mouse events for desktop testing
        debugTab.addEventListener('mousedown', function(e) {
            if (isMinimized) {
                hasMoved = false;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                
                const rect = debugContainer.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isMinimized && e.buttons === 1) {
                const deltaX = Math.abs(e.clientX - dragStartX);
                const deltaY = Math.abs(e.clientY - dragStartY);
                
                // Only start dragging if moved more than 10 pixels
                if (deltaX > 10 || deltaY > 10) {
                    hasMoved = true;
                    
                    const totalDeltaX = e.clientX - dragStartX;
                    const totalDeltaY = e.clientY - dragStartY;
                    
                    const newX = Math.max(0, Math.min(window.innerWidth - 80, initialX + totalDeltaX));
                    const newY = Math.max(0, Math.min(window.innerHeight - 35, initialY + totalDeltaY));
                    
                    debugContainer.style.left = newX + 'px';
                    debugContainer.style.top = newY + 'px';
                    
                    // Update saved position while dragging
                    savedPosition.left = newX;
                    savedPosition.top = newY;
                }
            }
        });
        
        document.addEventListener('mouseup', function(e) {
            hasMoved = false;
        });
        
        window.mobileDebug = function(message) {
            const timestamp = new Date().toLocaleTimeString();
            debugContent.innerHTML += `[${timestamp}] ${message}<br>`;
            // Auto-scroll to bottom if visible
            if (!isMinimized) {
                debugContent.scrollTop = debugContent.scrollHeight;
            }
        };
        
        window.mobileDebug('DOM loaded, starting init');
    } else {
        window.mobileDebug = function() {}; // No-op for desktop
    }
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('samples', () => {
            window.mobileDebug('PageUtils complete');
            initSamplesCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        window.mobileDebug('No PageUtils, using fallback');
        initSamplesPageFallback();
    }
});

// Custom initialization function called after header setup
function initSamplesCustom() {
    // Wait for header-loader to finish before checking header readiness
    function waitForHeaderLoader() {
        return new Promise((resolve) => {
            if (window.headerLoader && window.headerLoader.loaded) {
                window.mobileDebug('✅ Header-loader already complete');
                resolve();
                return;
            }
            
            if (!window.headerLoader) {
                window.mobileDebug('❌ Header-loader not found, proceeding anyway');
                resolve();
                return;
            }
            
            window.mobileDebug('⏳ Waiting for header-loader to complete...');
            
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            
            function checkLoaderReady() {
                attempts++;
                
                if (window.headerLoader.loaded) {
                    window.mobileDebug(`✅ Header-loader complete after ${attempts} checks`);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    window.mobileDebug('⚠️ Header-loader timeout, proceeding anyway');
                    resolve();
                } else {
                    setTimeout(checkLoaderReady, 50); // Reduced from 100ms to 50ms
                }
            }
            
            checkLoaderReady();
        });
    }
    
    // First wait for header-loader, then check header readiness
    waitForHeaderLoader().then(() => {
        return waitForHeaderReady();
    }).then(() => {
        window.mobileDebug('Header check complete');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const delay = isMobile ? 300 : 100;
        setTimeout(() => {
            window.mobileDebug('Showing page now');
            showSamplesPage();
        }, delay);
    });
    
    // Function to check if header is fully loaded
    function waitForHeaderReady() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds max
            
            window.mobileDebug('Starting header check');
            
            // Reduced delay since we're being proactive with transformation
            setTimeout(() => {
            
            let hasTriedTransform = false; // Track if we've already tried transforming
            
            function checkHeader() {
                attempts++;
                
                // Check if header manager exists and navigation is fully initialized
                const headerManager = window.HeaderManager;
                const navigation = document.querySelector('.header-nav');
                const navButtons = navigation ? navigation.querySelectorAll('button, a') : [];
                
                // Enhanced debugging
                const navComputedStyle = navigation ? window.getComputedStyle(navigation) : null;
                const navVisible = navComputedStyle ? navComputedStyle.display !== 'none' : false;
                window.mobileDebug(`Check ${attempts}: HM:${!!headerManager} Ready:${headerManager?.header ? 'yes' : 'no'} Nav:${!!navigation} Display:${navComputedStyle?.display} Visible:${navVisible} Auth:${typeof window.AuthUtils !== 'undefined'} Btns:${navButtons.length}`);
                
                // If HeaderManager exists but navigation isn't visible yet, try to transform it (once)
                if (headerManager && navigation && !headerManager.isTransformed && !hasTriedTransform) {
                    window.mobileDebug(`🚀 Proactively transforming header (isTransformed: ${headerManager.isTransformed}, header: ${!!headerManager.header})`);
                    
                    // Try HeaderManager first
                    headerManager.transformHeader('samples');
                    
                    // If HeaderManager failed (header not set), manually show navigation
                    if (!headerManager.header) {
                        window.mobileDebug(`🔧 HeaderManager.header is null, manually showing navigation`);
                        navigation.style.display = 'flex';
                        const globalHeader = document.getElementById('globalHeader');
                        if (globalHeader) {
                            globalHeader.classList.add('transformed');
                        }
                    }
                    
                    hasTriedTransform = true;
                    
                    // Double-check that transformation worked
                    setTimeout(() => {
                        const newStyle = window.getComputedStyle(navigation);
                        window.mobileDebug(`🔍 Transform result: display=${newStyle.display}, isTransformed=${headerManager.isTransformed}, header=${!!headerManager.header}`);
                    }, 10);
                }
                
                // Check if navigation is actually visible (not just existing)
                const computedStyle = navigation ? window.getComputedStyle(navigation) : null;
                const isNavVisible = navigation && 
                                   computedStyle &&
                                   computedStyle.display !== 'none' &&
                                   computedStyle.visibility !== 'hidden' &&
                                   computedStyle.opacity !== '0';
                
                // Check if auth state has been determined (AuthUtils loaded or timeout)
                const authReady = typeof window.AuthUtils !== 'undefined' || attempts > 15; // Give auth 1.5s to load
                
                // More robust check - HeaderManager must exist AND navigation must be visible with buttons AND auth ready
                const headerFullyReady = headerManager && 
                                       headerManager.header && 
                                       navigation && 
                                       isNavVisible &&
                                       navButtons.length > 0 &&
                                       authReady;
                
                window.mobileDebug(`Check ${attempts}: HM:${!!headerManager} Ready:${headerFullyReady} Nav:${!!navigation} Visible:${isNavVisible} Auth:${authReady} Btns:${navButtons.length} CSS:${computedStyle ? computedStyle.display : 'null'}`);
                
                if (headerFullyReady) {
                    window.mobileDebug('✅ Header ready with nav');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    window.mobileDebug('⚠️ Header timeout, proceeding');
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            }
            
            checkHeader();
            }, 50); // Reduced from 150ms to 50ms for faster response
        });
    }
}

// Expose the function globally for external calls
window.initSamplesCustom = initSamplesCustom;

// Fallback function in case PageUtils isn't loaded
function initSamplesPageFallback() {
    console.log('Website Samples Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('samples');
        }
        // Show page after a delay
        showSamplesPage();
    }, 800);
}

// Show the page with smooth fade-in
function showSamplesPage() {
    window.mobileDebug(`✨ showSamplesPage() called`);
    
    // Hide loading screen with fade-out effect (like landing page)
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        console.log('✨ Hiding samples loading screen with fade-out');
        window.mobileDebug(`🌅 Loading screen fade-out started`);
        
        // Remove loading screen completely after fade-out completes
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            window.mobileDebug(`🗑️ Loading screen removed after fade-out`);
        }, 800); // Match the CSS transition duration
    }
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        console.log('✨ Showing samples page content');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
        window.mobileDebug(`👁️ Main content now visible`);
        
        // Initialize simple carousel
        // Only initialize videos after confirming header is ready
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Function to verify header is still ready (double-check)
        function verifyHeaderReady() {
            const navigation = document.querySelector('.header-nav');
            const navButtons = navigation ? navigation.querySelectorAll('button, a') : [];
            return navigation && navButtons.length > 0;
        }
        
        if (verifyHeaderReady()) {
            // Header confirmed ready, start video initialization
            const videoDelay = isMobile ? 300 : 100;
            window.mobileDebug(`🎬 Starting carousel and video init in ${videoDelay}ms`);
            setTimeout(() => {
                window.mobileDebug(`🎠 Initializing carousel...`);
                initSimpleCarousel();
                window.mobileDebug(`📹 Initializing video management...`);
                initVideoManagement();
                window.mobileDebug(`✅ Page initialization complete`);
            }, videoDelay);
        } else {
            // Header not ready, wait longer
            console.warn('⚠️ Header not ready when showing page, waiting longer...');
            window.mobileDebug(`⚠️ Header not ready, delaying init by 1000ms`);
            setTimeout(() => {
                initSimpleCarousel();
                initVideoManagement();
                window.mobileDebug(`✅ Page initialization complete (delayed)`);
            }, 1000);
        }
    }
}

// Initialize proper video lifecycle management
function initVideoManagement() {
    // Don't call stopAllVideos() on initial load to prevent cleanup flash
    // The videos are already in a clean state when the page loads
    // This prevents the initial flash while maintaining proper video management
}

// Stop all videos on the page and clean up their state
function stopAllVideos() {
    // Use the comprehensive cleanup function
    cleanupAllVideos();
}

// Play videos only for the specified slide and active tab
function playVideosForCurrentSlide(slideIndex = 0) {
    window.mobileDebug(`🎬 playVideosForCurrentSlide(${slideIndex}) called`);
    const slides = document.querySelectorAll('.carousel-slide');
    const targetSlide = slides[slideIndex];
    
    if (!targetSlide) {
        window.mobileDebug(`❌ Slide ${slideIndex + 1} not found`);
        return;
    }
    
    // Only proceed if this slide is actually visible (has 'active' class)
    if (!targetSlide.classList.contains('active')) {
        window.mobileDebug(`⏸️ Skipping video loading for inactive slide ${slideIndex + 1}`);
        return;
    }
    
    window.mobileDebug(`✅ Loading videos for active slide ${slideIndex + 1}`);
    
    // Find the active tab content within this slide
    const activeTabContent = targetSlide.querySelector('.video-item.active');
    
    if (activeTabContent) {
        const activeTabType = activeTabContent.getAttribute('data-content');
        const videos = activeTabContent.querySelectorAll('.sample-video');
        window.mobileDebug(`🎯 Found ${videos.length} videos for slide ${slideIndex + 1}, active tab: ${activeTabType}`);
        
        videos.forEach((video, index) => {
            if (video.tagName.toLowerCase() === 'video') {
                window.mobileDebug(`📹 Starting lazy load for video ${index + 1}/${videos.length} in slide ${slideIndex + 1}`);
                loadVideoLazily(video, index, slideIndex);
            } else if (video.tagName.toLowerCase() === 'img') {
                window.mobileDebug(`🖼️ Starting lazy load for image ${index + 1}/${videos.length} in slide ${slideIndex + 1}`);
                loadImageLazily(video, index, slideIndex);
            }
        });
    } else {
        window.mobileDebug(`❌ No active tab content found in slide ${slideIndex + 1}`);
    }
}

// True lazy loading - only create video source when needed
function loadVideoLazily(video, index, slideIndex) {
    const startTime = performance.now();
    window.mobileDebug(`🚀 loadVideoLazily start: video ${index + 1}, slide ${slideIndex + 1}`);
    
    let videoSrc = video.getAttribute('data-src') || video.getAttribute('data-original-src');
    
    // If no data-src or data-original-src, check for existing source elements
    if (!videoSrc) {
        const existingSource = video.querySelector('source');
        if (existingSource) {
            videoSrc = existingSource.src;
            window.mobileDebug(`📄 Using existing source: ${videoSrc.split('/').pop()}`);
        }
    } else {
        window.mobileDebug(`📄 Using data-src: ${videoSrc.split('/').pop()}`);
    }
    
    if (!videoSrc) {
        window.mobileDebug(`❌ No video source found for video ${index + 1}`);
        return;
    }
    
    const container = video.closest('.sample-video-container');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const videoFileName = videoSrc.split('/').pop();
    
    window.mobileDebug(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, Loading: ${videoFileName}`);
    
    if (isMobile) {
        // Mobile: Lightweight loading indicator - no complex event handling
        if (!container.querySelector('.video-loading-state')) {
            window.mobileDebug(`⏳ Adding loading indicator for video ${index + 1}`);
            addSimpleLoadingIndicator(container);
        }
        
        const loadingState = container.querySelector('.video-loading-state');
        if (loadingState) {
            loadingState.style.display = 'flex';
            video.style.opacity = '0';
            window.mobileDebug(`🔄 Loading state visible, video hidden`);
        }
        
        // Simple ready handler without timeouts
        const handleVideoReady = () => {
            const loadTime = performance.now() - startTime;
            window.mobileDebug(`✅ Video ${index + 1} ready after ${loadTime.toFixed(1)}ms`);
            if (loadingState) {
                loadingState.style.display = 'none';
                video.style.opacity = '1';
                window.mobileDebug(`👁️ Video ${index + 1} now visible, loading hidden`);
            }
        };
        
        // Minimal event handling
        video.addEventListener('playing', () => {
            window.mobileDebug(`▶️ Video ${index + 1} started playing`);
            handleVideoReady();
        }, { once: true });
        
        video.addEventListener('error', (e) => {
            window.mobileDebug(`❌ Video ${index + 1} error: ${e.message || 'Unknown error'}`);
            handleVideoReady();
        }, { once: true });
        
        // Ensure we have a source element
        let sourceElement = video.querySelector('source');
        if (!sourceElement) {
            sourceElement = document.createElement('source');
            sourceElement.type = 'video/mp4';
            video.appendChild(sourceElement);
            window.mobileDebug(`📝 Created new source element for video ${index + 1}`);
        }
        sourceElement.src = videoSrc;
        
        window.mobileDebug(`⚡ Loading video ${index + 1}...`);
        video.load();
        setTimeout(() => {
            video.play().then(() => {
                window.mobileDebug(`🎬 Video ${index + 1} autoplay successful`);
            }).catch(error => {
                window.mobileDebug(`⚠️ Video ${index + 1} autoplay failed: ${error.message}`);
                handleVideoReady(); // Hide loading on autoplay failure
            });
        }, 100);
        
    } else {
        // Desktop: Full featured loading
        window.mobileDebug(`🖥️ Desktop video ${index + 1} loading`);
        video.style.opacity = '1';
        
        // Ensure we have a source element with the correct src
        let sourceElement = video.querySelector('source');
        if (!sourceElement) {
            sourceElement = document.createElement('source');
            sourceElement.type = 'video/mp4';
            video.appendChild(sourceElement);
            window.mobileDebug(`📝 Created new source element for desktop video ${index + 1}`);
        }
        sourceElement.src = videoSrc;
        
        // Only call load() if we actually modified the source
        const needsLoad = !video.querySelector('source') || video.querySelector('source').src !== videoSrc;
        if (needsLoad) {
            window.mobileDebug(`⚡ Loading desktop video ${index + 1}...`);
            video.load();
        } else {
            window.mobileDebug(`♻️ Desktop video ${index + 1} already loaded`);
        }
        
        video.play().then(() => {
            const loadTime = performance.now() - startTime;
            window.mobileDebug(`✅ Desktop video ${index + 1} started after ${loadTime.toFixed(1)}ms`);
        }).catch(error => {
            window.mobileDebug(`⚠️ Desktop autoplay failed for video ${index + 1}: ${error.message}`);
        });
    }
}

// Lazy load images
function loadImageLazily(img, index, slideIndex) {
    const startTime = performance.now();
    window.mobileDebug(`🖼️ loadImageLazily start: image ${index + 1}, slide ${slideIndex + 1}`);
    
    let imgSrc = img.getAttribute('data-src') || img.src;
    if (!imgSrc) {
        window.mobileDebug(`❌ No image source found for image ${index + 1}`);
        return;
    }
    
    const imageFileName = imgSrc.split('/').pop();
    window.mobileDebug(`� Loading image: ${imageFileName}`);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Mobile: Super simple - just show the image
        img.style.opacity = '1';
        if (img.getAttribute('data-src') && !img.src) {
            img.src = imgSrc;
            window.mobileDebug(`📱 Mobile image ${index + 1} source set`);
        }
        const loadTime = performance.now() - startTime;
        window.mobileDebug(`✅ Mobile image ${index + 1} loaded in ${loadTime.toFixed(1)}ms`);
    } else {
        // Desktop: Show image immediately
        img.style.opacity = '1';
        if (img.getAttribute('data-src') && !img.src) {
            img.src = imgSrc;
            window.mobileDebug(`🖥️ Desktop image ${index + 1} source set`);
        }
        const loadTime = performance.now() - startTime;
        window.mobileDebug(`✅ Desktop image ${index + 1} loaded in ${loadTime.toFixed(1)}ms`);
    }
}

// Smart cleanup function - only cleans videos that actually have sources loaded
function cleanupAllVideos() {
    const startTime = performance.now();
    window.mobileDebug(`🧹 cleanupAllVideos() called`);
    
    const videos = document.querySelectorAll('.sample-video');
    window.mobileDebug(`🎥 Scanning ${videos.length} videos for cleanup...`);
    
    let cleanedCount = 0;
    let skippedCount = 0;
    
    videos.forEach((video, index) => {
        if (video.tagName.toLowerCase() === 'video') {
            // Smart detection - check if video actually has content loaded
            const hasSrc = video.src && video.src !== '';
            const hasSources = video.querySelectorAll('source').length > 0;
            const hasOriginalSrc = video.getAttribute('data-original-src');
            const container = video.closest('.sample-video-container');
            const hasLoadingIndicator = container?.querySelector('.video-loading-state');
            
            // Only cleanup if video has loaded content or is in loading state
            const needsCleanup = hasSrc || hasSources || hasOriginalSrc || hasLoadingIndicator;
            
            if (needsCleanup) {
                const videoSrc = video.src || (video.querySelector('source') ? video.querySelector('source').src : 'no-source');
                const fileName = videoSrc.split('/').pop();
                
                // Pause and reset
                video.pause();
                video.currentTime = 0;
                window.mobileDebug(`⏸️ Video ${index + 1} (${fileName}) paused and reset`);
                
                // Store the original source in data-original-src before removing
                const existingSource = video.querySelector('source');
                if (existingSource && existingSource.src && !video.getAttribute('data-original-src')) {
                    video.setAttribute('data-original-src', existingSource.src);
                    window.mobileDebug(`💾 Stored original source for video ${index + 1}`);
                }
                
                // Remove all source elements
                const sources = video.querySelectorAll('source');
                sources.forEach(source => source.remove());
                window.mobileDebug(`🗑️ Removed ${sources.length} source elements from video ${index + 1}`);
                
                // Clear src attribute
                video.src = '';
                video.removeAttribute('src');
                
                // Reset opacity
                video.style.opacity = '1';
                
                // Remove loading indicators
                if (hasLoadingIndicator) {
                    hasLoadingIndicator.remove();
                    window.mobileDebug(`🗑️ Removed loading indicator for video ${index + 1}`);
                }
                
                cleanedCount++;
                window.mobileDebug(`🧹 Cleaned up video ${index + 1}`);
            } else {
                // Skip videos that don't need cleanup
                window.mobileDebug(`⏭️ Video ${index + 1} skipped (no content loaded)`);
                skippedCount++;
            }
        }
    });
    
    const cleanupTime = performance.now() - startTime;
    window.mobileDebug(`✅ Smart cleanup: ${cleanedCount} cleaned, ${skippedCount} skipped in ${cleanupTime.toFixed(1)}ms`);
}

// Add simple loading indicator for containers that don't have one
function addSimpleLoadingIndicator(container) {
    const loadingState = document.createElement('div');
    loadingState.className = 'video-loading-state';
    loadingState.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        border-radius: 12px;
        z-index: 10;
        cursor: pointer;
    `;
    
    loadingState.innerHTML = `
        <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            border-top: 2px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 8px;
        "></div>
        <div class="loading-text" style="
            color: white;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            margin-top: 4px;
        ">Loading...</div>
    `;
    
    // Add click handler for manual video start if autoplay fails
    loadingState.addEventListener('click', function() {
        const video = container.querySelector('.sample-video');
        if (video && video.tagName.toLowerCase() === 'video') {
            video.play().then(() => {
                // Video started successfully - 'playing' event will handle hiding loader
            }).catch(error => {
                console.warn('Manual video play failed:', error);
                // Update loading text to show it's a click-to-play situation
                const loadingText = loadingState.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = 'Tap to play';
                }
            });
        }
    });
    
    container.style.position = 'relative';
    container.appendChild(loadingState);
}

// Add a subtle play indicator for mobile when autoplay fails
function addMobilePlayIndicator(video) {
    const container = video.closest('.sample-video-container');
    if (!container.querySelector('.mobile-play-hint')) {
        const hint = document.createElement('div');
        hint.className = 'mobile-play-hint';
        hint.innerHTML = '<span>Tap to play</span>';
        hint.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 10;
            pointer-events: none;
        `;
        container.style.position = 'relative';
        container.appendChild(hint);
        
        // Add click handler to video
        video.addEventListener('click', function() {
            this.play();
            hint.remove();
        });
        
        // Remove hint after a few seconds
        setTimeout(() => {
            if (hint.parentNode) hint.remove();
        }, 5000);
    }
}

// Tab Switching Functionality
document.addEventListener('DOMContentLoaded', function() {
    initTabSwitching();
});

function initTabSwitching() {
    // Handle each slide's tabs independently
    const slides = document.querySelectorAll('.carousel-slide');
    
    slides.forEach((slide, slideIndex) => {
        const tabButtons = slide.querySelectorAll('.tab-button');
        const videoItems = slide.querySelectorAll('.video-item');
        const arrowsOverlay = slide.querySelector('.tab-arrows-overlay');
        
        if (tabButtons.length === 0) return; // Skip slides without tabs
        
        // Initialize default state - make sure desktop tab is active and mobile is not
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === 'desktop') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        videoItems.forEach(item => {
            if (item.getAttribute('data-content') === 'desktop') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Reset arrow overlay to default state
        if (arrowsOverlay) {
            arrowsOverlay.classList.remove('tab-arrows-mobile-active');
        }
        
        tabButtons.forEach(button => {
            // Essential fixes for button functionality (no visual debugging)
            button.style.position = 'relative';
            button.style.zIndex = '1000';
            
            // Remove any existing click listeners to prevent duplicates
            const oldHandler = button._samplesClickHandler;
            if (oldHandler) {
                button.removeEventListener('click', oldHandler);
            }
            
            // Create new click handler
            const clickHandler = function(e) {
                const targetTab = this.getAttribute('data-tab');
                const slideId = slide.id;
                window.mobileDebug(`🔄 Tab switch in ${slideId}: → ${targetTab}`);
                
                // Remove active class from buttons and items ONLY in this slide
                tabButtons.forEach(btn => btn.classList.remove('active'));
                videoItems.forEach(item => item.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                window.mobileDebug(`✅ ${targetTab} tab now active in ${slideId}`);
                
                // Update arrow colors based on active button for this slide only
                if (arrowsOverlay) {
                    if (targetTab === 'mobile') {
                        arrowsOverlay.classList.add('tab-arrows-mobile-active');
                    } else {
                        arrowsOverlay.classList.remove('tab-arrows-mobile-active');
                    }
                }
                
                // Show corresponding content ONLY within this slide
                const targetContent = slide.querySelector(`[data-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    window.mobileDebug(`👁️ ${targetTab} content now visible in ${slideId}`);
                    
                    // Stop all videos in this slide first
                    const allVideosInSlide = slide.querySelectorAll('.sample-video');
                    window.mobileDebug(`⏸️ Stopping ${allVideosInSlide.length} videos in ${slideId} before tab switch`);
                    allVideosInSlide.forEach((video, index) => {
                        if (video.tagName.toLowerCase() === 'video') {
                            video.pause();
                            video.currentTime = 0;
                            window.mobileDebug(`⏸️ Stopped video ${index + 1} in ${slideId}`);
                        }
                    });
                    
                    // Start videos only in the new active tab content
                    setTimeout(() => {
                        window.mobileDebug(`🎬 Starting videos for ${targetTab} tab in ${slideId} after 50ms delay`);
                        const newTabVideos = targetContent.querySelectorAll('.sample-video');
                        window.mobileDebug(`🎥 Found ${newTabVideos.length} videos in new ${targetTab} tab`);
                        
                        newTabVideos.forEach((video, index) => {
                            if (video.tagName.toLowerCase() === 'video') {
                                // Get current slide index for proper logging
                                const allSlides = Array.from(document.querySelectorAll('.carousel-slide'));
                                const slideIndex = allSlides.indexOf(slide);
                                window.mobileDebug(`📹 Loading video ${index + 1} for ${targetTab} tab`);
                                loadVideoLazily(video, index, slideIndex);
                            } else if (video.tagName.toLowerCase() === 'img') {
                                // Get current slide index for proper logging
                                const allSlides = Array.from(document.querySelectorAll('.carousel-slide'));
                                const slideIndex = allSlides.indexOf(slide);
                                window.mobileDebug(`🖼️ Loading image ${index + 1} for ${targetTab} tab`);
                                loadImageLazily(video, index, slideIndex);
                            }
                        });
                    }, 50); // Reduced from 100ms to 50ms for faster tab switching
                    
                    // iOS Safari viewport fix for tab switching
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    if (isIOS) {
                        // Force a viewport recalculation to fix scroll boundaries
                        setTimeout(() => {
                            const currentScrollTop = window.scrollY;
                            document.body.style.height = 'auto';
                            window.scrollTo(0, currentScrollTop);
                            
                            // Additional fix: trigger a resize event
                            window.dispatchEvent(new Event('resize'));
                        }, 100);
                    }
                }
                
                console.log(`🔄 Switched to ${targetTab} tab in slide ${slide.id}`);
            };
            
            // Store reference to handler for cleanup and add listener
            button._samplesClickHandler = clickHandler;
            button.addEventListener('click', clickHandler);
        });
    });
}

// Simple Carousel Functionality
function initSimpleCarousel() {
    // Clean up any existing carousel listeners first
    if (window.carouselClickHandler) {
        document.removeEventListener('click', window.carouselClickHandler);
    }
    
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let isInitialLoad = true; // Track if this is the first slide load
    
    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        
        // Show current slide
        slides[index].classList.add('active');
        
        // Reset tabs to default state for the newly active slide
        const activeSlide = slides[index];
        if (activeSlide) {
            const tabButtons = activeSlide.querySelectorAll('.tab-button');
            const videoItems = activeSlide.querySelectorAll('.video-item');
            const arrowsOverlay = activeSlide.querySelector('.tab-arrows-overlay');
            
            // Reset to desktop tab active by default
            tabButtons.forEach(btn => {
                if (btn.getAttribute('data-tab') === 'desktop') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            videoItems.forEach(item => {
                if (item.getAttribute('data-content') === 'desktop') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Reset arrow overlay
            if (arrowsOverlay) {
                arrowsOverlay.classList.remove('tab-arrows-mobile-active');
            }
        }
        
        // Update all indicators across all slides based on data-slide attribute
        document.querySelectorAll('.indicator').forEach((indicator) => {
            const indicatorSlide = parseInt(indicator.getAttribute('data-slide'));
            const currentSlideNumber = index + 1; // Convert 0-based index to 1-based slide number
            indicator.classList.toggle('active', indicatorSlide === currentSlideNumber);
        });
        
        console.log(`📖 Showing slide ${index + 1}`);
        window.mobileDebug(`🎠 Slide transition: ${currentSlide} → ${index + 1}`);
        
        // Only cleanup videos if this is NOT the initial load
        // This prevents the flash on page load while maintaining clean transitions
        if (!isInitialLoad) {
            window.mobileDebug(`🧽 Cleaning up videos before slide ${index + 1}`);
            cleanupAllVideos();
        } else {
            window.mobileDebug(`🚀 Initial load - skipping cleanup for slide ${index + 1}`);
        }
        
        // Start videos only for the new active slide after a brief delay
        setTimeout(() => {
            window.mobileDebug(`⏰ Starting video load for slide ${index + 1} after 100ms delay`);
            playVideosForCurrentSlide(index);
            isInitialLoad = false; // After first load, subsequent slides will need cleanup
        }, 100);
        
        // iOS Safari viewport fix for slide 4 - prevent scroll boundary issues
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && index === 3) { // Slide 4 (0-based index 3)
            setTimeout(() => {
                const currentScrollTop = window.scrollY;
                document.body.style.height = 'auto';
                window.scrollTo(0, currentScrollTop);
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    }
    
    // Create a named function for the click handler so we can remove it later
    window.carouselClickHandler = function(e) {
        // Next slide buttons - use class-based detection for scalability
        if (e.target.closest('.carousel-arrow.right-arrow')) {
            if (currentSlide < slides.length - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        }
        
        // Previous slide buttons - use class-based detection for scalability
        if (e.target.closest('.carousel-arrow.left-arrow')) {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        }
        
        // Indicator clicks
        if (e.target.classList.contains('indicator')) {
            const slideIndex = parseInt(e.target.getAttribute('data-slide')) - 1;
            currentSlide = slideIndex;
            showSlide(currentSlide);
        }
    };
    
    // Add click handlers to all navigation buttons
    document.addEventListener('click', window.carouselClickHandler);
    
    // Initialize
    showSlide(0);
    console.log('🎠 Simple carousel initialized');
}

// Function to go back to My Websites page
function goBackToMyWebsites() {
    // Determine the correct My Websites page based on device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent);
    const myWebsitesPage = (isMobile && !isTablet) ? 'my-websites-mobile.html' : 'my-websites-desktop.html';
    
    window.location.href = myWebsitesPage;
}

// Initialize clickable sample videos with Visit Site buttons
function initClickableVideos() {
    console.log('🔗 Initializing clickable sample videos');
    
    // Get all video containers
    const videoContainers = document.querySelectorAll('.sample-video-container');
    console.log(`🎥 Found ${videoContainers.length} video containers`);
    
    videoContainers.forEach((container, index) => {
        // Find the video or image element inside
        const mediaElement = container.querySelector('.sample-video');
        
        if (!mediaElement) {
            console.warn(`⚠️ No media element found in container ${index + 1}`);
            return;
        }
        
        // Determine the URL based on filename
        let videoUrl = null;
        
        if (mediaElement.tagName.toLowerCase() === 'video') {
            // For video elements, check source or data-src attributes
            const source = mediaElement.querySelector('source');
            const videoSrc = source ? source.src : 
                            mediaElement.getAttribute('data-src') || 
                            mediaElement.getAttribute('data-original-src') ||
                            mediaElement.src;
            
            if (videoSrc) {
                const filename = videoSrc.split('/').pop().toLowerCase();
                
                if (filename.includes('-m-')) {
                    videoUrl = 'https://www.mickealfreeland.com';
                } else if (filename.includes('-r-')) {
                    videoUrl = 'https://www.ryanbgates.com';
                }
            }
        } else if (mediaElement.tagName.toLowerCase() === 'img') {
            // For image elements
            const imgSrc = mediaElement.getAttribute('data-src') || mediaElement.src;
            
            if (imgSrc) {
                const filename = imgSrc.split('/').pop().toLowerCase();
                
                if (filename.includes('-m-')) {
                    videoUrl = 'https://www.mickealfreeland.com';
                } else if (filename.includes('-r-')) {
                    videoUrl = 'https://www.ryanbgates.com';
                }
            }
        }
        
        if (videoUrl) {
            console.log(`✅ Container ${index + 1} linked to: ${videoUrl}`);
            
            // Add Visit Site button
            const button = document.createElement('button');
            button.className = 'visit-site-btn';
            button.textContent = 'Visit Site';
            button.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🌐 Opening: ${videoUrl}`);
                window.open(videoUrl, '_blank');
            };
            
            container.appendChild(button);
        } else {
            console.warn(`⚠️ Could not determine URL for container ${index + 1}`);
        }
    });
    
    console.log('✅ Clickable videos initialized');
}

// Call initClickableVideos after page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for videos to be set up, then add buttons
    setTimeout(initClickableVideos, 1000);
});