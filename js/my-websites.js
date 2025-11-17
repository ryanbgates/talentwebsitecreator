// My Websites Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 My Websites DOM loaded - starting initialization');
    
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
        debugContent.innerHTML = 'My Websites Debug Log:<br>=================<br>';
        
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
        window.PageUtils.initPage('my-websites', () => {
            // Custom initialization after header is set up
            initMyWebsitesCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initMyWebsitesPageFallback();
    }
});

// Custom initialization function called after header setup
function initMyWebsitesCustom() {
    // Wait a moment for header animation to complete before starting auth check
    setTimeout(() => {
        // Check for pending website first (synchronously check localStorage)
        const hasPendingWebsite = localStorage.getItem('pendingWebsite');
        
        if (hasPendingWebsite) {
            // If there's a pending website, handle the special flow
            waitForAuthAndShowMyWebsites(true); // Pass flag to skip normal page show
        } else {
            // Normal flow
            waitForAuthAndShowMyWebsites(false);
        }
        
        // Initialize page functionality
        initPageControls();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initMyWebsitesPageFallback() {
    console.log('My Websites Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('my-websites');
        }
    }, 300);
}

// Wait for authentication to be ready, then show page
async function waitForAuthAndShowMyWebsites(skipNormalShow = false) {
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
        showPageWithFallback();
        return;
    }
    
    // Wait for user authentication state
    const user = await waitForAuthenticatedUser();
    
    if (user) {
        console.log('✅ User authenticated, loading websites');
        await loadUserWebsites(user);
        
        if (skipNormalShow) {
            // Handle pending website purchase (will show page after form setup)
            console.log('🎯 Skipping normal page show - handling pending website');
            await checkAndCreatePendingWebsite();
        } else {
            // Check if there's a pending edit before showing the page
            const hasPendingEdit = sessionStorage.getItem('pendingEditWebsite');
            
            if (hasPendingEdit) {
                // Keep loading screen visible and directly open the form
                console.log('🎯 Pending edit found - keeping loading screen and opening form');
                await checkAndOpenPendingEdit();
            } else {
                // Normal flow - show page immediately
                showMyWebsitesPage();
            }
        }
    } else {
        console.log('❌ User not authenticated, redirecting...');
        // If user is not authenticated on my-websites page, redirect to landing
        if (typeof window.FirebaseAuth !== 'undefined' && window.FirebaseAuth.redirectToLanding) {
            window.FirebaseAuth.redirectToLanding();
        }
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
            console.log('🔄 Auth state changed in my-websites:', user ? 'User logged in' : 'User logged out');
            clearTimeout(timeoutId);
            unsubscribe(); // Clean up listener
            resolve(user);
        });
        
        // Timeout after 3 seconds
        timeoutId = setTimeout(() => {
            console.log('⏰ Auth state timeout in my-websites');
            unsubscribe();
            resolve(null);
        }, 3000);
    });
}

// Load user's websites from Firebase
async function loadUserWebsites(user) {
    console.log('📁 Loading websites for user:', user.email);
    
    try {
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            console.error('❌ Database not available');
            return [];
        }
        
        const websites = [];
        let purchasedWebsites = {};
        
        // 1. Load purchased websites from users/{uid}/websites (from checkout)
        const userDoc = await db.collection('users').doc(user.uid).get();
        console.log('🔍 Checking user document:', user.uid, 'exists:', userDoc.exists);
        if (userDoc.exists) {
            const userData = userDoc.data();
            purchasedWebsites = userData.websites || {};
            console.log('🔍 Found websites in user data:', Object.keys(purchasedWebsites));
            
            // Convert map to array of websites
            Object.entries(purchasedWebsites).forEach(([websiteName, websiteData]) => {
                console.log('🔍 Processing website:', websiteName, 'status:', websiteData.status);
                const websiteObj = {
                    id: websiteData.websiteId || `website_${websiteName}`,
                    type: 'purchased',
                    websiteName: websiteName,
                    depositPaid: websiteData.depositPaid,
                    finalPaymentPaid: websiteData.finalPaymentPaid,
                    status: websiteData.status || 'awaiting-info',
                    services: websiteData.services,
                    subscriptionId: websiteData.subscriptionId,
                    createdAt: websiteData.createdAt,
                    data: websiteData
                };
                
                // Check if this website has form progress stored directly in it
                if (websiteData.formProgress) {
                    websiteObj.formProgress = {
                        currentStep: websiteData.formProgress.currentStep || 1,
                        totalSteps: 10,
                        formData: websiteData.formProgress
                    };
                    websiteObj.hasFormProgress = true;
                    console.log('🔗 Found form progress in website data:', websiteName);
                }
                
                websites.push(websiteObj);
                console.log('💰 Found purchased website:', websiteName, 'status:', websiteObj.status);
            });
        } else {
            console.log('❌ User document does not exist');
        }
        
        // Note: websiteFormProgress collection is now deprecated
        // Form progress is stored directly in users/{uid}/websites/{websiteName}/formProgress
        
        // Load completed/submitted websites from websiteRequests
        const requestDoc = await db.collection('websiteRequests').doc(user.uid).get();
        if (requestDoc.exists) {
            const data = requestDoc.data();
            websites.push({
                id: user.uid + '_submitted',
                type: 'submitted',
                submittedAt: data.submittedAt,
                status: data.status || 'submitted',
                data: data
            });
            console.log('✅ Found submitted website:', data);
        }
        
        console.log(`📊 Total websites found: ${websites.length}`);
        
        // Display the websites
        displayWebsites(websites);
        
        return websites;
    } catch (error) {
        console.error('❌ Error loading websites:', error);
        return [];
    }
}

// Display websites in the container
function displayWebsites(websites) {
    const websitesGrid = document.querySelector('.websites-grid') || document.querySelector('.websites-list');
    const noWebsitesMessage = document.querySelector('.no-websites-message');
    
    if (!websitesGrid) {
        console.error('❌ websites-grid container not found');
        return;
    }
    
    // Check if there's an in-progress form
    const hasInProgressForm = websites.some(w => w.type === 'in-progress');
    
    // Update the "Start New Site" button state
    updateStartNewSiteButton(hasInProgressForm);
    
    // If no websites, show the "no websites" message
    if (websites.length === 0) {
        if (noWebsitesMessage) {
            noWebsitesMessage.style.display = 'block';
        }
        console.log('ℹ️ No websites to display');
        return;
    }
    
    // Hide the "no websites" message
    if (noWebsitesMessage) {
        noWebsitesMessage.style.display = 'none';
    }
    
    // Sort websites by creation date (newest first)
    const sortedWebsites = [...websites].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA; // Descending order (newest first)
    });
    
    // Clear existing content (except the message)
    const existingCards = websitesGrid.querySelectorAll('.website-card');
    existingCards.forEach(card => card.remove());
    
    // Create a card for each website (now sorted)
    sortedWebsites.forEach(website => {
        const card = createWebsiteCard(website);
        websitesGrid.appendChild(card);
    });
    
    console.log(`✅ Displayed ${sortedWebsites.length} website(s) (sorted by newest first)`);
}

// Update the "Start New Site" button state based on in-progress forms
function updateStartNewSiteButton(hasInProgressForm) {
    // Find all "Start New Site" buttons (both old and new class names)
    const startButtons = document.querySelectorAll('.btn-primary, .btn-start-new');
    
    startButtons.forEach(button => {
        // Check if this is the "Start New Site" button by its text content
        if (button.textContent.trim().toUpperCase().includes('START NEW SITE')) {
            if (hasInProgressForm) {
                // Disable the button
                button.disabled = true;
                button.classList.add('disabled');
                console.log('🔒 Start New Site button disabled - in-progress form exists');
            } else {
                // Enable the button
                button.disabled = false;
                button.classList.remove('disabled');
                console.log('🔓 Start New Site button enabled - no in-progress forms');
            }
        }
    });
}

// Get service plan text for display
function getServicePlanText(website) {
    const services = website.services || {};
    
    // Check which services are active
    const hasUpdates = services.updates === true;
    const hasHosting = services.hosting === true;
    const hasComplete = services.complete === true;
    
    // Determine the plan text based on service combination
    if (hasComplete) {
        return '(plan: unlimited edits and server hosting)';
    } else if (hasUpdates && hasHosting) {
        return '(plan: unlimited edits and server hosting)';
    } else if (hasUpdates) {
        return '(plan: unlimited edits)';
    } else if (hasHosting) {
        return '(plan: server hosting)';
    } else {
        return '(no service plans applied)';
    }
}

