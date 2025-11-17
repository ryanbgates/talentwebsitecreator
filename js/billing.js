// Billing Management
console.log('📄 Billing.js loaded');

// Initialize Stripe
let stripe;

// Show/Hide Billing Section
function toggleBillingSection() {
    const billingSection = document.getElementById('billingSection');
    const dashboardMenu = document.querySelector('.dashboard-menu');
    const dashboardNav = document.querySelector('.dashboard-nav');
    
    if (billingSection.style.display === 'none' || !billingSection.style.display) {
        // Show billing section, hide menu
        billingSection.style.display = 'block';
        dashboardNav.style.display = 'none';
        
        // Load billing data
        loadBillingData();
    } else {
        // Hide billing section, show menu
        billingSection.style.display = 'none';
        dashboardNav.style.display = 'block';
    }
}

// Load billing data from Stripe
async function loadBillingData() {
    console.log('💳 Loading billing data...');
    
    const user = window.FirebaseAuth?.auth?.currentUser;
    if (!user) {
        console.error('No user logged in');
        return;
    }
    
    try {
        // Show loading state
        showBillingLoading();
        
        // Get user data from Firestore
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        const userData = userDoc.data();
        const stripeCustomerId = userData?.stripeCustomerId;
        
        if (!stripeCustomerId) {
            console.log('No Stripe customer ID found');
            showNoBillingData();
            return;
        }
        
        // Call Cloud Function to get billing data using compat syntax
        const getBillingData = firebase.app().functions().httpsCallable('getBillingData');
        const result = await getBillingData();
        
        console.log('✅ Billing data received:', result.data);
        
        // Display the billing data
        displayBillingData(result.data);
        
    } catch (error) {
        console.error('Error loading billing data:', error);
        showBillingError(error.message);
    }
}

// Show loading state
function showBillingLoading() {
    const container = document.getElementById('billingContainer');
    container.innerHTML = `
        <div class="billing-loading">
            <div class="loading-spinner"></div>
            <p>Loading billing information...</p>
        </div>
    `;
}

// Show no billing data message
function showNoBillingData() {
    const container = document.getElementById('billingContainer');
    container.innerHTML = `
        <div class="billing-empty">
            <p>No billing information available yet.</p>
            <p>Your payment history will appear here once you make your first purchase.</p>
        </div>
    `;
}

// Show error message
function showBillingError(message) {
    const container = document.getElementById('billingContainer');
    container.innerHTML = `
        <div class="billing-error">
            <p>⚠️ Error loading billing data</p>
            <p>${message}</p>
            <button onclick="loadBillingData()" class="retry-button">Try Again</button>
        </div>
    `;
}

