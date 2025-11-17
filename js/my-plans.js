// My Plans Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 My Plans DOM loaded - starting initialization');
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('my-plans', () => {
            // Custom initialization after header is set up
            initMyPlansCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initMyPlansPageFallback();
    }
});

// Custom initialization function called after header setup
function initMyPlansCustom() {
    // Wait a moment for everything to be ready, then show the page
    setTimeout(() => {
        checkAuthAndLoadPlans();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initMyPlansPageFallback() {
    console.log('My Plans Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('my-plans');
        }
        // Show page after a delay
        checkAuthAndLoadPlans();
    }, 800);
}

// Check authentication and load plans
async function checkAuthAndLoadPlans() {
    console.log('🔐 Checking authentication for My Plans page');
    
    // Wait for Firebase Auth to be available
    let attempts = 0;
    while (attempts < 50) { // 5 second timeout
        if (typeof firebase !== 'undefined' && firebase.auth) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (attempts >= 50) {
        console.error('❌ Firebase Auth not available');
        showMyPlansPage();
        return;
    }
    
    // Check current user
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log('✅ User authenticated:', user.email);
            await loadUserPlans(user);
        } else {
            console.log('⚠️ No user logged in, redirecting to pricing');
            // Redirect to pricing page if not logged in
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const pricingUrl = isMobile ? 'pricing-mobile.html' : 'pricing-desktop.html';
            window.location.href = pricingUrl;
        }
    });
}

// Load user's plans from Firestore
async function loadUserPlans(user) {
    console.log('📊 Loading plans for user:', user.email);
    
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        if (!userDoc.exists) {
            console.log('⚠️ No user document found');
            displayNoPlans();
            showMyPlansPage();
            return;
        }
        
        const userData = userDoc.data();
        const websitesMap = userData.websites || {};
        
        // Convert websites map to array with names
        const websitesArray = Object.entries(websitesMap).map(([name, data]) => ({
            name: name,
            ...data
        }));
        
        if (websitesArray.length === 0) {
            console.log('⚠️ No websites found for user');
            displayNoPlans();
        } else {
            console.log(`✅ Found ${websitesArray.length} website(s)`);
            displayPlans(websitesArray);
        }
        
        showMyPlansPage();
    } catch (error) {
        console.error('❌ Error loading plans:', error);
        displayError();
        showMyPlansPage();
    }
}

// Display plans
function displayPlans(websites) {
    const container = document.getElementById('websitesContainer');
    if (!container) return;
    
    // Clear loading message
    container.innerHTML = '';
    
    // Sort websites by creation date (newest first)
    const sortedWebsites = [...websites].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA; // Descending order (newest first)
    });
    
    // Create cards for each website (now sorted)
    sortedWebsites.forEach((website) => {
        const card = createWebsiteCard(website);
        container.appendChild(card);
    });
    
    console.log(`✅ Displayed ${sortedWebsites.length} plan(s) (sorted by newest first)`);
}