// Create a website card element
function createWebsiteCard(website) {
    const card = document.createElement('div');
    card.className = 'website-card';
    card.setAttribute('data-website-id', website.id);
    
    // Determine website name/title
    let title = 'Untitled Website';
    let dateSubtitle = '';
    
    // For purchased websites, use the website name
    if (website.type === 'purchased' && website.websiteName) {
        title = website.websiteName;
        if (website.createdAt && website.createdAt.toDate) {
            const date = website.createdAt.toDate();
            dateSubtitle = 'Purchased ' + formatRelativeTime(date);
        } else {
            dateSubtitle = 'Recently purchased';
        }
    } else {
        // For form progress, check if we have a domain name
        const domain = website.data?.domain;
        if (domain && domain.trim() && domain.toLowerCase() !== 'need one') {
            title = domain;
        }
        
        if (website.type === 'in-progress') {
            if (website.createdAt && website.createdAt.toDate) {
                const date = website.createdAt.toDate();
                if (title === 'Untitled Website') {
                    title = formatDateTime(date);
                }
                dateSubtitle = 'Started ' + formatRelativeTime(date);
            } else if (website.lastUpdated && website.lastUpdated.toDate) {
                const date = website.lastUpdated.toDate();
                if (title === 'Untitled Website') {
                    title = formatDateTime(date);
                }
                dateSubtitle = 'Last updated ' + formatRelativeTime(date);
            }
        } else if (website.type === 'submitted') {
            if (website.submittedAt) {
                const date = new Date(website.submittedAt);
                if (title === 'Untitled Website') {
                    title = formatDateTime(date);
                }
                dateSubtitle = 'Submitted ' + formatRelativeTime(date);
            }
        }
    }
    
    // Check if website is complete
    const isComplete = website.status === 'complete';
    
    // Check if website is in editing mode
    const isEditing = website.status === 'editing';
    
    // Check if website edits have been submitted
    const isEdited = website.status === 'edited';
    
    // Determine milestones based on website status
    const milestones = getMilestones(website);
    
    // Check if currently building to add message
    const isBuilding = website.status === 'building';
    const buildingMessage = isBuilding ? `
        <div class="building-message">
            <p>Your website is being built! It will be ready for your approval in 2-5 business days. Check back soon.</p>
        </div>
    ` : '';
    
    // Check if preview is ready to add message
    const isPreview = website.status === 'preview';
    const previewMessage = isPreview ? `
        <div class="preview-message">
            <p><strong>Your preview is ready!</strong> We've emailed you a link to view your website preview. Once you've reviewed it and are happy with the design, click "Approve Preview" below to proceed to final payment and launch.</p>
        </div>
    ` : '';
    
    // Check if awaiting final payment to add message
    const isAwaitingFinalPayment = website.status === 'awaiting-final-payment';
    const paymentMessage = isAwaitingFinalPayment ? `
        <div class="payment-message">
            <p><strong>Ready to launch!</strong> Click "Make Final Payment" below to complete your payment and begin the launch process for your website!</p>
        </div>
    ` : '';
    
    // Check if finalizing to add message
    const isFinalizing = website.status === 'finalizing';
    const finalizingMessage = isFinalizing ? `
        <div class="finalizing-message">
            <p>Please give us up to 24 hours to make your website live! Check back here for updates or visit your website's URL to see if your site is live!</p>
        </div>
    ` : '';
    
    // Build milestone checkboxes HTML with messages integrated
    const milestonesHTML = `
        <div class="website-milestones">
            ${milestones.map((m, index) => {
                // For "Website Building" milestone when it's current, add animated dots
                const isWebsiteBuilding = index === 2 && m.current && isBuilding;
                // For "Preview & Approval" milestone when it's current, add animated dots
                const isWebsitePreview = index === 3 && m.current && isPreview;
                // For "Final Payment" milestone when it's current, add animated dots
                const isWebsiteAwaitingPayment = index === 4 && m.current && isAwaitingFinalPayment;
                // For "Website Complete" milestone when finalizing, add animated dots
                const isWebsiteFinalizing = index === 5 && m.current && isFinalizing;
                
                const labelClass = (isWebsiteBuilding || isWebsitePreview || isWebsiteAwaitingPayment || isWebsiteFinalizing) ? 'milestone-label building-dots' : 'milestone-label';
                let labelText = m.label;
                if (isWebsiteBuilding) {
                    labelText = 'Website Building In Progress';
                } else if (isWebsitePreview) {
                    labelText = 'Preview & Approval';
                } else if (isWebsiteAwaitingPayment) {
                    labelText = 'Final Payment';
                } else if (isWebsiteFinalizing) {
                    labelText = 'Finalizing Website';
                }
                
                // Add message directly after the specific milestone
                let milestoneMessage = '';
                if (index === 2 && m.current && isBuilding) {
                    // Building message after "Website Building" milestone
                    milestoneMessage = buildingMessage;
                } else if (index === 3 && m.current && isPreview) {
                    // Preview message after "Preview & Approval" milestone
                    milestoneMessage = previewMessage;
                } else if (index === 4 && m.current && isAwaitingFinalPayment) {
                    // Payment message after "Final Payment" milestone
                    milestoneMessage = paymentMessage;
                } else if (index === 5 && m.current && isFinalizing) {
                    // Finalizing message after "Website Complete" milestone
                    milestoneMessage = finalizingMessage;
                }
                
                // Determine the icon to show
                let checkboxContent;
                if (m.completed) {
                    checkboxContent = '✓';
                } else if (m.current) {
                    // Hourglass SVG with rotation animation for current step
                    checkboxContent = `
                        <svg class="hourglass-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path class="hourglass-top" d="M6 2h12v6.5L12 12 6 8.5z" fill="currentColor"/>
                            <path class="hourglass-bottom" d="M6 22h12v-6.5L12 12 6 15.5z" fill="currentColor"/>
                            <path class="hourglass-frame" d="M6 2h12v1H6zm0 19h12v1H6z" fill="currentColor"/>
                            <circle class="sand-particle" cx="12" cy="13" r="0.5" fill="currentColor"/>
                            <circle class="sand-particle" cx="11" cy="14" r="0.5" fill="currentColor"/>
                            <circle class="sand-particle" cx="13" cy="14" r="0.5" fill="currentColor"/>
                        </svg>
                    `;
                } else {
                    checkboxContent = '○';
                }
                
                return `
                    <div class="milestone ${m.completed ? 'completed' : ''} ${m.current ? 'current' : ''}">
                        <span class="milestone-checkbox">${checkboxContent}</span>
                        <span class="${labelClass}">${labelText}</span>
                    </div>
                    ${milestoneMessage}
                `;
            }).join('')}
        </div>
    `;
    
    // Determine primary action button
    let actionButton = '';
    if (website.type === 'purchased') {
        const status = website.status || 'awaiting-info';
        
        // Prioritize status-based buttons over form progress
        if (status === 'preview') {
            actionButton = `<button class="btn-continue" onclick="approvePreview('${website.id}')">Approve Preview</button>`;
        } else if (status === 'building') {
            // No button during building - users just see progress
            actionButton = '';
        } else if (status === 'finalizing') {
            // No button during finalizing - users just see progress
            actionButton = '';
        } else if (status === 'awaiting-final-payment') {
            actionButton = `<button class="btn-primary" onclick="makeFinalPayment('${website.id}', event)">Make Final Payment</button>`;
        } else if (status === 'complete') {
            // Only show "Edit Your Website" when website is fully complete
            // Use websiteName (not id) since editWebsiteInfo needs the website name to lookup in Firebase
            actionButton = `<button class="btn-view" onclick="editWebsiteInfo('${website.websiteName}', event)">Edit Your Website</button>`;
        } else if (status === 'editing') {
            // Website is in editing mode - show "Complete Edits" button (no confirmation needed)
            actionButton = `<button class="btn-view" onclick="completeEditsDirectly('${website.websiteName}')">Complete Edits</button>`;
        } else if (status === 'awaiting-info') {
            // Check if form is in progress
            if (website.hasFormProgress) {
                const onLastStep = website.formProgress.currentStep >= website.formProgress.totalSteps;
                if (onLastStep) {
                    // On last step - show submit button
                    actionButton = `<button class="btn-continue" onclick="continueWebsite('${website.id}')">Submit Creation Form</button>`;
                } else {
                    // Form in progress - allow continuing
                    actionButton = `<button class="btn-continue" onclick="continueWebsite('${website.id}')">Complete Creation Form</button>`;
                }
            } else {
                // No progress yet - show initial button
                actionButton = `<button class="btn-continue" onclick="continueWebsite('${website.id}')">Complete Creation Form</button>`;
            }
        }
    } else if (website.type === 'in-progress') {
        actionButton = `<button class="btn-continue" onclick="continueWebsite('${website.id}')">Continue Form</button>`;
    } else if (website.type === 'submitted') {
        actionButton = `<button class="btn-view" onclick="viewWebsite('${website.id}')">View Details</button>`;
    }
    
    // Get service plan text
    const servicePlanText = getServicePlanText(website);
    
    // Check if delete button should be shown (only for complete status)
    const showDeleteButton = website.status === 'complete';
    
    // Build the card HTML
    card.innerHTML = `
        <div class="website-card-header">
            <h3 class="website-title">${title}</h3>
            ${showDeleteButton ? `<button class="btn-delete-icon-corner" onclick="showDeleteWebsiteModal('${website.websiteName}')" title="Delete Website">🗑️</button>` : ''}
        </div>
        <p class="website-plan">${servicePlanText}</p>
        <p class="website-date">${dateSubtitle}</p>
        ${isComplete ? `
            <div class="website-active-message">
                <div class="active-icon">✓</div>
                <p class="active-text">Website Updated and Online</p>
            </div>
        ` : isEditing ? `
            <div class="website-active-message editing-message">
                <div class="active-icon">✏️</div>
                <p class="active-text">You have not completed your edits. Click "Complete Edits" below and submit your edits.</p>
            </div>
        ` : isEdited ? `
            <div class="website-active-message edited-message">
                <div class="active-icon">
                    <svg class="hourglass-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="hourglass-top" d="M6 2h12v6.5L12 12 6 8.5z" fill="currentColor"/>
                        <path class="hourglass-bottom" d="M6 22h12v-6.5L12 12 6 15.5z" fill="currentColor"/>
                        <path class="hourglass-frame" d="M6 2h12v1H6zm0 19h12v1H6z" fill="currentColor"/>
                        <circle class="sand-particle" cx="12" cy="13" r="0.5" fill="currentColor"/>
                        <circle class="sand-particle" cx="11" cy="14" r="0.5" fill="currentColor"/>
                        <circle class="sand-particle" cx="13" cy="14" r="0.5" fill="currentColor"/>
                    </svg>
                </div>
                <p class="active-text">Your edits are being applied! Please allow 24-48 hours for us to update your website. Check back soon for updates!</p>
            </div>
        ` : milestonesHTML}
        <div class="website-actions">
            ${actionButton}
        </div>
    `;
    
    return card;
}

// Get milestones for a website based on its current status
function getMilestones(website) {
    const milestones = [
        { label: 'Website Deposit', completed: false, current: false },
        { label: 'Submit Your Creation Form', completed: false, current: false },
        { label: 'Website Building', completed: false, current: false },
        { label: 'Preview & Approval', completed: false, current: false },
        { label: 'Final Payment', completed: false, current: false },
        { label: 'Website Complete', completed: false, current: false }
    ];
    
    if (website.type === 'purchased') {
        // Deposit is always paid if they have a purchased website
        milestones[0].completed = website.depositPaid || true;
        
        // Check if form has been submitted
        // Form is only complete when status changes from 'awaiting-info' to 'building'
        const formSubmitted = website.status && website.status !== 'awaiting-info';
        if (formSubmitted) {
            milestones[1].completed = true;
        }
        
        // Check status progression and mark current step
        const status = website.status || 'awaiting-info';
        
        if (status === 'awaiting-info') {
            // Currently on Information Form step
            milestones[1].current = true;
        } else if (status === 'building') {
            // Form submitted and now building
            milestones[1].completed = true;
            milestones[2].current = true;
        } else if (status === 'preview') {
            milestones[1].completed = true;
            milestones[2].completed = true;
            // Currently on Preview & Approval
            milestones[3].current = true;
        } else if (status === 'awaiting-final-payment') {
            milestones[1].completed = true;
            milestones[2].completed = true;
            milestones[3].completed = true;
            // Currently on Final Payment
            milestones[4].current = true;
        } else if (status === 'finalizing') {
            // Final payment complete, now finalizing
            milestones[1].completed = true;
            milestones[2].completed = true;
            milestones[3].completed = true;
            milestones[4].completed = true;
            // Currently on Website Complete (finalizing)
            milestones[5].current = true;
        } else if (status === 'complete') {
            // All completed
            milestones.forEach(m => m.completed = true);
        } else if (status === 'editing') {
            // Website is complete but user is editing info
            // Show all milestones as completed (since website was already complete)
            milestones.forEach(m => m.completed = true);
        }
    } else if (website.type === 'in-progress') {
        // Form in progress - only deposit completed
        milestones[0].completed = true;
        milestones[1].current = true; // Currently on form
    } else if (website.type === 'submitted') {
        // Form submitted - deposit and form completed
        milestones[0].completed = true;
        milestones[1].completed = true;
        milestones[2].current = true; // Waiting for building
    }
    
    return milestones;
}

// Format date/time as title (e.g., "March 15, 2024 at 2:30 PM")
function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-US', options);
}

// Format relative time (e.g., "2 hours ago", "3 days ago")
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

// Continue working on an in-progress website
async function continueWebsite(websiteIdentifier) {
    console.log('▶️ Continue website:', websiteIdentifier);
    
    const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
    if (!user) return;
    
    const db = window.FirebaseServices ? window.FirebaseServices.db : null;
    if (!db) return;
    
    // Load user data to find the website name
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
        console.error('❌ User document not found');
        return;
    }
    
    const userData = userDoc.data();
    const websites = userData.websites || {};
    
    let websiteName = null;
    
    // Check if websiteIdentifier is already a website name (starts with www.)
    if (websiteIdentifier.startsWith('www.')) {
        // It's already a website name
        websiteName = websiteIdentifier;
        console.log('✅ Using website name directly:', websiteName);
    } else {
        // It's a website ID, need to look it up
        console.log('🔍 Looking up website by ID:', websiteIdentifier);
        for (const [name, data] of Object.entries(websites)) {
            if (data.websiteId === websiteIdentifier || `website_${name}` === websiteIdentifier) {
                websiteName = name;
                break;
            }
        }
    }
    
    if (!websiteName) {
        console.error('❌ Website name not found for identifier:', websiteIdentifier);
        return;
    }
    
    // Verify the website exists in the user's websites
    if (!websites[websiteName]) {
        console.error('❌ Website not found in user data:', websiteName);
        return;
    }
    
    // Set the current editing website
    currentEditingWebsite = websiteName;
    console.log(`📝 Set current editing website to: ${currentEditingWebsite}`);
    
    // Directly open the setup form
    const defaultView = document.getElementById('myWebsitesDefault');
    const setupView = document.getElementById('myWebsitesSetup');
    
    if (defaultView && setupView) {
        // Prevent body scrolling FIRST, before any visual changes (mobile only)
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            // Force browser to commit the style immediately (prevents race condition)
            void document.body.offsetHeight;
        }
        
        defaultView.style.display = 'none';
        setupView.style.display = 'block';
        
        // Initialize the form
        initWebsiteSetupForm();
        
        // Load the existing progress for this specific website
        loadFormProgress();
    }
}

// View details of a submitted website
function viewWebsite(websiteId) {
    console.log('👁️ View website:', websiteId);
    
    // For now, just open the form for editing (same as continueWebsite)
    // Later this can show a read-only view or different functionality per status
    continueWebsite(websiteId);
}