// Display billing data
function displayBillingData(data) {
    const container = document.getElementById('billingContainer');
    
    const { paymentHistory, subscriptions, paymentMethod } = data;
    
    let html = '';
    
    // Payment Method Section
    html += `
        <div class="billing-section">
            <h3>💳 Payment Method</h3>
            ${paymentMethod ? `
                <div class="payment-method-card">
                    <div class="payment-method-info">
                        <span class="card-brand">${paymentMethod.brand.toUpperCase()}</span>
                        <span class="card-last4">•••• ${paymentMethod.last4}</span>
                        <span class="card-expiry">Expires ${paymentMethod.exp_month}/${paymentMethod.exp_year}</span>
                    </div>
                    <button onclick="updatePaymentMethod()" class="update-payment-btn">Update Payment Method</button>
                </div>
            ` : `
                <div class="no-payment-method">
                    <p>No payment method on file</p>
                    <button onclick="addPaymentMethod()" class="add-payment-btn">Add Payment Method</button>
                </div>
            `}
        </div>
    `;
    
    // Active Subscriptions Section - filter out canceled subscriptions
    const activeSubscriptions = subscriptions ? subscriptions.filter(sub => sub.status !== 'canceled') : [];
    
    if (activeSubscriptions && activeSubscriptions.length > 0) {
        html += `
            <div class="billing-section">
                <h3>📅 Active Subscriptions</h3>
                <div class="subscriptions-list">
        `;
        
        activeSubscriptions.forEach(sub => {
            console.log('📅 Subscription in UI:', {
                id: sub.id,
                current_period_end: sub.current_period_end,
                productName: sub.plan.productName,
                websiteName: sub.websiteName
            });
            
            const nextBillingDate = new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const amount = (sub.plan.amount / 100).toFixed(2);
            const productName = sub.plan.productName || sub.plan.nickname || 'Subscription';
            const websiteName = sub.websiteName || 'Unknown Website';
            
            html += `
                <div class="subscription-card">
                    <div class="subscription-header">
                        <h4>${productName}</h4>
                        <span class="subscription-status ${sub.status}">${sub.status}</span>
                    </div>
                    <div class="subscription-details">
                        <p><strong>Website:</strong> ${websiteName}</p>
                        <p><strong>Amount:</strong> $${amount}/${sub.plan.interval}</p>
                        ${sub.cancel_at_period_end ? 
                            `<p class="cancellation-notice">⚠️ Cancels on ${nextBillingDate}</p>` : 
                            `<p><strong>Next billing:</strong> ${nextBillingDate}</p>`
                        }
                        <p class="manage-subscription-link">manage subscription in <a href="#" onclick="goToMyPlans(); return false;" class="my-plans-link">My Plans</a></p>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Payment History Section
    if (paymentHistory && paymentHistory.length > 0) {
        html += `
            <div class="billing-section">
                <h3>📜 Payment History</h3>
                <div class="payment-history">
                    <table class="payment-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        paymentHistory.forEach(payment => {
            const dateObj = new Date(payment.created * 1000);
            const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
            const year = dateObj.toLocaleDateString('en-US', { year: 'numeric' });
            const date = `${month} ${day},\n${year}`;
            
            const amount = (payment.amount / 100).toFixed(2);
            const statusClass = payment.status === 'succeeded' ? 'success' : payment.status === 'pending' ? 'pending' : 'failed';
            
            // Bold the main action part of the description
            let formattedDescription = payment.description || 'Payment';
            
            // Check for different payment types and bold the main part
            if (formattedDescription.startsWith('Final Payment')) {
                formattedDescription = formattedDescription.replace('Final Payment', '<strong>Final Payment</strong>');
            } else if (formattedDescription.startsWith('Website Build Deposit')) {
                formattedDescription = formattedDescription.replace('Website Build Deposit', '<strong>Website Build Deposit</strong>');
            } else if (formattedDescription.startsWith('Subscription Creation')) {
                formattedDescription = formattedDescription.replace('Subscription Creation', '<strong>Subscription Creation</strong>');
            } else if (formattedDescription.startsWith('Subscription Update')) {
                formattedDescription = formattedDescription.replace('Subscription Update', '<strong>Subscription Update</strong>');
            } else if (formattedDescription.startsWith('Subscription Payment')) {
                formattedDescription = formattedDescription.replace('Subscription Payment', '<strong>Subscription Payment</strong>');
            }
            
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${formattedDescription}</td>
                    <td>$${amount}</td>
                    <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="billing-section">
                <h3>📜 Payment History</h3>
                <div class="billing-empty">
                    <p>No payment history yet.</p>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Initialize custom scrollbar for payment history on mobile
    initPaymentHistoryScrollbar();
}

// Initialize custom scrollbar indicator for payment history (mobile only)
function initPaymentHistoryScrollbar() {
    const paymentHistory = document.querySelector('.payment-history');
    if (!paymentHistory) return;
    
    // Only add custom scrollbar on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;
    
    // Check if content is scrollable
    if (paymentHistory.scrollHeight <= paymentHistory.clientHeight) return;
    
    // Create custom scrollbar elements
    const scrollbarTrack = document.createElement('div');
    scrollbarTrack.className = 'custom-scrollbar-track';
    
    const scrollbarThumb = document.createElement('div');
    scrollbarThumb.className = 'custom-scrollbar-thumb';
    
    scrollbarTrack.appendChild(scrollbarThumb);
    paymentHistory.parentElement.style.position = 'relative';
    paymentHistory.parentElement.appendChild(scrollbarTrack);
    
    // Get the position of payment-history relative to its parent
    const historyRect = paymentHistory.getBoundingClientRect();
    const parentRect = paymentHistory.parentElement.getBoundingClientRect();
    const topOffset = historyRect.top - parentRect.top;
    
    // Set the track height to match the payment-history visible area
    scrollbarTrack.style.top = topOffset + 'px';
    scrollbarTrack.style.height = paymentHistory.clientHeight + 'px';
    scrollbarTrack.style.bottom = 'auto'; // Override bottom positioning
    
    // Calculate and update scrollbar thumb position and size
    function updateScrollbar() {
        const scrollPercentage = paymentHistory.scrollTop / (paymentHistory.scrollHeight - paymentHistory.clientHeight);
        const trackHeight = paymentHistory.clientHeight;
        const thumbHeight = Math.max((trackHeight / paymentHistory.scrollHeight) * trackHeight, 40);
        const maxThumbTop = trackHeight - thumbHeight;
        
        scrollbarThumb.style.height = thumbHeight + 'px';
        scrollbarThumb.style.top = (scrollPercentage * maxThumbTop) + 'px';
    }
    
    // Update scrollbar on scroll
    paymentHistory.addEventListener('scroll', updateScrollbar);
    
    // Initial update
    updateScrollbar();
}

// Update payment method
async function updatePaymentMethod(event) {
    console.log('💳 Opening payment method update...');
    
    // Show loading on the button
    const updateBtn = event ? event.target : document.querySelector('.update-payment-btn');
    const originalText = updateBtn.textContent;
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<span class="btn-spinner"></span> Loading...';
    
    try {
        // Initialize Stripe if not already done
        if (!stripe) {
            stripe = Stripe(getStripePublishableKey());
        }
        
        // Create modal HTML (hidden initially)
        const modal = document.createElement('div');
        modal.className = 'payment-method-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="payment-method-modal-content">
                <div class="payment-method-modal-header">
                    <h2>Update Payment Method</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="payment-method-modal-body">
                    <p>Enter your new card details:</p>
                    <div id="card-element-update" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin: 20px 0;"></div>
                    <div id="card-errors-update" style="color: #dc3545; margin-top: 10px;"></div>
                </div>
                <div class="payment-method-modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-update" id="updateCardBtn">Update Card</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Function to cleanup and restore button
        const cleanup = () => {
            modal.remove();
            updateBtn.disabled = false;
            updateBtn.textContent = originalText;
        };
        
        // Add close button handler
        modal.querySelector('.close-modal').onclick = cleanup;
        modal.querySelector('.btn-cancel').onclick = cleanup;
        
        // Create and mount card element
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                }
            }
        });
        cardElement.mount('#card-element-update');
        
        // Wait for card element to be fully ready
        await new Promise(resolve => {
            cardElement.on('ready', resolve);
        });
        
        // Show modal with fade-in animation
        modal.style.transition = 'opacity 0.3s ease-in-out';
        modal.style.opacity = '1';
        
        // Re-enable the button and restore text
        updateBtn.disabled = false;
        updateBtn.textContent = originalText;
        
        // Handle card errors
        cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors-update');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
        
        // Handle update button click
        document.getElementById('updateCardBtn').onclick = async () => {
            const updateBtn = document.getElementById('updateCardBtn');
            updateBtn.disabled = true;
            updateBtn.textContent = 'Updating...';
            
            try {
                // Create a setup intent via Cloud Function
                const createSetupIntent = firebase.app().functions().httpsCallable('createSetupIntent');
                const result = await createSetupIntent();
                const { clientSecret } = result.data;
                
                // Confirm card setup with the card element
                const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                    payment_method: {
                        card: cardElement
                    }
                });
                
                if (error) {
                    console.error('Error updating payment method:', error);
                    alert('Failed to update payment method: ' + error.message);
                    updateBtn.disabled = false;
                    updateBtn.textContent = 'Update Card';
                } else {
                    console.log('✅ Payment method updated:', setupIntent.payment_method);
                    
                    // Show success animation
                    updateBtn.textContent = '✓ Success!';
                    updateBtn.classList.add('success');
                    
                    // Wait for animation, then close modal and reload
                    setTimeout(() => {
                        modal.remove();
                        loadBillingData(); // Reload billing data
                    }, 1500);
                }
            } catch (error) {
                console.error('Error updating payment method:', error);
                alert('Failed to update payment method. Please try again.');
                updateBtn.disabled = false;
                updateBtn.textContent = 'Update Card';
            }
        };
        
    } catch (error) {
        console.error('Error updating payment method:', error);
        alert('Failed to update payment method. Please try again.');
    }
}

// Add payment method (for users without one)
async function addPaymentMethod() {
    // Same as update payment method
    updatePaymentMethod();
}

// Navigate to My Plans page
function goToMyPlans() {
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
        const myPlansUrl = isMobile ? '../html/my-plans-mobile.html' : '../html/my-plans-desktop.html';
        window.location.href = myPlansUrl;
    }
}

// Make functions globally available
window.toggleBillingSection = toggleBillingSection;
window.loadBillingData = loadBillingData;
window.updatePaymentMethod = updatePaymentMethod;
window.addPaymentMethod = addPaymentMethod;
window.goToMyPlans = goToMyPlans;