// Create website card
function createWebsiteCard(website) {
    const card = document.createElement('div');
    card.className = 'website-card';
    
    const planType = getPlanType(website.services);
    
    // Build status warning for pending cancellation or downgrade
    let statusWarning = '';
    
    // Check for pending cancellation (takes priority) - use currentPeriodEnd
    if (website.pendingCancellation && website.currentPeriodEnd) {
        const cancelDate = new Date(website.currentPeriodEnd * 1000);
        const formattedDate = cancelDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        statusWarning = `
            <div class="plan-item status-warning">
                <span class="warning-text">Cancels on ${formattedDate}</span>
            </div>
        `;
    }
    // Check for pending downgrade
    else if (website.pendingDowngrade && typeof website.pendingDowngrade === 'object') {
        const downgradeDate = new Date(website.pendingDowngrade.effectiveAt * 1000);
        const formattedDate = downgradeDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        statusWarning = `
            <div class="plan-item status-warning">
                <span class="warning-text">Downgrades to ${website.pendingDowngrade.planName} on ${formattedDate}</span>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="card-header">
            <h2>${website.name}</h2>
        </div>
        
        <div class="card-body">
            <div class="plan-info">
                <div class="plan-item">
                    <span class="label">Service Plan:</span>
                    <span class="value plan-${planType.toLowerCase().replace(/\s+/g, '-')}">${planType}</span>
                </div>
                ${statusWarning}
            </div>
            
            <button class="btn-update-plan" onclick="updateServicePlan('${website.name}')">
                Update Service Plan
            </button>
        </div>
    `;
    
    return card;
}

// Helper functions
function getPlanType(services) {
    if (!services) return 'No Service';
    if (services.complete) return 'Complete Plan';
    if (services.hosting && services.updates) return 'Complete Plan';
    if (services.hosting) return 'Server Hosting';
    if (services.updates) return 'Unlimited Edits';
    return 'No Service';
}

function getStatusEmoji(status) {
    const emojiMap = {
        'awaiting-info': '⚠️',
        'in-progress': '🚀',
        'ready-for-review': '👀',
        'live': '✅',
        'pending': '⏳'
    };
    return emojiMap[status] || '📄';
}

function getStatusText(status) {
    const textMap = {
        'awaiting-info': 'Awaiting Information',
        'in-progress': 'In Progress',
        'ready-for-review': 'Ready for Review',
        'live': 'Live',
        'pending': 'Pending'
    };
    return textMap[status] || 'Unknown';
}

function displayNoPlans() {
    const container = document.getElementById('websitesContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-plans-message">
            <h2>No Plans Yet</h2>
            <p>You haven't purchased any websites yet. Head over to the pricing page to get started!</p>
            <button class="btn-view-pricing" onclick="goToPricing()">View Pricing</button>
        </div>
    `;
}

function displayError() {
    const container = document.getElementById('websitesContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <h2>Error Loading Plans</h2>
            <p>We couldn't load your plans. Please try refreshing the page.</p>
        </div>
    `;
}

// Show the page with smooth fade-in
function showMyPlansPage() {
    // Hide loading screen with fade-out effect
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        console.log('✨ Hiding loading screen with fade-out');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 800);
    }
    
    // Show main content
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
        console.log('✨ Showing My Plans page content');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Navigation functions
function goToMyWebsites() {
    console.log('Navigating to My Websites');
    
    if (typeof window.PageUtils !== 'undefined') {
        const url = window.PageUtils.getDeviceSpecificUrl('my-websites');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = isMobile ? 'my-websites-mobile.html' : 'my-websites-desktop.html';
        window.location.href = url;
    }
}

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

function addAnotherWebsite() {
    console.log('Add another website clicked');
    // Navigate to pricing page to purchase another website
    goToPricing();
}

// Placeholder function for updating service plan
function updateServicePlan(websiteName) {
    console.log('Update service plan clicked for:', websiteName);
    showUpdatePlanModal(websiteName);
}

// Global variable to track current website being updated
let currentUpdatingWebsite = null;
let currentWebsiteData = null;

// Show the update plan modal
async function showUpdatePlanModal(websiteName) {
    console.log('📋 Opening update plan modal for:', websiteName);
    
    currentUpdatingWebsite = websiteName;
    
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('❌ No user logged in');
        return;
    }
    
    try {
        // Get website data from Firestore
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        if (!userDoc.exists) {
            console.error('❌ User document not found');
            return;
        }
        
        const userData = userDoc.data();
        const websitesMap = userData.websites || {};
        const websiteData = websitesMap[websiteName];
        
        if (!websiteData) {
            console.error('❌ Website not found:', websiteName);
            return;
        }
        
        currentWebsiteData = websiteData;
        
        // Check if user has pending cancellation or pending downgrade
        const hasPendingCancellation = websiteData.pendingCancellation === true;
        const hasPendingDowngrade = websiteData.pendingDowngrade && typeof websiteData.pendingDowngrade === 'object';
        
        // Show modal
        const modal = document.getElementById('updatePlanModal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        // Display current plan
        const currentPlanName = document.getElementById('currentPlanName');
        if (currentPlanName) {
            const planText = getPlanType(websiteData.services);
            currentPlanName.textContent = planText;
        }
        
        // Highlight current plan and handle button states (now handles pending cancellation and downgrades)
        highlightCurrentPlan(websiteData.services, websiteData);
        
        console.log('✅ Update plan modal opened');
    } catch (error) {
        console.error('❌ Error opening update plan modal:', error);
        alert('Error loading plan information. Please try again.');
    }
}

// Show overlay when user has pending cancellation
function showPendingCancellationOverlay(websiteData) {
    const modal = document.getElementById('updatePlanModal');
    if (!modal) return;
    
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;
    
    // Get cancellation effective date
    const effectiveAt = websiteData.cancellationEffectiveAt;
    let dateText = 'the end of your billing period';
    
    if (effectiveAt) {
        const effectiveDate = new Date(effectiveAt * 1000);
        dateText = effectiveDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Replace modal content with overlay message
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 60px 40px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">⏳</div>
            <h3 style="font-family: 'Oswald', sans-serif; font-size: 1.8rem; margin-bottom: 20px; color: var(--text-primary);">
                Pending Cancellation
            </h3>
            <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.6;">
                You cannot update your plan while you have a pending cancellation.
            </p>
            <p style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 30px; line-height: 1.6;">
                Your subscription will be cancelled on <strong>${dateText}</strong>. After that date, you can purchase a new plan.
            </p>
            <button class="btn-select-plan" onclick="closeUpdatePlanModal()" style="margin-top: 20px;">
                Close
            </button>
        </div>
    `;
}



// Helper to get plan name from plan type
function getPlanNameFromType(planType) {
    const planNames = {
        'hosting': 'Server Hosting',
        'updates': 'Unlimited Edits',
        'complete': 'Complete Plan',
        'none': 'No Service'
    };
    return planNames[planType] || 'New Plan';
}

// Highlight the current plan
function highlightCurrentPlan(services, websiteData) {
    const planOptions = document.querySelectorAll('.plan-option');
    
    // Determine current plan type
    let currentPlan = 'none';
    if (services) {
        if (services.complete) {
            currentPlan = 'complete';
        } else if (services.hosting && services.updates) {
            currentPlan = 'complete';
        } else if (services.hosting) {
            currentPlan = 'hosting';
        } else if (services.updates) {
            currentPlan = 'updates';
        }
    }
    
    // Check if there's a pending cancellation or pending downgrade
    const hasPendingCancellation = currentWebsiteData?.pendingCancellation === true;
    const hasPendingDowngrade = currentWebsiteData?.pendingDowngrade && typeof currentWebsiteData.pendingDowngrade === 'object';
    
    // Get pending downgrade date if applicable
    let downgradeDate = '';
    if (hasPendingDowngrade) {
        const effectiveAt = currentWebsiteData.pendingDowngrade.effectiveAt;
        if (effectiveAt) {
            const effectiveDate = new Date(effectiveAt * 1000);
            downgradeDate = effectiveDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        } else {
            downgradeDate = 'end of billing period';
        }
    }
    
    // Handle pending cancellation state - allow reactivation and plan switching
    if (hasPendingCancellation) {
        planOptions.forEach(option => {
            const planType = option.getAttribute('data-plan');
            const button = option.querySelector('.btn-select-plan');
            
            if (planType === currentPlan) {
                // Current plan - ENABLE reactivation
                option.style.borderColor = '#10b981';
                option.style.background = '#f0fdf4';
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Reactivate Plan';
                    button.style.background = '#10b981';
                    button.style.cursor = 'pointer';
                }
            } else if (planType === 'none') {
                // Cancel button - DISABLE (already canceling)
                option.style.background = '#f9fafb';
                if (button) {
                    button.disabled = true;
                    button.textContent = 'Cancellation Pending';
                    button.style.background = '#d1d5db';
                    button.style.cursor = 'not-allowed';
                }
            } else {
                // Other plans - ENABLE for switching
                option.style.background = 'white';
                if (button) {
                    button.disabled = false;
                    button.textContent = 'Switch to This Plan';
                    button.style.background = '';
                    button.style.cursor = 'pointer';
                    button.className = 'btn-select-plan';
                }
            }
        });
        return; // Exit early - don't process other conditions
    }
    
    // Update UI for each plan option (normal flow when no pending cancellation)
    planOptions.forEach(option => {
        const planType = option.getAttribute('data-plan');
        const button = option.querySelector('.btn-select-plan');
        
        // Disable current plan
        if (planType === currentPlan) {
            option.style.borderColor = '#10b981';
            option.style.background = '#f0fdf4';
            if (button) {
                button.disabled = true;
                button.textContent = 'Current Plan';
                button.style.background = '#6b7280';
                button.style.cursor = 'not-allowed';
            }
        } 
        // Disable cancel button if already pending cancellation
        else if (planType === 'none' && hasPendingCancellation) {
            option.style.background = '#f9fafb';
            if (button) {
                button.disabled = true;
                button.textContent = 'Cancellation Pending';
                button.style.background = '#d1d5db';
                button.style.cursor = 'not-allowed';
            }
        }
        // Disable all plans except cancel if there's a pending downgrade
        else if (hasPendingDowngrade && planType !== 'none') {
            option.style.background = '#f9fafb';
            if (button) {
                button.disabled = true;
                button.textContent = `Unavailable until ${downgradeDate}`;
                button.style.background = '#d1d5db';
                button.style.cursor = 'not-allowed';
            }
        }
        // Disable the opposite $9.99 plan (can't switch hosting ↔ updates directly)
        else if ((currentPlan === 'hosting' && planType === 'updates') || 
                 (currentPlan === 'updates' && planType === 'hosting')) {
            option.style.background = '#f9fafb';
            if (button) {
                button.disabled = true;
                button.textContent = 'Not Available';
                button.style.background = '#d1d5db';
                button.style.cursor = 'not-allowed';
            }
        } 
        // Enable all other plans
        else {
            option.style.background = 'white';
            if (button) {
                button.disabled = false;
                button.style.cursor = 'pointer';
                button.style.background = '';
                
                // Reset button text
                if (planType === 'none') {
                    button.textContent = 'Cancel Service';
                    button.className = 'btn-select-plan btn-cancel-plan';
                } else {
                    button.textContent = 'Select Plan';
                    button.className = 'btn-select-plan';
                }
            }
        }
    });
}

// Close the update plan modal
function closeUpdatePlanModal() {
    const modal = document.getElementById('updatePlanModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentUpdatingWebsite = null;
    currentWebsiteData = null;
}

// Global variables for plan change confirmation
let pendingPlanChange = null;

// Determine if plan change is an upgrade, downgrade, reactivation, or cancellation
function getPlanChangeType(currentServices, newPlanType) {
    // Plan hierarchy: none < hosting/updates < complete
    const planLevels = {
        none: 0,
        hosting: 1,
        updates: 1, // Same level as hosting
        complete: 2
    };
    
    // Check if there's a pending cancellation
    const hasPendingCancellation = currentWebsiteData?.pendingCancellation === true;
    
    // Determine current plan level
    let currentLevel = 0;
    if (currentServices.complete) {
        currentLevel = 2;
    } else if (currentServices.updates || currentServices.hosting) {
        currentLevel = 1;
    }
    
    const newLevel = planLevels[newPlanType] || 0;
    
    // Detect reactivation (same plan while pending cancellation)
    if (hasPendingCancellation && currentLevel === newLevel && newLevel > 0) {
        return 'reactivation';
    }
    
    if (newLevel > currentLevel) {
        return 'upgrade';
    } else if (newLevel < currentLevel) {
        return 'downgrade';
    } else {
        return 'same'; // Switching between hosting and updates (same price)
    }
}

// Select a plan (called when user clicks a plan button)
function selectPlan(planType, planName, price) {
    console.log('📦 Plan selected:', { planType, planName, price });
    
    if (!currentUpdatingWebsite) {
        console.error('❌ No website selected');
        return;
    }
    
    // Determine if this is an upgrade or downgrade
    const currentServices = currentWebsiteData.services || {};
    const changeType = getPlanChangeType(currentServices, planType);
    
    console.log('📊 Plan change type:', changeType);
    
    // Store pending plan change with change type
    pendingPlanChange = { 
        planType, 
        planName, 
        price,
        changeType
    };
    
    // Get current plan name for display
    const currentPlanText = getPlanType(currentServices);
    
    // Check if user has pending cancellation for special messaging
    const hasPendingCancellation = currentWebsiteData?.pendingCancellation === true;
    
    // Build confirmation message based on change type
    let confirmMessage = '';
    let confirmTitle = 'Confirm Plan Change';
    
    if (planType === 'none') {
        confirmTitle = 'Cancel Service Plan';
        confirmMessage = 'Are you sure you want to cancel your service plan? Your current plan will remain active until the end of your billing period, then it will be cancelled.';
    } else if (hasPendingCancellation && changeType === 'reactivation') {
        confirmTitle = 'Reactivate Plan';
        confirmMessage = `This will cancel your scheduled cancellation and keep your ${planName} subscription active. There will be no charge, and your plan will continue as normal.`;
    } else if (hasPendingCancellation && changeType === 'downgrade') {
        confirmTitle = 'Change Plan';
        confirmMessage = `This will cancel your scheduled cancellation and switch you to ${planName} at the end of your billing period. Your current plan will remain active until then. The new plan will be $${price}/month.`;
    } else if (hasPendingCancellation && changeType === 'upgrade') {
        confirmTitle = 'Upgrade Plan';
        confirmMessage = `This will cancel your scheduled cancellation and upgrade you to ${planName} immediately. You'll be charged approximately $5.00 now for the upgrade, and your next billing cycle will be $${price}/month.`;
    } else if (changeType === 'upgrade') {
        confirmTitle = 'Upgrade Plan';
        
        // If user has NO current subscription (No Service), charge full price
        // Otherwise, charge proration amount (approximately $5)
        const hasNoSubscription = !currentWebsiteData?.subscriptionId;
        
        if (hasNoSubscription) {
            confirmMessage = `You will be charged $${price} now to start your subscription using your saved payment method. You'll get immediate access to all plan features.`;
        } else {
            confirmMessage = `You will be charged approximately $5.00 now for the upgrade, and you'll get immediate access to the new plan features. Your next billing cycle will be $${price}/month.`;
        }
    } else if (changeType === 'downgrade') {
        confirmTitle = 'Downgrade Plan';
        confirmMessage = `Your current plan will remain active until the end of your billing period. The new plan ($${price}/month) will take effect on your next renewal date.`;
    } else {
        confirmTitle = 'Switch Plan';
        confirmMessage = `Switch from "${currentPlanText}" to "${planName}" for $${price}/month? Your plan will be updated immediately.`;
    }
    
    // Update modal content
    document.getElementById('confirmModalTitle').textContent = confirmTitle;
    document.getElementById('confirmModalMessage').textContent = confirmMessage;
    
    // Show confirmation modal
    document.getElementById('confirmPlanChangeModal').style.display = 'flex';
}

// Confirm the plan change (user clicked Confirm)
async function confirmPlanChange() {
    console.log('✅ User confirmed plan change');
    
    if (!pendingPlanChange) {
        console.error('❌ No pending plan change');
        return;
    }
    
    // Hide confirmation modal
    document.getElementById('confirmPlanChangeModal').style.display = 'none';
    
    const { planType, planName, price } = pendingPlanChange;
    
    // Show loading state in main modal
    const modal = document.getElementById('updatePlanModal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 20px;"></div>
                    <p style="font-size: 1.1rem; color: var(--text-primary);">Updating your plan...</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary);">This may take a few moments.</p>
                </div>
            `;
        }
    }
    
    try {
        await updateWebsitePlan(currentUpdatingWebsite, planType, planName, price);
    } catch (error) {
        console.error('❌ Error updating plan:', error);
        alert('Error updating plan: ' + error.message);
        closeUpdatePlanModal();
    }
    
    // Clear pending change
    pendingPlanChange = null;
}

// Cancel the plan change (user clicked Cancel)
function cancelPlanChange() {
    console.log('❌ User cancelled plan change');
    
    // Hide confirmation modal
    document.getElementById('confirmPlanChangeModal').style.display = 'none';
    
    // Clear pending change
    pendingPlanChange = null;
}

// Update the website's plan in Firestore and Stripe
async function updateWebsitePlan(websiteName, planType, planName, price) {
    console.log('🔄 Updating website plan...', { websiteName, planType, planName, price });
    
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const db = firebase.firestore();
    const functions = window.FirebaseServices ? window.FirebaseServices.functions : null;
    
    if (!functions) {
        throw new Error('Firebase Functions not available');
    }
    
    try {
        // Get current subscription ID
        const subscriptionId = currentWebsiteData.subscriptionId;
        
        // Map plan type to Stripe price ID (Live Mode)
        const priceIds = {
            hosting: 'price_1STRlFPzvK6hwHhJfFQb1ZHg',
            updates: 'price_1STRlqPzvK6hwHhJtXi6NPKF',
            complete: 'price_1STRmUPzvK6hwHhJitDjZSOB',
            none: null // Cancel subscription
        };
        
        const newPriceId = priceIds[planType];
        let result;
        let isNewSubscription = false; // Track if this is a new subscription
        
        // If no subscription exists, CREATE one using their saved payment method
        if (!subscriptionId) {
            console.log('📝 No subscription - creating new subscription with saved payment method');
            
            if (planType === 'none') {
                throw new Error('Cannot cancel a subscription that does not exist');
            }
            
            // Create subscription using their existing customer ID and saved payment method
            const createSubscription = functions.httpsCallable('createSubscription');
            result = await createSubscription({
                priceId: newPriceId,
                websiteName: websiteName // Pass website name to link subscription
            });
            
            console.log('✅ New subscription created:', result.data);
            isNewSubscription = true; // Mark as new subscription
            
        } else {
            // Subscription exists - UPDATE it
            console.log('🔄 Subscription exists - updating subscription');
            
            const updateSubscription = functions.httpsCallable('updateSubscription');
            result = await updateSubscription({
                subscriptionId: subscriptionId,
                newPriceId: newPriceId,
                planType: planType,
                changeType: pendingPlanChange.changeType // Pass upgrade/downgrade info
            });
            
            console.log('✅ Stripe subscription updated:', result.data);
        }
        
        // Only update Firestore immediately for upgrades and same-level changes
        // For downgrades, keep current plan until end of billing period
        // Skip Firestore update if this was a new subscription (Cloud Function already handled it)
        const changeType = pendingPlanChange.changeType;
        const isCancellation = planType === 'none';
        const isDowngrade = changeType === 'downgrade' && !isCancellation;
        const isReactivation = changeType === 'reactivation';
        
        if (isNewSubscription) {
            console.log('✅ New subscription created - Firestore already updated by Cloud Function');
            
            // Update services in Firestore for new subscription
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const websitesMap = { ...userData.websites };
                
                if (websitesMap[websiteName]) {
                    // Update services based on plan type
                    const newServices = {
                        hosting: planType === 'hosting' || planType === 'complete',
                        updates: planType === 'updates' || planType === 'complete',
                        complete: planType === 'complete'
                    };
                    
                    websitesMap[websiteName].services = newServices;
                    websitesMap[websiteName].updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await userRef.update({
                        websites: websitesMap,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Services updated in Firestore for new subscription');
                }
            }
        } else if (isReactivation) {
            // For reactivation, just remove the cancellation flags (webhook will handle this, but we can do it immediately)
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const websitesMap = { ...userData.websites };
                
                if (websitesMap[websiteName]) {
                    // Remove cancellation flags
                    delete websitesMap[websiteName].pendingCancellation;
                    delete websitesMap[websiteName].cancellationScheduledAt;
                    delete websitesMap[websiteName].cancellationEffectiveAt;
                    
                    websitesMap[websiteName].updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await userRef.update({
                        websites: websitesMap,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Cancellation flags removed - subscription reactivated');
                }
            }
        } else if (!isDowngrade) {
            // Update Firestore immediately for upgrades and same-level changes
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const websitesMap = { ...userData.websites };
                
                if (websitesMap[websiteName]) {
                    // If canceling, DON'T update services - just mark for cancellation
                    if (isCancellation) {
                        websitesMap[websiteName].pendingCancellation = true;
                        websitesMap[websiteName].cancellationScheduledAt = firebase.firestore.FieldValue.serverTimestamp();
                        websitesMap[websiteName].cancellationEffectiveAt = result.data.currentPeriodEnd;
                        
                        // Clear any pending downgrade since cancellation overrides it
                        if (websitesMap[websiteName].pendingDowngrade) {
                            delete websitesMap[websiteName].pendingDowngrade;
                            console.log('🗑️ Cleared pending downgrade (overridden by cancellation)');
                        }
                    } else {
                        // Update services based on plan type (NOT for cancellations)
                        const newServices = {
                            hosting: planType === 'hosting' || planType === 'complete',
                            updates: planType === 'updates' || planType === 'complete',
                            complete: planType === 'complete'
                        };
                        
                        websitesMap[websiteName].services = newServices;
                        
                        // Update subscription ID if it changed
                        if (result.data.subscriptionId) {
                            websitesMap[websiteName].subscriptionId = result.data.subscriptionId;
                        }
                        
                        // Remove cancellation timestamps if they exist (user reversed cancellation via upgrade)
                        if (websitesMap[websiteName].cancellationScheduledAt) {
                            delete websitesMap[websiteName].cancellationScheduledAt;
                            console.log('🗑️ Cleared cancellationScheduledAt (upgrade during cancellation)');
                        }
                        if (websitesMap[websiteName].cancellationEffectiveAt) {
                            delete websitesMap[websiteName].cancellationEffectiveAt;
                            console.log('🗑️ Cleared cancellationEffectiveAt (upgrade during cancellation)');
                        }
                    }
                    
                    websitesMap[websiteName].updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await userRef.update({
                        websites: websitesMap,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Firestore updated with new plan (immediate)');
                }
            }
        } else {
            // For downgrades, store the scheduled change but don't update services yet
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const websitesMap = { ...userData.websites };
                
                if (websitesMap[websiteName]) {
                    // Store the pending downgrade info
                    websitesMap[websiteName].pendingDowngrade = {
                        planType: planType,
                        planName: planName,
                        scheduledAt: firebase.firestore.FieldValue.serverTimestamp(),
                        effectiveAt: result.data.currentPeriodEnd
                    };
                    
                    // Remove cancellation timestamps if they exist (user switched during cancellation)
                    if (websitesMap[websiteName].cancellationScheduledAt) {
                        delete websitesMap[websiteName].cancellationScheduledAt;
                        console.log('🗑️ Cleared cancellationScheduledAt (downgrade during cancellation)');
                    }
                    if (websitesMap[websiteName].cancellationEffectiveAt) {
                        delete websitesMap[websiteName].cancellationEffectiveAt;
                        console.log('🗑️ Cleared cancellationEffectiveAt (downgrade during cancellation)');
                    }
                    
                    websitesMap[websiteName].updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await userRef.update({
                        websites: websitesMap,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Firestore updated with scheduled downgrade (will take effect at period end)');
                }
            }
        }
        
        // Show success message
        const modal = document.getElementById('updatePlanModal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                let successMessage = '';
                
                if (isCancellation) {
                    successMessage = 'Your service plan will be cancelled at the end of your billing period.';
                } else if (isReactivation) {
                    successMessage = 'Your subscription has been reactivated! Your plan will continue as normal.';
                } else if (isDowngrade) {
                    successMessage = `Your plan will be updated to <strong>${planName}</strong> at the end of your billing period. You'll continue to have access to your current plan until then.`;
                } else {
                    successMessage = `Your service plan has been successfully updated to <strong>${planName}</strong>.`;
                }
                
                modalBody.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                        <h3 style="font-family: 'Oswald', sans-serif; font-size: 1.5rem; margin-bottom: 10px;">
                            ${isDowngrade || isCancellation ? 'Plan Change Scheduled!' : isReactivation ? 'Plan Reactivated!' : 'Plan Updated!'}
                        </h3>
                        <p style="color: var(--text-secondary); margin-bottom: 20px;">
                            ${successMessage}
                        </p>
                        <button class="btn-select-plan" onclick="closeUpdatePlanModal(); location.reload();">Close</button>
                    </div>
                `;
            }
        }
        
        console.log('✅ Plan update complete');
        
    } catch (error) {
        console.error('❌ Error in updateWebsitePlan:', error);
        throw error;
    }
}

// Make functions globally available
window.goToMyWebsites = goToMyWebsites;
window.goToPricing = goToPricing;
window.addAnotherWebsite = addAnotherWebsite;
window.updateServicePlan = updateServicePlan;

// Add goToMyPlans for header navigation
window.goToMyPlans = function() {
    console.log('Navigating to My Plans');
    
    if (typeof window.PageUtils !== 'undefined') {
        const url = window.PageUtils.getDeviceSpecificUrl('my-plans');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = isMobile ? 'my-plans-mobile.html' : 'my-plans-desktop.html';
        window.location.href = url;
    }
};