// Edit website info (for completed websites)
async function editWebsiteInfo(websiteId, event = null) {
    console.log('✏️ Edit website info:', websiteId);
    
    // Get button reference and show loading state
    const button = event ? event.target.closest('button') : null;
    if (button) {
        showButtonLoading(button);
    }
    
    // Store button globally so we can hide loading later
    window.currentEditButton = button;
    
    // Show custom confirmation modal instead of browser confirm
    showEditConfirmModal(websiteId);
}

// Show custom edit confirmation modal
function showEditConfirmModal(websiteId) {
    console.log('🔔 Showing edit confirmation modal for:', websiteId);
    
    // Store websiteId for confirmation callback
    window.currentEditWebsiteId = websiteId;
    
    // Show the modal
    const modal = document.getElementById('editConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('❌ Edit confirmation modal not found');
    }
}

// Confirm edit - user clicked Yes
async function confirmEditWebsite() {
    console.log('✅ User confirmed edit');
    
    // Hide the modal
    const modal = document.getElementById('editConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Get the websiteId from global state
    const websiteId = window.currentEditWebsiteId;
    if (!websiteId) {
        console.error('❌ No websiteId found');
        return;
    }
    
    // Proceed with edit logic (same as before)
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) {
            console.error('❌ No user logged in');
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            console.error('❌ Database not available');
            return;
        }
        
        // Get user's websites to check THIS specific website's service plan
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            console.error('❌ User document not found');
            return;
        }
        
        const userData = userDoc.data();
        const websitesMap = userData.websites || {};
        
        // Get THIS website's data
        const websiteData = websitesMap[websiteId];
        if (!websiteData) {
            console.error('❌ Website not found:', websiteId);
            alert('Website not found. Please refresh the page.');
            return;
        }
        
        // Check if website is already in 'editing' status (user already paid for edit access)
        const isEditing = websiteData.status === 'editing';
        
        // Check THIS website's service plan (not user-level)
        const services = websiteData.services || {};
        const hasEditAccess = services.updates === true || services.complete === true;
        
        console.log(`🔍 Checking edit access for ${websiteId}:`, {
            status: websiteData.status,
            isEditing: isEditing,
            updates: services.updates,
            complete: services.complete,
            hasEditAccess
        });
        
        if (hasEditAccess || isEditing) {
            console.log('✅ Website has edit access - opening form');
            // Website has updates/complete service OR is already in editing status - open the form
            await setWebsiteStatusToEditing(websiteId, db, user.uid);
            continueWebsite(websiteId);
            
            // Hide loading state since we're done
            if (window.currentEditButton) {
                hideButtonLoading(window.currentEditButton);
                window.currentEditButton = null;
            }
        } else {
            console.log('💳 Website needs edit access purchase - showing checkout');
            // Website doesn't have edit access - show checkout
            // Keep loading state active, it will be hidden when checkout modal opens
            showEditCheckoutModal(websiteId);
        }
        
    } catch (error) {
        console.error('❌ Error checking edit access:', error);
        alert('Error checking access. Please try again.');
        
        // Hide loading state on error
        if (window.currentEditButton) {
            hideButtonLoading(window.currentEditButton);
            window.currentEditButton = null;
        }
    }
}

// Cancel edit - user clicked No
function cancelEditConfirm() {
    console.log('❌ User cancelled edit');
    
    // Hide loading state on button
    if (window.currentEditButton) {
        hideButtonLoading(window.currentEditButton);
        window.currentEditButton = null;
    }
    
    // Hide the modal
    const modal = document.getElementById('editConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear the stored websiteId
    window.currentEditWebsiteId = null;
}

// Complete edits directly (for "Complete Edits" button - no confirmation needed)
async function completeEditsDirectly(websiteId) {
    console.log('✏️ Complete edits directly (no confirmation):', websiteId);
    
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) {
            console.error('❌ No user logged in');
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            console.error('❌ Database not available');
            return;
        }
        
        // Website is already in 'editing' status, just open the form
        console.log('✅ Opening form for editing website');
        await setWebsiteStatusToEditing(websiteId, db, user.uid);
        continueWebsite(websiteId);
        
    } catch (error) {
        console.error('❌ Error opening edit form:', error);
        alert('Error opening form. Please try again.');
    }
}

// Show delete website modal
function showDeleteWebsiteModal(websiteName) {
    console.log('🗑️ Showing delete modal for:', websiteName);
    
    // Store website name for deletion
    window.currentDeleteWebsiteName = websiteName;
    
    // Reset input field
    const input = document.getElementById('deleteConfirmInput');
    if (input) {
        input.value = '';
        input.oninput = checkDeleteInput;
    }
    
    // Disable delete button
    const deleteBtn = document.querySelector('.btn-delete-confirm');
    if (deleteBtn) {
        deleteBtn.disabled = true;
    }
    
    // Show modal
    const modal = document.getElementById('deleteWebsiteModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Check if user typed "delete" correctly
function checkDeleteInput() {
    const input = document.getElementById('deleteConfirmInput');
    const deleteBtn = document.querySelector('.btn-delete-confirm');
    
    if (input && deleteBtn) {
        deleteBtn.disabled = input.value !== 'Delete';
    }
}

// Cancel delete website
function cancelDeleteWebsite() {
    console.log('❌ User cancelled delete');
    
    // Hide modal
    const modal = document.getElementById('deleteWebsiteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear stored website name
    window.currentDeleteWebsiteName = null;
    
    // Reset input
    const input = document.getElementById('deleteConfirmInput');
    if (input) {
        input.value = '';
    }
}

// Confirm delete website
async function confirmDeleteWebsite() {
    console.log('🗑️ Starting website deletion...');
    
    const websiteName = window.currentDeleteWebsiteName;
    console.log('Website to delete:', websiteName);
    
    if (!websiteName) {
        console.error('❌ No website selected for deletion');
        alert('No website selected for deletion.');
        return;
    }
    
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        console.log('Current user:', user ? user.uid : 'null');
        
        if (!user) {
            alert('You must be logged in to delete a website.');
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        console.log('Database available:', !!db);
        
        if (!db) {
            alert('Database not available. Please try again.');
            return;
        }
        
        // Show loading state
        const deleteBtn = document.querySelector('.btn-delete-confirm');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner"></span> Deleting...';
        }
        
        console.log('Fetching user document...');
        // Delete the website from user's websites map
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        console.log('User document exists:', userDoc.exists);
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = { ...(userData.websites || {}) };
            
            console.log('Current websites:', Object.keys(websitesMap));
            console.log('Deleting website:', websiteName);
            
            // Check if website exists
            if (!websitesMap[websiteName]) {
                console.error('❌ Website not found in user data');
                alert('Website not found in your account.');
                return;
            }
            
            // Get the subscription ID before deleting
            const websiteData = websitesMap[websiteName];
            const subscriptionId = websiteData.subscriptionId;
            
            console.log('Subscription ID:', subscriptionId);
            
            // Cancel subscription in Stripe if it exists
            if (subscriptionId) {
                console.log('🔄 Canceling subscription in Stripe...');
                try {
                    const functions = window.FirebaseServices ? window.FirebaseServices.functions : null;
                    if (functions) {
                        const cancelSubscription = functions.httpsCallable('cancelSubscription');
                        const result = await cancelSubscription({ subscriptionId: subscriptionId });
                        console.log('✅ Subscription canceled:', result.data);
                    } else {
                        console.warn('⚠️ Firebase Functions not available, subscription not canceled in Stripe');
                    }
                } catch (error) {
                    console.error('❌ Error canceling subscription:', error);
                    // Continue with deletion even if subscription cancellation fails
                    console.warn('⚠️ Continuing with website deletion despite subscription error');
                }
            } else {
                console.log('ℹ️ No subscription ID found for this website');
            }
            
            // Remove the website from the map
            delete websitesMap[websiteName];
            
            console.log('Websites after deletion:', Object.keys(websitesMap));
            console.log('Updating Firestore...');
            
            // Update Firestore - use update() instead of set()
            await userRef.update({
                websites: websitesMap,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Firestore updated successfully');
            console.log('✅ Website deleted successfully');
            
            // Show success
            if (deleteBtn) {
                deleteBtn.innerHTML = '✓ Deleted!';
                deleteBtn.style.background = '#10b981';
            }
            
            // Close modal and reload
            setTimeout(() => {
                console.log('Reloading page...');
                cancelDeleteWebsite();
                location.reload();
            }, 1000);
        } else {
            console.error('❌ User document does not exist');
            alert('User data not found.');
        }
        
    } catch (error) {
        console.error('❌ Error deleting website:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        alert('Error deleting website: ' + error.message);
        
        // Reset button
        const deleteBtn = document.querySelector('.btn-delete-confirm');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Website';
        }
    }
}

// Helper function to set website status to 'editing'
async function setWebsiteStatusToEditing(websiteName, db, userId) {
    try {
        console.log(`📝 Setting ${websiteName} status to 'editing'...`);
        
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = userData.websites || {};
            
            if (websitesMap[websiteName]) {
                // Save a snapshot of current form data BEFORE editing starts
                if (websitesMap[websiteName].formProgress) {
                    websitesMap[websiteName].preEditSnapshot = { ...websitesMap[websiteName].formProgress };
                    console.log('📸 Saved pre-edit snapshot for comparison');
                }
                
                websitesMap[websiteName].status = 'editing';
                websitesMap[websiteName].editingStartedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                await userRef.set({
                    websites: websitesMap,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log(`✅ Status updated to 'editing' for ${websiteName}`);
            }
        }
    } catch (error) {
        console.error('❌ Error setting status to editing:', error);
    }
}

// Show checkout modal for editing access
function showEditCheckoutModal(websiteId) {
    console.log('💳 showEditCheckoutModal called for:', websiteId);
    
    // Store the website ID for after payment
    sessionStorage.setItem('pendingEditWebsite', websiteId);
    console.log('✅ Stored pendingEditWebsite in sessionStorage');
    
    // Check if CheckoutModal is available
    if (!window.CheckoutModal) {
        console.error('❌ window.CheckoutModal is not available');
        alert('Checkout system not loaded. Please refresh the page and try again.');
        return;
    }
    
    console.log('✅ CheckoutModal available:', window.CheckoutModal);
    
    // Check if the method exists
    if (typeof window.CheckoutModal.showEditAccessPayment !== 'function') {
        console.error('❌ CheckoutModal.showEditAccessPayment is not a function');
        console.log('Available methods:', Object.keys(window.CheckoutModal));
        alert('Checkout system not ready. Please refresh the page and try again.');
        return;
    }
    
    console.log('✅ Calling CheckoutModal.showEditAccessPayment...');
    
    // Open the checkout modal with edit access payment
    try {
        const showPromise = window.CheckoutModal.showEditAccessPayment(websiteId);
        console.log('✅ Checkout modal opened successfully');
        
        // Hide loading state after modal opens
        if (showPromise && showPromise.then) {
            // If showEditAccessPayment returns a promise, wait for it
            showPromise.then(() => {
                if (window.currentEditButton) {
                    hideButtonLoading(window.currentEditButton);
                    window.currentEditButton = null;
                }
            }).catch((error) => {
                console.error('Error showing checkout:', error);
                if (window.currentEditButton) {
                    hideButtonLoading(window.currentEditButton);
                    window.currentEditButton = null;
                }
            });
        } else {
            // If no promise, hide loading after a short delay
            setTimeout(() => {
                if (window.currentEditButton) {
                    hideButtonLoading(window.currentEditButton);
                    window.currentEditButton = null;
                }
            }, 300);
        }
    } catch (error) {
        console.error('❌ Error opening checkout modal:', error);
        alert('Error opening checkout. Please refresh and try again.');
        
        // Hide loading state on error
        if (window.currentEditButton) {
            hideButtonLoading(window.currentEditButton);
            window.currentEditButton = null;
        }
    }
}

// Show the page with smooth fade-in
function showMyWebsitesPage() {
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
        console.log('✨ Showing my-websites page with fade-in');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Fallback function to show page even if auth fails
function showPageWithFallback() {
    console.log('⚠️ Showing my-websites page with fallback (no auth)');
    showMyWebsitesPage();
}

// Initialize page controls and event listeners
function initPageControls() {
    // View toggle buttons
    const viewToggleButtons = document.querySelectorAll('.view-toggle');
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Change view layout
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
}

// Switch between grid and list views
function switchView(view) {
    const websitesGrid = document.getElementById('websitesGrid');
    if (!websitesGrid) return;
    
    if (view === 'list') {
        websitesGrid.classList.add('list-view');
        console.log('📋 Switched to list view');
    } else {
        websitesGrid.classList.remove('list-view');
        console.log('📊 Switched to grid view');
    }
}

// Create new website function
function createNewWebsite() {
    console.log('✨ Create new website clicked');
    // TODO: Implement website creation flow
    alert('Website creation coming soon! This will open the website builder.');
}

// Request website function (disabled for now)
function requestWebsite() {
    window.mobileDebug('🚀 Request website clicked (disabled)');
    console.log('🚀 Request website clicked (coming soon)');
}

// Begin website setup function - opens the multi-step form
function beginWebsiteSetup() {
    console.log('🚀 Begin website setup clicked - redirecting to pricing');
    window.mobileDebug && window.mobileDebug('🚀 Begin website setup clicked - redirecting to pricing');
    
    // Navigate to pricing page to purchase a website
    goToPricing();
}

// Navigate to pricing page
function goToPricing() {
    console.log('Navigating to Pricing');
    
    if (typeof window.PageUtils !== 'undefined') {
        const url = window.PageUtils.getDeviceSpecificUrl('pricing');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = isMobile ? 'pricing-mobile.html' : 'pricing-desktop.html';
        window.location.href = url;
    }
}

// Check for pending website purchase and auto-create form
async function checkAndCreatePendingWebsite() {
    console.log('🔍 Checking for pending website purchase...');
    
    const pendingWebsite = localStorage.getItem('pendingWebsite');
    
    if (pendingWebsite) {
        console.log('✨ Found pending website:', pendingWebsite);
        
        // Set the current editing website to the purchased domain
        currentEditingWebsite = pendingWebsite;
        console.log(`📝 Set current editing website to: ${currentEditingWebsite}`);
        
        // Clear the pending flag
        localStorage.removeItem('pendingWebsite');
        
        // Keep loading screen visible while we set up the form
        console.log('⏳ Keeping loading screen visible while setting up form...');
        
        // Wait for auth to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Auto-start the form
        const defaultView = document.getElementById('myWebsitesDefault');
        const setupView = document.getElementById('myWebsitesSetup');
        
        if (defaultView && setupView) {
            // Prevent body scrolling FIRST, before any visual changes (mobile only)
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
                // Force browser to commit the style immediately (prevents race condition)
                void document.body.offsetHeight;
            }
            
            // Set initial visibility before showing page
            defaultView.style.display = 'none';
            setupView.style.display = 'block';
            
            // Initialize the form
            initWebsiteSetupForm();
            
            // Pre-fill the domain field with the purchased website name
            // Wait for form to be rendered
            setTimeout(() => {
                const domainInput = document.getElementById('domain');
                if (domainInput) {
                    domainInput.value = pendingWebsite;
                    // Save to formData
                    formData['domain'] = pendingWebsite;
                    // Save progress to Firebase (now saves to website-specific path)
                    saveFormProgress();
                    console.log('✅ Pre-filled domain with:', pendingWebsite);
                }
                
                // Now show the page with the form already visible
                setTimeout(() => {
                    showMyWebsitesPage();
                }, 200);
            }, 300);
        } else {
            // Fallback - show page normally
            showMyWebsitesPage();
        }
    } else {
        console.log('ℹ️ No pending website purchase found');
        // No pending website, show page normally
        // Note: showMyWebsitesPage() is already called by waitForAuthAndShowMyWebsites()
    }
    
    // Also check for pending edit access (after successful edit payment)
    checkAndOpenPendingEdit();
}

// Check for pending edit access and auto-open form
async function checkAndOpenPendingEdit() {
    console.log('🔍 Checking for pending edit access...');
    
    const pendingEditWebsite = sessionStorage.getItem('pendingEditWebsite');
    
    if (pendingEditWebsite) {
        console.log('✨ Found pending edit access for:', pendingEditWebsite);
        
        // Clear the pending flag
        sessionStorage.removeItem('pendingEditWebsite');
        
        // Wait for websites to be loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set up the form before showing the page
        const defaultView = document.getElementById('myWebsitesDefault');
        const setupView = document.getElementById('myWebsitesSetup');
        
        if (defaultView && setupView) {
            // Set initial visibility before showing page
            defaultView.style.display = 'none';
            setupView.style.display = 'block';
            
            // Set the current editing website
            currentEditingWebsite = pendingEditWebsite;
            console.log(`📝 Set current editing website to: ${currentEditingWebsite}`);
            
            // Initialize the form
            initWebsiteSetupForm();
            
            // Load the existing progress for this website
            await loadFormProgress();
            
            // Now show the page with the form already visible
            setTimeout(() => {
                showMyWebsitesPage();
            }, 200);
        } else {
            // Fallback - just open the form normally
            console.log('📝 Opening form for editing...');
            continueWebsite(pendingEditWebsite);
            showMyWebsitesPage();
        }
    } else {
        console.log('ℹ️ No pending edit access found');
    }
}

// Global variables for form state
let currentStep = 1;
const totalSteps = 10;
let formData = {};
let currentEditingWebsite = null; // Track which website's form we're editing
let currentWebsiteStatus = null; // Track the current website's status

// Initialize the website setup form
function initWebsiteSetupForm() {
    console.log('📝 Initializing website setup form');
    
    // Reset to first step
    currentStep = 1;
    updateProgressBar();
    showCurrentStep();
    updateNavigationButtons();
    
    // Display the current website name in the domain question
    if (currentEditingWebsite) {
        const websiteNameDisplay = document.getElementById('websiteNameDisplay');
        if (websiteNameDisplay) {
            websiteNameDisplay.textContent = currentEditingWebsite;
        }
    }
    
    // Set up color picker event listeners
    setupColorPickers();
    
    // Set up form submission
    setupFormSubmission();
    
    // Set up validation event listeners
    setupValidationListeners();
    
    // Initialize photo upload functionality
    initPhotoUpload();
}

// Show the current step
function showCurrentStep() {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Update progress bar
function updateProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        const percentage = (currentStep / totalSteps) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const submitEditsBtn = document.getElementById('submitEditsBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentStep === 1 || uploadsInProgress;
    }
    
    // Reset submit button states to default (fix for persisting "Submitted!" state)
    if (submitBtn) {
        submitBtn.disabled = uploadsInProgress;
        submitBtn.style.opacity = '1';
        submitBtn.style.transform = 'scale(1)';
        submitBtn.style.removeProperty('background'); // Reset to CSS default
        submitBtn.innerHTML = 'Submit Form'; // Reset text content (not textContent, to clear any HTML)
    }
    
    if (submitEditsBtn) {
        submitEditsBtn.disabled = uploadsInProgress;
        submitEditsBtn.style.opacity = '1';
        submitEditsBtn.style.transform = 'translateX(-50%) scale(1)';
        submitEditsBtn.style.removeProperty('background'); // Reset to CSS default
        submitEditsBtn.innerHTML = 'Submit Edits'; // Reset text content
    }
    
    // Show upload progress if uploads are in progress
    if (uploadsInProgress && nextBtn) {
        nextBtn.innerHTML = `⏳ Uploading ${uploadProgressCount.completed}/${uploadProgressCount.total}...`;
        nextBtn.disabled = true;
    } else if (nextBtn) {
        nextBtn.innerHTML = 'Next →';
        nextBtn.disabled = false;
    }
    
    if (nextBtn && submitBtn) {
        if (currentStep === totalSteps) {
            // On last step - hide next, show final submit button
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
            if (submitEditsBtn) submitEditsBtn.style.display = 'none';
            
            // Customize submit button based on website status
            if (currentWebsiteStatus === 'editing') {
                submitBtn.textContent = 'Submit Edits';
                submitBtn.style.background = '#000000';
                submitBtn.style.color = '#ffffff';
            } else {
                submitBtn.textContent = 'Submit Form';
                submitBtn.style.background = '#000000';
                submitBtn.style.color = '#ffffff';
            }
        } else {
            // Not on last step - show next button, hide final submit
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
            
            // Show middle submit edits button if status is 'editing'
            if (submitEditsBtn) {
                if (currentWebsiteStatus === 'editing') {
                    submitEditsBtn.style.display = 'flex';
                } else {
                    submitEditsBtn.style.display = 'none';
                }
            }
        }
    }
}

// Scroll to top of the form container
function scrollToTopOfForm() {
    const setupContainer = document.getElementById('myWebsitesSetup');
    if (setupContainer) {
        // Smooth scroll to top
        setupContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Navigate to next step
async function nextStep() {
    // Block navigation if uploads are in progress
    if (uploadsInProgress) {
        alert(`⏳ Please wait! ${uploadProgressCount.completed} of ${uploadProgressCount.total} photos are still uploading...`);
        return;
    }
    
    if (validateCurrentStep() && currentStep < totalSteps) {
        saveCurrentStepData();
        currentStep++;
        showCurrentStep();
        updateProgressBar();
        updateNavigationButtons();
        
        // Scroll to top of the setup container
        scrollToTopOfForm();
        
        // Save progress to Firebase (await to ensure save completes)
        await saveFormProgress();
        
        console.log(`📍 Moved to step ${currentStep}`);
    }
}

// Navigate to previous step
function previousStep() {
    // Block navigation if uploads are in progress
    if (uploadsInProgress) {
        alert(`⏳ Please wait! ${uploadProgressCount.completed} of ${uploadProgressCount.total} photos are still uploading...`);
        return;
    }
    
    if (currentStep > 1) {
        saveCurrentStepData();
        currentStep--;
        showCurrentStep();
        updateProgressBar();
        updateNavigationButtons();
        
        // Scroll to top of the setup container
        scrollToTopOfForm();
        
        console.log(`📍 Moved to step ${currentStep}`);
    }
}

// Validate current step
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!currentStepElement) return true;
    
    const requiredFields = currentStepElement.querySelectorAll('.required input[required], .required textarea[required], .required input[type="radio"]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        // Skip validation for referralName if it's hidden
        if (field.id === 'referralName') {
            const referralNameGroup = document.getElementById('referralNameGroup');
            if (referralNameGroup && referralNameGroup.style.display === 'none') {
                return; // Skip validation for hidden referral name field
            }
        }
        
        // For radio buttons, check if any in the group is checked
        if (field.type === 'radio') {
            const radioGroup = currentStepElement.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            const formGroup = field.closest('.form-group');
            
            if (!isChecked) {
                formGroup.classList.add('error');
                isValid = false;
            } else {
                formGroup.classList.remove('error');
            }
        } else {
            // For text inputs and textareas
            const formGroup = field.closest('.form-group');
            
            if (!field.value.trim()) {
                formGroup.classList.add('error');
                isValid = false;
            } else {
                formGroup.classList.remove('error');
            }
        }
    });
    
    // Special validation for Step 9 (Photos & Demo Reel)
    if (currentStep === 9) {
        // Validate headshots (2-3 required)
        const headshotsGroup = currentStepElement.querySelector('.photo-upload-section:has(#headshotsInput)');
        if (uploadedHeadshots.length < 2 || uploadedHeadshots.length > 3) {
            isValid = false;
            if (headshotsGroup) {
                headshotsGroup.classList.add('error');
                const errorMsg = headshotsGroup.querySelector('.error-message');
                if (errorMsg) {
                    if (uploadedHeadshots.length === 0) {
                        errorMsg.textContent = 'Please upload 2-3 headshots';
                    } else if (uploadedHeadshots.length === 1) {
                        errorMsg.textContent = 'Please upload at least 1 more headshot (2-3 required)';
                    } else {
                        errorMsg.textContent = 'Maximum 3 headshots allowed';
                    }
                }
            }
        } else {
            if (headshotsGroup) {
                headshotsGroup.classList.remove('error');
            }
        }
        
        // Validate performance photos (10 required minimum)
        const performanceGroup = currentStepElement.querySelector('.photo-upload-section:has(#performancePhotosInput)');
        if (uploadedPerformancePhotos.length < 10) {
            isValid = false;
            if (performanceGroup) {
                performanceGroup.classList.add('error');
                const errorMsg = performanceGroup.querySelector('.error-message');
                if (errorMsg) {
                    const remaining = 10 - uploadedPerformancePhotos.length;
                    errorMsg.textContent = `Please upload ${remaining} more photo${remaining > 1 ? 's' : ''} (${uploadedPerformancePhotos.length}/10 uploaded)`;
                }
            }
        } else {
            if (performanceGroup) {
                performanceGroup.classList.remove('error');
            }
        }
    }
    
    return isValid;
}

// Setup validation event listeners
function setupValidationListeners() {
    const form = document.getElementById('websiteSetupForm');
    if (!form) return;
    
    // Get all required inputs and textareas
    const requiredFields = form.querySelectorAll('.required input[required], .required textarea[required]');
    
    requiredFields.forEach(field => {
        // Remove error on input (user is typing)
        field.addEventListener('input', function() {
            const formGroup = this.closest('.form-group');
            if (formGroup && this.value.trim()) {
                formGroup.classList.remove('error');
            }
        });
        
        // Validate on blur (user leaves the field)
        field.addEventListener('blur', function() {
            const formGroup = this.closest('.form-group');
            if (formGroup) {
                if (!this.value.trim()) {
                    formGroup.classList.add('error');
                } else {
                    formGroup.classList.remove('error');
                }
            }
        });
    });
    
    // Handle radio buttons separately
    const radioGroups = form.querySelectorAll('.required input[type="radio"]');
    const processedGroups = new Set();
    
    radioGroups.forEach(radio => {
        const groupName = radio.name;
        
        // Only set up listener once per radio group
        if (!processedGroups.has(groupName)) {
            processedGroups.add(groupName);
            
            const allRadiosInGroup = form.querySelectorAll(`input[name="${groupName}"]`);
            
            allRadiosInGroup.forEach(r => {
                r.addEventListener('change', function() {
                    const formGroup = this.closest('.form-group');
                    if (formGroup) {
                        formGroup.classList.remove('error');
                    }
                });
            });
        }
    });
}

// Save current step data to formData object
function saveCurrentStepData() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!currentStepElement) return;
    
    const inputs = currentStepElement.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Skip inputs without a name attribute
        if (!input.name || input.name.trim() === '') return;
        
        if (input.type === 'radio') {
            if (input.checked) {
                console.log('💾 Saving radio:', input.name, '=', input.value);
                formData[input.name] = input.value;
            }
        } else {
            formData[input.name] = input.value;
        }
    });
    
    // ALWAYS save photo data (not just on step 9) to prevent data loss
    formData.headshots = uploadedHeadshots;
    formData.performancePhotos = uploadedPerformancePhotos;
    
    if (currentStep === 9) {
        console.log('📸 Saved photo data:', {
            headshots: uploadedHeadshots.length,
            performancePhotos: uploadedPerformancePhotos.length
        });
    }
    
    console.log('💾 Saved step data:', formData);
}

// Setup color pickers with labels
function setupColorPickers() {
    const colorInputs = [
        { id: 'primaryColor', labelId: 'primaryColorLabel' },
        { id: 'secondaryColor', labelId: 'secondaryColorLabel' },
        { id: 'accentColor', labelId: 'accentColorLabel' }
    ];
    
    colorInputs.forEach(({ id, labelId }) => {
        const colorInput = document.getElementById(id);
        const colorLabel = document.getElementById(labelId);
        
        if (colorInput && colorLabel) {
            colorInput.addEventListener('change', (e) => {
                const colorName = getColorName(e.target.value);
                colorLabel.textContent = colorName;
                
                // Save the change
                formData[id] = e.target.value;
                saveFormProgress();
            });
        }
    });
}

// Get friendly color name from hex value
function getColorName(hex) {
    const colors = {
        '#000000': 'Black',
        '#FFFFFF': 'White',
        '#808080': 'Gray',
        '#FF0000': 'Red',
        '#0000FF': 'Blue',
        '#008000': 'Green',
        '#FFFF00': 'Yellow',
        '#800080': 'Purple',
        '#FFC0CB': 'Pink',
        '#FFA500': 'Orange',
        '#A52A2A': 'Brown',
        '#D2B48C': 'Tan'
    };
    
    return colors[hex.toUpperCase()] || hex;
}

// ============================================
// PHOTO UPLOAD FUNCTIONALITY
// ============================================

// Store uploaded photos data
let uploadedHeadshots = [];
let uploadedPerformancePhotos = [];
let selectionMode = false;
let selectedPhotos = new Set();

// Upload state tracking
let uploadsInProgress = false;
let uploadProgressCount = { completed: 0, total: 0 };

// Initialize photo upload listeners
function initPhotoUpload() {
    console.log('📸 Initializing photo upload functionality');
    
    const headshotsInput = document.getElementById('headshotsInput');
    const performancePhotosInput = document.getElementById('performancePhotosInput');
    
    if (headshotsInput) {
        headshotsInput.addEventListener('change', (e) => handlePhotoSelection(e, 'headshots'));
    }
    
    if (performancePhotosInput) {
        performancePhotosInput.addEventListener('change', (e) => handlePhotoSelection(e, 'performance'));
    }
}

// Handle photo file selection
async function handlePhotoSelection(event, type) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // If in selection mode, exit it before uploading new photos
    if (type === 'performance' && selectionMode) {
        toggleSelectionMode();
    }
    
    console.log(`📸 Selected ${files.length} ${type} photos`);
    
    // Validate file types
    const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
            alert(`${file.name} is not an image file`);
            return false;
        }
        // Check file size (max 500MB per image)
        if (file.size > 500 * 1024 * 1024) {
            alert(`${file.name} is too large. Maximum size is 500MB per image.`);
            return false;
        }
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Check photo limits
    if (type === 'headshots') {
        const totalHeadshots = uploadedHeadshots.length + validFiles.length;
        if (totalHeadshots > 3) {
            alert('You can only upload up to 3 headshots. Please remove some photos first.');
            event.target.value = ''; // Reset input
            return;
        }
    }
    
    // Show previews immediately
    displayPhotoPreviews(validFiles, type);
    
    // Upload photos to Firebase Storage
    await uploadPhotosToStorage(validFiles, type);
    
    // Clear error state after upload
    clearPhotoUploadError(type);
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
}

// Clear photo upload error state
function clearPhotoUploadError(type) {
    const formGroup = type === 'headshots'
        ? document.querySelector('.photo-upload-section:has(#headshotsInput)')
        : document.querySelector('.photo-upload-section:has(#performancePhotosInput)');
    
    if (formGroup) {
        formGroup.classList.remove('error');
    }
}

// Display photo previews
function displayPhotoPreviews(files, type) {
    const previewContainer = type === 'headshots' 
        ? document.getElementById('headshotsPreview')
        : document.getElementById('performancePhotosPreview');
    
    if (!previewContainer) return;
    
    // Store preview items to return them
    const previewItems = [];
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            previewItem.dataset.fileName = file.name;
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const uploadingOverlay = document.createElement('div');
            uploadingOverlay.className = 'photo-preview-uploading';
            uploadingOverlay.innerHTML = '<div class="spinner"></div>';
            
            previewItem.appendChild(img);
            previewItem.appendChild(uploadingOverlay);
            previewContainer.appendChild(previewItem);
            
            // Store reference with file for later matching
            file._previewElement = previewItem;
        };
        
        reader.readAsDataURL(file);
    });
}

// Upload photos to Firebase Storage
async function uploadPhotosToStorage(files, type) {
    const storage = window.FirebaseServices?.storage;
    if (!storage) {
        alert('Storage service not available. Please refresh and try again.');
        return;
    }
    
    const user = window.FirebaseAuth?.getCurrentUser();
    if (!user) {
        alert('You must be logged in to upload photos.');
        return;
    }
    
    if (!currentEditingWebsite) {
        alert('No website selected. Please try again.');
        return;
    }
    
    // Set upload state tracking
    uploadsInProgress = true;
    uploadProgressCount = { completed: 0, total: files.length };
    console.log(`📤 Starting upload of ${files.length} ${type} photos...`);
    
    // Update navigation buttons to show upload state
    updateNavigationButtons();
    
    // Store successfully uploaded photos temporarily
    const successfulUploads = [];
    
    const uploadPromises = files.map(async (file, index) => {
        try {
            // Create a unique filename with timestamp
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const extension = file.name.split('.').pop();
            const fileName = `${timestamp}_${randomId}.${extension}`;
            
            // Create storage path: users/{userId}/websites/{websiteName}/{type}/{fileName}
            const folderType = type === 'headshots' ? 'headshots' : 'performance-photos';
            const storagePath = `users/${user.uid}/websites/${currentEditingWebsite}/${folderType}/${fileName}`;
            
            // Create storage reference
            const storageRef = storage.ref(storagePath);
            
            // Upload file
            console.log(`⬆️ Uploading ${type} photo ${index + 1}/${files.length}: ${file.name}`);
            const uploadTask = await storageRef.put(file);
            
            // Get download URL
            const downloadURL = await uploadTask.ref.getDownloadURL();
            console.log(`✅ Photo uploaded successfully: ${downloadURL}`);
            
            // Store photo data
            const photoData = {
                fileName: fileName,
                originalName: file.name,
                url: downloadURL,
                storagePath: storagePath,
                uploadedAt: new Date().toISOString(),
                size: file.size,
                type: file.type
            };
            
            // Add to successful uploads
            successfulUploads.push(photoData);
            
            // Update progress count
            uploadProgressCount.completed++;
            console.log(`📊 Upload progress: ${uploadProgressCount.completed}/${uploadProgressCount.total}`);
            
            // Update navigation buttons to show new progress
            updateNavigationButtons();
            
            // Update preview to show success (remove uploading overlay)
            // Use the stored preview element reference if available
            if (file._previewElement) {
                updatePhotoPreviewSuccess(file._previewElement, type, downloadURL, photoData);
            } else {
                // Fallback to old method if preview element not found
                updatePhotoPreviewSuccessByName(file.name, type, downloadURL, photoData);
            }
            
            return photoData;
            
        } catch (error) {
            console.error(`❌ Error uploading ${type} photo:`, error);
            alert(`Failed to upload ${file.name}. Please try again.`);
            if (file._previewElement) {
                file._previewElement.remove();
            } else {
                removePhotoPreview(file.name, type);
            }
            throw error;
        }
    });
    
    try {
        await Promise.all(uploadPromises);
        console.log(`✅ All ${type} photos uploaded successfully`);
        
        // NOW add all successful uploads to the arrays (after ALL complete)
        if (type === 'headshots') {
            uploadedHeadshots.push(...successfulUploads);
        } else {
            uploadedPerformancePhotos.push(...successfulUploads);
        }
        
        // Show bulk actions for performance photos
        if (type === 'performance') {
            updateBulkActionsVisibility();
        }
        
        // Save to form data and auto-save
        saveCurrentStepData();
        await saveFormProgress();
        
    } catch (error) {
        console.error(`❌ Error uploading some ${type} photos:`, error);
    } finally {
        // Reset upload state
        uploadsInProgress = false;
        uploadProgressCount = { completed: 0, total: 0 };
        console.log(`🏁 Upload process complete for ${type}`);
        
        // Update navigation buttons to remove upload state
        updateNavigationButtons();
    }
}

// Update photo preview after successful upload (using element reference)
function updatePhotoPreviewSuccess(previewItem, type, downloadURL, photoData) {
    if (!previewItem) {
        console.warn('⚠️ Preview item not found');
        return;
    }
    
    // Remove uploading overlay
    const uploadingOverlay = previewItem.querySelector('.photo-preview-uploading');
    if (uploadingOverlay) {
        uploadingOverlay.remove();
    }
    
    // Add selection checkbox for performance photos
    if (type === 'performance') {
        const checkbox = document.createElement('div');
        checkbox.className = 'photo-selection-checkbox';
        checkbox.onclick = (e) => {
            e.stopPropagation();
            togglePhotoSelection(previewItem, photoData);
        };
        previewItem.appendChild(checkbox);
    }
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button'; // Prevent form submission
    removeBtn.className = 'photo-preview-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove photo';
    removeBtn.onclick = () => removePhoto(photoData, type);
    previewItem.appendChild(removeBtn);
    
    // Store photo data in the element
    previewItem.dataset.photoUrl = downloadURL;
}

// Update photo preview after successful upload (fallback using filename)
function updatePhotoPreviewSuccessByName(fileName, type, downloadURL, photoData) {
    const previewContainer = type === 'headshots' 
        ? document.getElementById('headshotsPreview')
        : document.getElementById('performancePhotosPreview');
    
    if (!previewContainer) return;
    
    const previewItem = previewContainer.querySelector(`[data-file-name="${fileName}"]`);
    if (!previewItem) {
        console.warn(`⚠️ Could not find preview item for: ${fileName}`);
        return;
    }
    
    updatePhotoPreviewSuccess(previewItem, type, downloadURL, photoData);
}

// Remove photo preview
function removePhotoPreview(fileName, type) {
    const previewContainer = type === 'headshots' 
        ? document.getElementById('headshotsPreview')
        : document.getElementById('performancePhotosPreview');
    
    if (!previewContainer) return;
    
    const previewItem = previewContainer.querySelector(`[data-file-name="${fileName}"]`);
    if (previewItem) {
        previewItem.remove();
    }
}

// Remove photo (from UI and storage)
let pendingPhotoDelete = null;

async function removePhoto(photoData, type) {
    // Store the photo data and type for later
    pendingPhotoDelete = { photoData, type };
    
    // Show custom modal
    const modal = document.getElementById('photoDeleteModal');
    const message = document.getElementById('photoDeleteMessage');
    message.textContent = 'Are you sure you want to remove this photo?';
    modal.style.display = 'flex';
}

// Load saved photos when editing
function loadSavedPhotos() {
    if (!formData.headshots && !formData.performancePhotos) {
        return;
    }
    
    console.log('📸 Loading saved photos...');
    
    // Load headshots
    if (formData.headshots && formData.headshots.length > 0) {
        uploadedHeadshots = formData.headshots;
        displaySavedPhotos(formData.headshots, 'headshots');
    }
    
    // Load performance photos
    if (formData.performancePhotos && formData.performancePhotos.length > 0) {
        uploadedPerformancePhotos = formData.performancePhotos;
        displaySavedPhotos(formData.performancePhotos, 'performance');
        updateBulkActionsVisibility();
    }
}

// Display saved photos from previous session
function displaySavedPhotos(photos, type) {
    const previewContainer = type === 'headshots' 
        ? document.getElementById('headshotsPreview')
        : document.getElementById('performancePhotosPreview');
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = ''; // Clear existing
    
    photos.forEach(photoData => {
        const previewItem = document.createElement('div');
        previewItem.className = 'photo-preview-item';
        previewItem.dataset.fileName = photoData.originalName;
        previewItem.dataset.photoUrl = photoData.url;
        
        // Add selection checkbox for performance photos
        if (type === 'performance') {
            const checkbox = document.createElement('div');
            checkbox.className = 'photo-selection-checkbox';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                togglePhotoSelection(previewItem, photoData);
            };
            previewItem.appendChild(checkbox);
        }
        
        const img = document.createElement('img');
        img.src = photoData.url;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button'; // Prevent form submission
        removeBtn.className = 'photo-preview-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove photo';
        removeBtn.onclick = () => removePhoto(photoData, type);
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
    });
}

// ============================================
// BULK SELECTION SYSTEM FOR PERFORMANCE PHOTOS
// ============================================

// Toggle selection mode on/off
function toggleSelectionMode() {
    selectionMode = !selectionMode;
    selectedPhotos.clear();
    
    const selectBtn = document.querySelector('.btn-select-mode');
    const deleteBtn = document.querySelector('.btn-delete-selected');
    const previewItems = document.querySelectorAll('#performancePhotosPreview .photo-preview-item');
    
    if (selectionMode) {
        selectBtn.classList.add('active');
        previewItems.forEach(item => item.classList.add('selection-mode'));
    } else {
        selectBtn.classList.remove('active');
        deleteBtn.classList.remove('visible');
        previewItems.forEach(item => {
            item.classList.remove('selection-mode', 'selected');
        });
    }
    
    updateSelectionCount();
}

// Select all photos
function selectAllPhotos() {
    if (!selectionMode) return;
    
    // Clear any existing selections first
    selectedPhotos.clear();
    
    const previewItems = document.querySelectorAll('#performancePhotosPreview .photo-preview-item');
    
    // Simply select all performance photos in the array
    uploadedPerformancePhotos.forEach(photoData => {
        selectedPhotos.add(photoData.url);
    });
    
    // Add 'selected' class to all preview items
    previewItems.forEach(item => {
        item.classList.add('selected');
    });
    
    updateSelectionCount();
}

// Toggle individual photo selection
function togglePhotoSelection(previewItem, photoData) {
    if (!selectionMode) return;
    
    const photoUrl = photoData.url;
    
    if (selectedPhotos.has(photoUrl)) {
        selectedPhotos.delete(photoUrl);
        previewItem.classList.remove('selected');
    } else {
        selectedPhotos.add(photoUrl);
        previewItem.classList.add('selected');
    }
    
    updateSelectionCount();
}

// Update selection count display
function updateSelectionCount() {
    const countElement = document.getElementById('selectionCount');
    const deleteBtn = document.querySelector('.btn-delete-selected');
    
    if (countElement) {
        if (selectedPhotos.size > 0) {
            countElement.textContent = `${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} selected`;
            deleteBtn.classList.add('visible');
        } else {
            countElement.textContent = '';
            deleteBtn.classList.remove('visible');
        }
    }
}

// Delete all selected photos
let pendingBulkDelete = null;

async function deleteSelectedPhotos() {
    if (selectedPhotos.size === 0) return;
    
    const count = selectedPhotos.size;
    pendingBulkDelete = { count };
    
    // Show custom modal with count
    const modal = document.getElementById('photoDeleteModal');
    const message = document.getElementById('photoDeleteMessage');
    message.textContent = `Are you sure you want to delete ${count} photo${count > 1 ? 's' : ''}?`;
    modal.style.display = 'flex';
}

// Update confirmPhotoDelete to handle bulk delete
async function confirmPhotoDelete() {
    const modal = document.getElementById('photoDeleteModal');
    modal.style.display = 'none';
    
    // Handle single photo delete
    if (pendingPhotoDelete) {
        const { photoData, type } = pendingPhotoDelete;
        
        try {
            const storage = window.FirebaseServices?.storage;
            if (storage && photoData.storagePath) {
                // Delete from Firebase Storage
                const storageRef = storage.ref(photoData.storagePath);
                await storageRef.delete();
                console.log(`🗑️ Photo deleted from storage: ${photoData.storagePath}`);
            }
            
            // Remove from arrays
            if (type === 'headshots') {
                uploadedHeadshots = uploadedHeadshots.filter(photo => photo.url !== photoData.url);
            } else {
                uploadedPerformancePhotos = uploadedPerformancePhotos.filter(photo => photo.url !== photoData.url);
            }
            
            // Remove from UI
            removePhotoPreview(photoData.originalName, type);
            
            // Save updated data
            saveCurrentStepData();
            await saveFormProgress();
            
            console.log(`✅ Photo removed successfully`);
            
        } catch (error) {
            console.error('❌ Error removing photo:', error);
            alert('Failed to remove photo. Please try again.');
        }
        
        pendingPhotoDelete = null;
        return;
    }
    
    // Handle bulk delete
    if (pendingBulkDelete) {
        const deletePromises = [];
        const storage = window.FirebaseServices?.storage;
        
        // Convert selected URLs to photoData objects and delete
        selectedPhotos.forEach(photoUrl => {
            const photoData = uploadedPerformancePhotos.find(p => p.url === photoUrl);
            if (photoData) {
                deletePromises.push(deletePhotoFromStorage(photoData, storage));
            }
        });
        
        try {
            await Promise.all(deletePromises);
            console.log(`✅ Successfully deleted ${pendingBulkDelete.count} photos`);
            
            // Exit selection mode
            toggleSelectionMode();
            
            // Save updated data
            saveCurrentStepData();
            await saveFormProgress();
            
            // Update bulk actions visibility
            updateBulkActionsVisibility();
            
        } catch (error) {
            console.error('❌ Error deleting selected photos:', error);
            alert('Failed to delete some photos. Please try again.');
        }
        
        pendingBulkDelete = null;
    }
}

// Cancel photo deletion
function cancelPhotoDelete() {
    document.getElementById('photoDeleteModal').style.display = 'none';
    pendingPhotoDelete = null;
    pendingBulkDelete = null;
}

// Helper function to delete a photo from storage
async function deletePhotoFromStorage(photoData, storage) {
    if (storage && photoData.storagePath) {
        const storageRef = storage.ref(photoData.storagePath);
        await storageRef.delete();
        console.log(`🗑️ Photo deleted from storage: ${photoData.storagePath}`);
    }
    
    // Remove from array
    uploadedPerformancePhotos = uploadedPerformancePhotos.filter(photo => photo.url !== photoData.url);
    
    // Remove from UI
    removePhotoPreview(photoData.originalName, 'performance');
}

// Show/hide bulk actions based on number of performance photos
function updateBulkActionsVisibility() {
    const bulkActions = document.getElementById('performanceBulkActions');
    if (bulkActions) {
        if (uploadedPerformancePhotos.length > 0) {
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.style.display = 'none';
        }
    }
}

// Show progress notification
function showProgressNotification(message = 'Progress saved') {
    const notification = document.getElementById('progressNotification');
    if (!notification) return;
    
    const textElement = notification.querySelector('.notification-text');
    if (textElement) {
        textElement.textContent = message;
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Global flag to prevent duplicate submissions
let isSubmitting = false;

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('websiteSetupForm');
    if (!form) return;
    
    // Remove any existing submit event listeners by cloning and replacing the form
    // This prevents duplicate submissions if the form is re-initialized
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submission
        if (isSubmitting) {
            console.log('⚠️ Form already being submitted, ignoring duplicate');
            return;
        }
        
        // VALIDATE CURRENT STEP before allowing submission
        // This is critical for the "Submit Edits" button that appears on all steps
        if (!validateCurrentStep()) {
            console.log('❌ Validation failed, cannot submit');
            return;
        }
        
        // Save final step data
        saveCurrentStepData();
        
        // Submit the form
        await submitWebsiteRequest();
    });
}

// Submit website request to Firebase
async function submitWebsiteRequest() {
    console.log('📤 Submitting website request...');
    
    // Check global flag first
    if (isSubmitting) {
        console.log('⚠️ Submission already in progress (global flag), ignoring duplicate request');
        return;
    }
    
    // Set global flag
    isSubmitting = true;
    
    // Get both submit buttons
    const submitBtn = document.getElementById('submitBtn');
    const submitEditsBtn = document.getElementById('submitEditsBtn');
    const activeButton = submitBtn && submitBtn.style.display !== 'none' ? submitBtn : submitEditsBtn;
    const originalText = activeButton ? activeButton.textContent : '';
    
    // Prevent double submission
    if (activeButton && activeButton.disabled) {
        console.log('⚠️ Submission already in progress (button disabled), ignoring duplicate request');
        isSubmitting = false;
        return;
    }
    
    // Show loading animation on the active button
    if (activeButton) {
        activeButton.disabled = true;
        activeButton.innerHTML = '<span class="spinner"></span> Submitting...';
        activeButton.style.opacity = '0.9';
    }
    
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) {
            alert('You must be logged in to submit a website request.');
            isSubmitting = false; // Reset flag
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = originalText;
                activeButton.style.opacity = '1';
            }
            return;
        }
        
        // Must have a website to submit for
        if (!currentEditingWebsite) {
            alert('No website selected. Please try again.');
            isSubmitting = false; // Reset flag
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = originalText;
                activeButton.style.opacity = '1';
            }
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            alert('Database service not available. Please try again.');
            isSubmitting = false; // Reset flag
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = originalText;
                activeButton.style.opacity = '1';
            }
            return;
        }
        
        // Prepare form data for submission
        const submittedFormData = {
            ...formData,
            websiteName: currentEditingWebsite,
            userId: user.uid,
            userEmail: user.email,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            currentStep: totalSteps // Mark as completed
        };
        
        // Update the website in users/{uid}/websites/{websiteName}
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = userData.websites || {};
            
            if (websitesMap[currentEditingWebsite]) {
                // Check current status to determine next status
                const currentStatus = websitesMap[currentEditingWebsite].status;
                
                if (currentStatus === 'editing') {
                    // User is submitting edits - change status to 'edited'
                    websitesMap[currentEditingWebsite].status = 'edited';
                    console.log('✏️ Edits submitted - status changed to "edited"');
                } else {
                    // New submission - change status to 'building'
                    websitesMap[currentEditingWebsite].status = 'building';
                    console.log('🔨 New submission - status changed to "building"');
                }
                
                // Save the complete form data in formProgress
                websitesMap[currentEditingWebsite].formProgress = submittedFormData;
                
                // Save submission timestamp
                websitesMap[currentEditingWebsite].submittedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                // Save updated websites map
                await userRef.set({
                    websites: websitesMap,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log('✅ Website request submitted successfully');
            }
        }
        
        // Show success state with checkmark animation
        if (activeButton) {
            activeButton.innerHTML = '✓ Submitted!';
            activeButton.style.setProperty('background', '#10b981', 'important');
            activeButton.style.opacity = '1';
            
            // Check if it's the submit edits button (needs to preserve centering)
            const isSubmitEditsBtn = activeButton.id === 'submitEditsBtn';
            
            if (isSubmitEditsBtn) {
                activeButton.style.transform = 'translateX(-50%) scale(1.05)';
                setTimeout(() => {
                    if (activeButton) activeButton.style.transform = 'translateX(-50%) scale(1)';
                }, 200);
            } else {
                activeButton.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    if (activeButton) activeButton.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        // Wait a moment to show success animation, then redirect
        setTimeout(() => {
            console.log('✅ Website information submitted successfully');
            // Reset flag before redirect
            isSubmitting = false;
            // Clear pending edit session storage to prevent form from reopening
            sessionStorage.removeItem('pendingEditWebsite');
            console.log('🧹 Cleared pendingEditWebsite from sessionStorage');
            returnToMyWebsites();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error submitting website request:', error);
        alert('Error submitting request. Please try again.');
        
        // Reset global flag on error
        isSubmitting = false;
        
        // Reset button state
        if (activeButton) {
            activeButton.disabled = false;
            activeButton.textContent = originalText;
            activeButton.style.opacity = '1';
            activeButton.style.transform = 'scale(1)';
        }
    }
}

// Show progress notification
function showProgressNotification(message = 'Progress saved') {
    const notification = document.getElementById('progressNotification');
    if (!notification) return;
    
    const textElement = notification.querySelector('.notification-text');
    if (textElement) {
        textElement.textContent = message;
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Save form progress to Firebase
async function saveFormProgress() {
    try {
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) return;
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) return;
        
        // Must have a website to save progress for
        if (!currentEditingWebsite) {
            console.warn('⚠️ No website selected for saving progress');
            return;
        }
        
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            console.error('❌ User document not found');
            return;
        }
        
        const progressData = {
            formProgress: {
                ...formData,
                currentStep,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }
        };
        
        // Get existing websites map and update the specific website's form progress
        // IMPORTANT: Use set() with merge to avoid dot notation issues with website names containing dots
        const userData = userDoc.data();
        const websitesMap = userData.websites || {};
        
        // Update the specific website's formProgress
        if (websitesMap[currentEditingWebsite]) {
            websitesMap[currentEditingWebsite].formProgress = progressData.formProgress;
        } else {
            console.error(`❌ Website not found: ${currentEditingWebsite}`);
            return;
        }
        
        // Use set with merge to avoid dot notation issues
        await userRef.set({
            websites: websitesMap
        }, { merge: true });
        
        console.log(`💾 Form progress saved for: ${currentEditingWebsite}`);
        
        // Show progress notification
        showProgressNotification();
        
    } catch (error) {
        console.error('❌ Error saving form progress:', error);
    }
}

// Load form progress from Firebase
async function loadFormProgress() {
    try {
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) return;
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) return;
        
        // Must have a website to load progress for
        if (!currentEditingWebsite) {
            console.warn('⚠️ No website selected for loading progress');
            return;
        }
        
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websiteData = userData.websites?.[currentEditingWebsite];
            
            // Store the website status
            currentWebsiteStatus = websiteData?.status || null;
            console.log(`📊 Website status: ${currentWebsiteStatus}`);
            
            if (websiteData?.formProgress) {
                const progressData = websiteData.formProgress;
                formData = { ...progressData };
                
                // If status is 'editing', always start from step 1 so user can review everything
                // Otherwise, continue from where they left off
                if (currentWebsiteStatus === 'editing') {
                    currentStep = 1;
                    console.log(`✏️ Editing mode - starting from step 1`);
                } else {
                    currentStep = progressData.currentStep || 1;
                    console.log(`📍 Continuing from step ${currentStep}`);
                }
                
                // Restore form values
                restoreFormValues();
                
                // Update UI
                showCurrentStep();
                updateProgressBar();
                updateNavigationButtons();
                
                console.log(`📥 Form progress loaded for: ${currentEditingWebsite}`, progressData);
            } else {
                console.log(`ℹ️ No saved progress found for: ${currentEditingWebsite}`);
                // Still update navigation buttons to customize submit button
                updateNavigationButtons();
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading form progress:', error);
    }
}

// Restore form values from saved data
function restoreFormValues() {
    Object.keys(formData).forEach(key => {
        const element = document.getElementById(key) || document.querySelector(`input[name="${key}"]`);
        if (element) {
            if (element.type === 'radio') {
                const radioButton = document.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                    
                    // Trigger change event for referral toggle
                    if (key === 'hasReferral') {
                        toggleReferralName(formData[key] === 'yes');
                    }
                }
            } else {
                element.value = formData[key];
                
                // Update color labels
                if (element.type === 'color') {
                    const labelId = key + 'Label';
                    const label = document.getElementById(labelId);
                    if (label) {
                        label.textContent = getColorName(formData[key]);
                    }
                }
            }
        }
    });
    
    // Load saved photos
    loadSavedPhotos();
}

// Clear form progress
async function clearFormProgress() {
    try {
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) return;
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) return;
        
        await db.collection('websiteFormProgress').doc(user.uid).delete();
        console.log('🗑️ Form progress cleared');
        
    } catch (error) {
        console.error('❌ Error clearing form progress:', error);
    }
}

// Toggle referral name field
function toggleReferralName(show) {
    const referralNameGroup = document.getElementById('referralNameGroup');
    if (referralNameGroup) {
        referralNameGroup.style.display = show ? 'block' : 'none';
        
        // Clear the field if hiding it
        if (!show) {
            const referralNameInput = document.getElementById('referralName');
            if (referralNameInput) {
                referralNameInput.value = '';
                delete formData.referralName;
            }
        }
    }
}

// Save domain status when radio button is clicked
function saveDomainStatus() {
    console.log('🌐 Domain status radio clicked - saving immediately');
    saveCurrentStepData();
    saveFormProgress();
}

// View samples within My Websites page
function viewSamplesInMyWebsites() {
    window.mobileDebug('🔄 Redirecting to samples page with back button');
    console.log('🔄 Opening samples page with My Websites context');
    
    // Determine device type for appropriate samples file
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent);
    const samplesFile = (isMobile && !isTablet) ? 'samples-mobile.html' : 'samples-desktop.html';
    
    // Navigate to samples page with special parameter
    window.location.href = `${samplesFile}?from=my-websites`;
}

// Function to view samples in overlay (alternative approach - not currently used)
function viewSamplesInOverlay() {
    // Add samples content container (no back button bar)
    const samplesContent = document.createElement('div');
    samplesContent.id = 'samplesContentFull';
    samplesContent.style.cssText = `
        padding: 0;
        min-height: calc(100vh - 80px);
    `;
    
    samplesFullContainer.appendChild(samplesContent);
    document.body.appendChild(samplesFullContainer);
    
    // Load the complete samples page
    loadFullSamplesPage(samplesContent);
}

// Return to main My Websites view
function returnToMyWebsites() {
    window.mobileDebug('← Returning to My Websites main view');
    console.log('← Returning to My Websites main view');
    
    // Defensive cleanup: Clear pending edit session storage
    sessionStorage.removeItem('pendingEditWebsite');
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    // Hide the setup form if it's visible
    const setupView = document.getElementById('myWebsitesSetup');
    if (setupView) {
        setupView.style.display = 'none';
    }
    
    // Hide the samples view if it's visible
    const samplesView = document.getElementById('myWebsitesSamples');
    if (samplesView) {
        samplesView.style.display = 'none';
    }
    
    // Show the default view (remove inline style to let CSS media queries work)
    const defaultView = document.getElementById('myWebsitesDefault');
    if (defaultView) {
        defaultView.style.display = ''; // Empty string lets CSS take over
    }
    
    // Remove back button (both old and new IDs for safety)
    const floatingButton = document.querySelector('#floatingBackButton');
    if (floatingButton) {
        floatingButton.remove();
    }
    const samplesButton = document.querySelector('#samplesBackButton');
    if (samplesButton) {
        samplesButton.remove();
    }
    
    // Remove the full samples container
    const samplesFullContainer = document.getElementById('samplesFullContainer');
    if (samplesFullContainer) {
        samplesFullContainer.remove();
    }
    
    // Show the main My Websites content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        mainWrapper.style.display = 'block';
    }
    
    // Clean up any loaded samples scripts/styles
    cleanupSamplesResources();
    
    // Reload websites to show any updated progress
    const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
    if (user) {
        loadUserWebsites(user);
    }
}

// Load the complete samples page experience
async function loadFullSamplesPage(container) {
    window.mobileDebug('📋 Loading complete samples page...');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">Loading samples page...</div>';
    
    try {
        // Determine device type for appropriate samples file
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad/i.test(navigator.userAgent);
        const samplesFile = (isMobile && !isTablet) ? 'samples-mobile.html' : 'samples-desktop.html';
        
        window.mobileDebug(`📱 Loading complete ${samplesFile}`);
        console.log(`📱 Loading complete samples page from ${samplesFile}`);
        
        // Fetch the samples HTML content
        const response = await fetch(`${samplesFile}`);
        if (!response.ok) {
            throw new Error(`Failed to load samples: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Parse and extract the main content (skip header, loading screen)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get the main content (everything except header and loading screen)
        const mainContent = doc.querySelector('main') || doc.querySelector('.main-content') || doc.querySelector('.main-wrapper main');
        
        if (mainContent) {
            // Clear container and add the complete samples content
            container.innerHTML = '';
            container.appendChild(mainContent.cloneNode(true));
            
            // Inject back button directly into the samples content, above slide titles
            injectBackButtonIntoSamples(container);
            
            // Load samples CSS
            await loadSamplesCSS(samplesFile);
            
            // Load samples JavaScript functionality
            await loadFullSamplesScripts();
            
            window.mobileDebug('✅ Complete samples page loaded successfully');
            console.log('✅ Complete samples page loaded and ready');
        } else {
            throw new Error('Could not find main content in samples HTML');
        }
        
    } catch (error) {
        console.error('❌ Error loading complete samples page:', error);
        window.mobileDebug(`❌ Error loading samples page: ${error.message}`);
        
        // Show error message
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                ❌ Could not load samples page<br>
                <small>${error.message}</small><br>
                <button onclick="loadFullSamplesPage(document.getElementById('samplesContentFull'))" style="
                    margin-top: 12px;
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                ">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Load samples CSS
async function loadSamplesCSS(samplesFile) {
    return new Promise((resolve) => {
        // Check if samples CSS is already loaded
        if (document.querySelector('link[href*="samples-"]')) {
            console.log('✅ Samples CSS already loaded');
            resolve();
            return;
        }
        
        const cssFile = samplesFile.replace('.html', '.css');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `../css/${cssFile}`;
        link.onload = () => {
            console.log('✅ Samples CSS loaded');
            resolve();
        };
        link.onerror = () => {
            console.error('❌ Failed to load samples CSS');
            resolve(); // Don't fail completely
        };
        
        document.head.appendChild(link);
    });
}

// Load complete samples JavaScript functionality
async function loadFullSamplesScripts() {
    return new Promise((resolve) => {
        // Check if samples.js is already loaded
        if (typeof window.initSamplesCustom !== 'undefined') {
            console.log('✅ Samples scripts already available');
            // Re-initialize for the new content
            setTimeout(() => {
                if (typeof window.initSamplesCustom !== 'undefined') {
                    window.initSamplesCustom();
                }
            }, 100);
            resolve();
            return;
        }
        
        // Load samples.js dynamically
        const script = document.createElement('script');
        script.src = '../js/samples.js';
        script.onload = () => {
            console.log('✅ Samples scripts loaded');
            // Initialize samples functionality
            setTimeout(() => {
                if (typeof window.initSamplesCustom !== 'undefined') {
                    window.initSamplesCustom();
                }
            }, 100);
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Failed to load samples scripts');
            resolve(); // Don't fail completely
        };
        
        document.head.appendChild(script);
    });
}

// Inject back button directly into samples content, above slide titles
function injectBackButtonIntoSamples(container) {
    // Remove any existing floating button first
    const existingButton = container.querySelector('#floatingBackButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Find the first carousel slide to inject the button properly
    const firstSlide = container.querySelector('.carousel-slide');
    
    if (firstSlide) {
        // Create a simple back button that sits at the top of the content, not floating
        const backButton = document.createElement('div');
        backButton.id = 'samplesBackButton';
        backButton.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            text-align: center;
        `;
        backButton.innerHTML = `
            <button onclick="returnToMyWebsites()" style="
                background: rgba(255, 255, 255, 0.95);
                color: #1a1a1a;
                border: 2px solid #1a1a1a;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
            " onmouseover="this.style.background='#1a1a1a'; this.style.color='white';" onmouseout="this.style.background='rgba(255, 255, 255, 0.95)'; this.style.color='#1a1a1a';">
                ← Back to My Websites
            </button>
        `;
        
        // Insert the button at the beginning of the main content container
        const mainContent = container.querySelector('main') || container;
        mainContent.style.position = 'relative'; // Ensure relative positioning for absolute child
        mainContent.insertBefore(backButton, mainContent.firstChild);
        
        console.log('✅ Simple back button injected');
        window.mobileDebug('✅ Simple back button added without float conflicts');
    } else {
        console.log('❌ Could not find carousel slide');
        window.mobileDebug('❌ Carousel slide not found');
    }
}

// Clean up samples resources when returning to My Websites
function cleanupSamplesResources() {
    // Remove dynamically loaded samples CSS
    const samplesCSS = document.querySelectorAll('link[href*="samples-"]');
    samplesCSS.forEach(link => {
        if (link.href.includes('samples-')) {
            link.remove();
        }
    });
    
    // Clean up any samples-specific global variables or event listeners
    // (The samples.js script will remain but won't interfere)
    console.log('🧹 Cleaned up samples resources');
}

// Navigation functions (called from header/navigation)
function goToMyWebsites() {
    console.log('🌐 Navigating to My Websites page');
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
}

// Review website (for preview & approval milestone)
function reviewWebsite(websiteId) {
    console.log('🔍 Review website:', websiteId);
    alert('Website preview coming soon! You\'ll be able to review and approve your website here.');
    // TODO: Open website preview modal or page
}

// Show button loading state
function showButtonLoading(button) {
    if (!button) return;
    
    // Store original text and HTML
    button.dataset.originalText = button.textContent;
    button.dataset.originalHTML = button.innerHTML;
    
    // Disable button
    button.disabled = true;
    button.style.opacity = '0.9';
    button.style.cursor = 'wait';
    
    // Add visible white circular spinner (for black buttons)
    button.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 10px;">
            <span style="
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            "></span>
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

// Make final payment (for final payment milestone)
async function makeFinalPayment(websiteId, event = null) {
    console.log('💳 Make final payment for:', websiteId);
    
    // Get button reference
    const button = event ? event.target.closest('button') : null;
    
    // Show loading state on button
    if (button) {
        showButtonLoading(button);
    }
    
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) {
            if (button) hideButtonLoading(button);
            alert('You must be logged in to make a payment.');
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            if (button) hideButtonLoading(button);
            alert('Database service not available. Please try again.');
            return;
        }
        
        // Find the website by ID
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            if (button) hideButtonLoading(button);
            alert('User data not found. Please try again.');
            return;
        }
        
        const userData = userDoc.data();
        const websites = userData.websites || {};
        
        // Find the website by ID
        let websiteName = null;
        let websiteData = null;
        for (const [name, data] of Object.entries(websites)) {
            if (data.websiteId === websiteId || `website_${name}` === websiteId) {
                websiteName = name;
                websiteData = data;
                break;
            }
        }
        
        if (!websiteName || !websiteData) {
            if (button) hideButtonLoading(button);
            alert('Website not found. Please try again.');
            return;
        }
        
        // Check if checkout modal is available
        if (typeof window.checkoutModal === 'undefined') {
            if (button) hideButtonLoading(button);
            alert('Checkout system not ready. Please refresh the page and try again.');
            return;
        }
        
        // Open checkout modal for final payment
        const showPromise = window.checkoutModal.showFinalPayment(websiteId, websiteName, websiteData);
        
        // Hide button loading after modal shows
        if (showPromise && showPromise.then) {
            showPromise.then(() => {
                if (button) hideButtonLoading(button);
            }).catch((error) => {
                console.error('Error showing checkout modal:', error);
                if (button) hideButtonLoading(button);
            });
        } else {
            // If no promise, hide loading after a short delay
            setTimeout(() => {
                if (button) hideButtonLoading(button);
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Error opening final payment checkout:', error);
        if (button) hideButtonLoading(button);
        alert('Error opening checkout. Please try again.');
    }
}

// Approve preview (for preview & approval milestone)
async function approvePreview(websiteId) {
    console.log('✅ Approve preview for:', websiteId);
    
    // Create custom modal
    const modal = document.createElement('div');
    modal.id = 'approvalModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a1a1a;
        border: 2px solid #333;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        animation: slideIn 0.3s ease-out;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
            <h3 style="margin: 0; color: #fff; font-size: 20px; font-weight: 600;">PREVIEW APPROVAL CONFIRMATION</h3>
        </div>
        
        <p style="color: #ccc; margin-bottom: 20px; line-height: 1.6;">Please confirm:</p>
        
        <div style="background: #0a0a0a; border: 1px solid #333; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <div style="color: #fff; margin-bottom: 12px; display: flex; align-items: start;">
                <span style="margin-right: 8px;">✓</span>
                <span>I have reviewed my website preview</span>
            </div>
            <div style="color: #fff; margin-bottom: 12px; display: flex; align-items: start;">
                <span style="margin-right: 8px;">✓</span>
                <span>I am satisfied with the design and content</span>
            </div>
            <div style="color: #fff; display: flex; align-items: start;">
                <span style="margin-right: 8px;">✓</span>
                <span>I approve this preview and am ready to proceed to final payment</span>
            </div>
        </div>
        
        <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
            Click OK to approve, or Cancel to continue reviewing.
        </p>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancelApproval" style="
                padding: 12px 24px;
                background: #333;
                color: #fff;
                border: 1px solid #555;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">Cancel</button>
            <button id="confirmApproval" style="
                padding: 12px 24px;
                background: #fff;
                color: #000;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            ">OK</button>
        </div>
    `;
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        #cancelApproval:hover {
            background: #444 !important;
            border-color: #666 !important;
        }
        #confirmApproval:hover {
            background: #e6e6e6 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }
    `;
    document.head.appendChild(style);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Return a promise that resolves when user clicks OK or Cancel
    const userChoice = await new Promise((resolve) => {
        document.getElementById('confirmApproval').addEventListener('click', () => {
            resolve(true);
        });
        
        document.getElementById('cancelApproval').addEventListener('click', () => {
            modal.remove();
            style.remove();
            resolve(false);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
                resolve(false);
            }
        });
    });
    
    if (!userChoice) {
        console.log('❌ Preview approval cancelled by user');
        return;
    }
    
    try {
        // Get current user
        const user = window.FirebaseAuth ? window.FirebaseAuth.getCurrentUser() : null;
        if (!user) {
            // Show error in modal
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Error</h3>
                    <p style="color: #ccc; margin-bottom: 24px;">You must be logged in to approve the preview.</p>
                    <button onclick="this.closest('#approvalModal').remove()" style="
                        padding: 12px 24px;
                        background: #fff;
                        color: #000;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;
            return;
        }
        
        const db = window.FirebaseServices ? window.FirebaseServices.db : null;
        if (!db) {
            // Show error in modal
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Error</h3>
                    <p style="color: #ccc; margin-bottom: 24px;">Database service not available. Please try again.</p>
                    <button onclick="this.closest('#approvalModal').remove()" style="
                        padding: 12px 24px;
                        background: #fff;
                        color: #000;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;
            return;
        }
        
        // Find the website name by ID
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            // Show error in modal
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Error</h3>
                    <p style="color: #ccc; margin-bottom: 24px;">User data not found. Please try again.</p>
                    <button onclick="this.closest('#approvalModal').remove()" style="
                        padding: 12px 24px;
                        background: #fff;
                        color: #000;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;
            return;
        }
        
        const userData = userDoc.data();
        const websites = userData.websites || {};
        
        // Find the website by ID
        let websiteName = null;
        for (const [name, data] of Object.entries(websites)) {
            if (data.websiteId === websiteId || `website_${name}` === websiteId) {
                websiteName = name;
                break;
            }
        }
        
        if (!websiteName) {
            // Show error in modal
            modalContent.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Error</h3>
                    <p style="color: #ccc; margin-bottom: 24px;">Website not found. Please try again.</p>
                    <button onclick="this.closest('#approvalModal').remove()" style="
                        padding: 12px 24px;
                        background: #fff;
                        color: #000;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;
            return;
        }
        
        // Update the website status to 'awaiting-final-payment'
        const websitesMap = { ...websites };
        websitesMap[websiteName].status = 'awaiting-final-payment';
        websitesMap[websiteName].previewApprovedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Save to Firebase
        await db.collection('users').doc(user.uid).set({
            websites: websitesMap,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Preview approved, status updated to awaiting-final-payment');
        
        // Transform modal into success message
        modalContent.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Preview Approved!</h3>
                <p style="color: #ccc; margin-bottom: 24px;">Your preview has been approved. You can now proceed to make your final payment to launch your website.</p>
                <button id="closeSuccessModal" style="
                    padding: 12px 32px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">OK</button>
            </div>
        `;
        
        // Add close handler
        document.getElementById('closeSuccessModal').addEventListener('click', async () => {
            modal.remove();
            style.remove();
            
            // Reload the websites to show updated status
            await loadUserWebsites(user);
        });
        
    } catch (error) {
        console.error('❌ Error approving preview:', error);
        
        // Show error in modal
        modalContent.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <h3 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">Error</h3>
                <p style="color: #ccc; margin-bottom: 24px;">Error approving preview. Please try again.</p>
                <button onclick="this.closest('#approvalModal').remove()" style="
                    padding: 12px 24px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                ">OK</button>
            </div>
        `;
    }
}

// Make functions available globally
window.createNewWebsite = createNewWebsite;
window.requestWebsite = requestWebsite;
window.beginWebsiteSetup = beginWebsiteSetup;
window.goToPricing = goToPricing;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.toggleReferralName = toggleReferralName;
window.viewSamplesInMyWebsites = viewSamplesInMyWebsites;
window.approvePreview = approvePreview;
window.makeFinalPayment = makeFinalPayment;
window.returnToMyWebsites = returnToMyWebsites;
window.goToMyWebsites = goToMyWebsites;
window.continueWebsite = continueWebsite;
window.viewWebsite = viewWebsite;
window.editWebsiteInfo = editWebsiteInfo;
window.completeEditsDirectly = completeEditsDirectly;
window.confirmEditWebsite = confirmEditWebsite;
window.cancelEditConfirm = cancelEditConfirm;
window.showDeleteWebsiteModal = showDeleteWebsiteModal;
window.cancelDeleteWebsite = cancelDeleteWebsite;
window.confirmDeleteWebsite = confirmDeleteWebsite;
window.reviewWebsite = reviewWebsite;
window.makeFinalPayment = makeFinalPayment;
window.removePhoto = removePhoto;
window.confirmPhotoDelete = confirmPhotoDelete;
window.cancelPhotoDelete = cancelPhotoDelete;
window.toggleSelectionMode = toggleSelectionMode;
window.selectAllPhotos = selectAllPhotos;
window.deleteSelectedPhotos = deleteSelectedPhotos;