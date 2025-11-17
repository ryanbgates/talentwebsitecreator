// Checkout Modal Handler
class CheckoutModal {
    constructor() {
        this.modal = null;
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.currentPlan = null;
        this.promoCodeId = null;
        this.promoDiscount = null;
        this.planListenersAdded = false;
        this.usedReferralCode = null; // Track if user used a referral code
        this.savedPaymentMethod = null; // Track saved payment method
        this.useSavedCard = false; // Whether to use saved card
    }

    async init() {
        console.log('💳 CheckoutModal.init() called');
        
        // Wait for modal HTML to be loaded
        await this.waitForModal();
        
        // Check if Stripe is available
        if (typeof Stripe === 'undefined') {
            console.error('❌ Stripe.js not loaded');
            return;
        }
        
        // Check if STRIPE_CONFIG is available
        if (typeof STRIPE_CONFIG === 'undefined') {
            console.error('❌ STRIPE_CONFIG not loaded');
            return;
        }
        
        console.log('✅ Stripe and config available, initializing...');
        
        // Initialize Stripe with the correct publishable key
        const publishableKey = getStripePublishableKey();
        console.log('🔑 Using Stripe publishable key:', publishableKey?.substring(0, 20) + '...');
        
        this.stripe = Stripe(publishableKey);
        this.elements = this.stripe.elements();

        // Create card element
        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1a1a1a',
                    fontFamily: '"Inter", sans-serif',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#dc3545',
                },
            },
        });

        // Mount card element
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            this.cardElement.mount('#card-element');
            console.log('✅ Stripe card element mounted');
        } else {
            console.error('❌ Card element container not found');
        }

        // Handle real-time validation errors
        this.cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });

        this.modal = document.getElementById('checkoutModal');
        console.log('✅ Checkout modal initialized:', !!this.modal);
        
        // Add dynamic input width adjustment
        this.setupDynamicInputWidth();
    }
    
    setupDynamicInputWidth() {
        const websiteNameInput = document.getElementById('websiteName');
        if (!websiteNameInput) return;
        
        // Function to adjust input width based on content
        const adjustWidth = () => {
            const value = websiteNameInput.value || websiteNameInput.placeholder;
            // Create a temporary span to measure text width
            const tempSpan = document.createElement('span');
            tempSpan.style.font = window.getComputedStyle(websiteNameInput).font;
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.textContent = value;
            document.body.appendChild(tempSpan);
            
            // Set width based on content, with min and max constraints
            const textWidth = tempSpan.offsetWidth + 20; // Add some padding
            const newWidth = Math.max(150, Math.min(400, textWidth));
            websiteNameInput.style.width = newWidth + 'px';
            
            document.body.removeChild(tempSpan);
        };
        
        // Adjust on input
        websiteNameInput.addEventListener('input', adjustWidth);
        
        // Initial adjustment
        adjustWidth();
    }
    
    async waitForModal() {
        console.log('⏳ Waiting for checkout modal HTML to load...');
        let attempts = 0;
        return new Promise((resolve) => {
            const checkModal = () => {
                attempts++;
                const modalElement = document.getElementById('checkoutModal');
                if (modalElement) {
                    console.log('✅ Checkout modal HTML found after', attempts, 'attempts');
                    resolve();
                } else if (attempts > 50) {
                    console.error('❌ Timeout waiting for checkout modal HTML');
                    resolve(); // Resolve anyway to prevent hanging
                } else {
                    setTimeout(checkModal, 100);
                }
            };
            checkModal();
        });
    }

    show(planType) {
        // Check if modal is initialized
        if (!this.modal) {
            console.error('❌ Checkout modal not initialized');
            alert('Checkout system not ready. Please refresh the page and try again.');
            return;
        }
        
        this.currentPlan = planType;
        this.promoCodeId = null;
        this.promoDiscount = null;
        this.isFinalPayment = false; // Reset final payment flag

        // Reset website name section to input mode
        const websiteNameSection = document.querySelector('.website-name-section');
        if (websiteNameSection) {
            const wrapper = websiteNameSection.querySelector('.website-name-wrapper');
            const hint = websiteNameSection.querySelector('.input-hint');
            const displayText = websiteNameSection.querySelector('.website-name-display');
            
            // Show input wrapper and hint
            if (wrapper) wrapper.style.display = 'inline-flex';
            if (hint) hint.style.display = 'block';
            
            // Hide display text if it exists
            if (displayText) displayText.style.display = 'none';
        }

        // Reset website name input
        const websiteNameInput = document.getElementById('websiteName');
        if (websiteNameInput) {
            websiteNameInput.value = '';
            websiteNameInput.disabled = false;
            websiteNameInput.style.opacity = '1';
            websiteNameInput.style.cursor = 'text';
        }

        // Reset promo code input and message
        document.getElementById('promoCode').value = '';
        const promoMessage = document.getElementById('promoMessage');
        promoMessage.className = 'promo-message';
        promoMessage.textContent = '';
        
        // Check if user has already used a promo code
        this.checkPromoEligibility();
        
        // Reset final payment discount
        this.removeFinalPaymentDiscount();

        // Hide all summary items
        document.querySelectorAll('.summary-item').forEach(item => {
            item.style.display = 'none';
        });

        // Always show plan selection
        const planSelection = document.getElementById('planSelection');
        planSelection.style.display = 'block';
        
        // Always show deposit
        document.getElementById('depositItem').style.display = 'flex';

        // Set up radio button listeners (only once)
        if (!this.planListenersAdded) {
            const radioButtons = document.querySelectorAll('input[name="servicePlan"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    this.handlePlanChange(radio.value);
                });
            });
            this.planListenersAdded = true;
        }

        // Update the display and select the appropriate radio button
        this.updatePlanSelection(planType);
        
        // Check for saved payment method before showing modal
        return this.checkSavedPaymentMethod().then(() => {
            this.modal.classList.add('active');
        }).catch((error) => {
            console.error('Error checking saved payment method:', error);
            // Show modal anyway even if payment method check fails
            this.modal.classList.add('active');
        });
    }

    showFinalPayment(websiteId, websiteName, websiteData) {
        console.log('💳 Opening final payment checkout for:', websiteName);
        
        // Check if modal is initialized
        if (!this.modal) {
            console.error('❌ Checkout modal not initialized');
            alert('Checkout system not ready. Please refresh the page and try again.');
            return;
        }
        
        this.isFinalPayment = true;
        this.finalPaymentWebsiteId = websiteId;
        this.finalPaymentWebsiteName = websiteName;
        this.finalPaymentWebsiteData = websiteData;
        
        // Determine final payment amount (check if referral discount was applied)
        const finalAmount = websiteData.finalPaymentAmount || 299.99;
        
        // Hide plan selection for final payment
        const planSelection = document.getElementById('planSelection');
        if (planSelection) {
            planSelection.style.display = 'none';
        }
        
        // Hide all summary items
        document.querySelectorAll('.summary-item').forEach(item => {
            item.style.display = 'none';
        });
        
        // Show only the final payment item
        const finalPaymentItem = document.getElementById('finalPaymentItem');
        if (finalPaymentItem) {
            finalPaymentItem.style.display = 'flex';
            
            // Get the price wrapper
            const priceWrapper = finalPaymentItem.querySelector('.final-payment-price-wrapper');
            const finalPaymentPrice = document.getElementById('finalPaymentPrice');
            
            if (finalAmount === 199.99) {
                // Show discounted price with strikethrough on original
                finalPaymentPrice.textContent = '$299.99';
                finalPaymentPrice.classList.add('discounted');
                
                // Remove any existing discounted price display
                let discountedPriceEl = priceWrapper.querySelector('.discounted-price');
                if (!discountedPriceEl) {
                    discountedPriceEl = document.createElement('span');
                    discountedPriceEl.className = 'discounted-price';
                    priceWrapper.appendChild(discountedPriceEl);
                }
                discountedPriceEl.textContent = '$199.99';
            } else {
                // Regular price
                finalPaymentPrice.textContent = '$299.99';
                finalPaymentPrice.classList.remove('discounted');
                
                // Remove discounted price display if it exists
                const discountedPriceEl = priceWrapper.querySelector('.discounted-price');
                if (discountedPriceEl) {
                    discountedPriceEl.remove();
                }
            }
        }
        
        // Set the total to final payment amount
        const totalPrice = document.getElementById('totalPrice');
        if (totalPrice) {
            totalPrice.textContent = `$${finalAmount.toFixed(2)}`;
        }
        
        // Hide promo code section for final payment
        const promoSection = document.querySelector('.promo-code-section');
        if (promoSection) {
            promoSection.style.display = 'none';
        }
        
        // Display website name as text (not input field)
        const websiteNameSection = document.querySelector('.website-name-section');
        if (websiteNameSection) {
            // Hide the input wrapper and hint
            const wrapper = websiteNameSection.querySelector('.website-name-wrapper');
            const hint = websiteNameSection.querySelector('.input-hint');
            if (wrapper) wrapper.style.display = 'none';
            if (hint) hint.style.display = 'none';
            
            // Create or update the display text
            let displayText = websiteNameSection.querySelector('.website-name-display');
            if (!displayText) {
                displayText = document.createElement('div');
                displayText.className = 'website-name-display';
                websiteNameSection.querySelector('.form-group').appendChild(displayText);
            }
            displayText.textContent = websiteName;
            displayText.style.display = 'block';
        }
        
        // Update button text
        const submitButton = document.getElementById('submitPayment');
        const btnText = submitButton?.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Complete Payment';
        }
        
        // Check for saved payment method before showing modal
        return this.checkSavedPaymentMethod().then(() => {
            // Prevent body scrolling when modal opens
            document.body.style.overflow = 'hidden';
            void document.body.offsetHeight;
            
            this.modal.classList.add('active');
        }).catch((error) => {
            console.error('Error checking saved payment method:', error);
            // Show modal anyway even if payment method check fails
            // Prevent body scrolling when modal opens
            document.body.style.overflow = 'hidden';
            void document.body.offsetHeight;
            
            this.modal.classList.add('active');
        });
    }

    showEditAccessPayment(websiteName) {
        console.log('💳 Opening edit access payment checkout for:', websiteName);
        
        // Check if modal is initialized
        if (!this.modal) {
            console.error('❌ Checkout modal not initialized');
            alert('Checkout system not ready. Please refresh the page and try again.');
            return;
        }
        
        this.isEditAccessPayment = true;
        this.editAccessWebsiteName = websiteName;
        
        // Hide plan selection for edit access payment
        const planSelection = document.getElementById('planSelection');
        if (planSelection) {
            planSelection.style.display = 'none';
        }
        
        // Hide all summary items
        document.querySelectorAll('.summary-item').forEach(item => {
            item.style.display = 'none';
        });
        
        // Show only the deposit item (we'll reuse it for edit access)
        const depositItem = document.getElementById('depositItem');
        if (depositItem) {
            depositItem.style.display = 'flex';
            
            // Update the label to show "Edit Access"
            const depositLabel = depositItem.querySelector('span:first-child');
            if (depositLabel) {
                depositLabel.textContent = 'Website Update Fee';
            }
            
            // Update the price to $5.00
            const depositPrice = depositItem.querySelector('.summary-price');
            if (depositPrice) {
                depositPrice.textContent = '$5.00';
            }
            
            // Hide the "then $299.99 when satisfied" note
            const finalPaymentNote = document.getElementById('finalPaymentNote');
            if (finalPaymentNote) {
                finalPaymentNote.style.display = 'none';
            }
        }
        
        // Set the total to edit access amount ($5.00)
        const totalPrice = document.getElementById('totalPrice');
        if (totalPrice) {
            totalPrice.textContent = '$5.00';
        }
        
        // Hide the total final payment note as well
        const totalFinalPaymentNote = document.getElementById('totalFinalPaymentNote');
        if (totalFinalPaymentNote) {
            totalFinalPaymentNote.style.display = 'none';
        }
        
        // Hide promo code section for edit access payment
        const promoSection = document.querySelector('.promo-code-section');
        if (promoSection) {
            promoSection.style.display = 'none';
        }
        
        // Display website name as text (not input field)
        const websiteNameSection = document.querySelector('.website-name-section');
        if (websiteNameSection) {
            // Hide the input wrapper and hint
            const wrapper = websiteNameSection.querySelector('.website-name-wrapper');
            const hint = websiteNameSection.querySelector('.input-hint');
            if (wrapper) wrapper.style.display = 'none';
            if (hint) hint.style.display = 'none';
            
            // Create or update the display text
            let displayText = websiteNameSection.querySelector('.website-name-display');
            if (!displayText) {
                displayText = document.createElement('div');
                displayText.className = 'website-name-display';
                websiteNameSection.querySelector('.form-group').appendChild(displayText);
            }
            displayText.textContent = websiteName;
            displayText.style.display = 'block';
        }
        
        // Update button text
        const submitButton = document.getElementById('submitPayment');
        const btnText = submitButton?.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Purchase Edit Access';
        }
        
        // Check for saved payment method before showing modal
        return this.checkSavedPaymentMethod().then(() => {
            // Prevent body scrolling when modal opens
            document.body.style.overflow = 'hidden';
            void document.body.offsetHeight;
            
            this.modal.classList.add('active');
        }).catch((error) => {
            console.error('Error checking saved payment method:', error);
            // Show modal anyway even if payment method check fails
            // Prevent body scrolling when modal opens
            document.body.style.overflow = 'hidden';
            void document.body.offsetHeight;
            
            this.modal.classList.add('active');
        });
    }

    handlePlanChange(selectedPlan) {
        // Update current plan based on selection
        if (selectedPlan === 'none') {
            this.currentPlan = 'website-build';
        } else {
            this.currentPlan = selectedPlan;
        }
        
        // Update the display
        this.updatePlanSelection(this.currentPlan);
    }

    updatePlanSelection(planType) {
        // Hide all plan-specific items
        document.getElementById('hostingItem').style.display = 'none';
        document.getElementById('updatesItem').style.display = 'none';
        document.getElementById('completeItem').style.display = 'none';

        // Show deposit for all cases
        document.getElementById('depositItem').style.display = 'flex';

        // Update radio button selection
        if (planType === 'website-build') {
            document.getElementById('planNone').checked = true;
        } else if (planType === 'hosting') {
            document.getElementById('planHosting').checked = true;
        } else if (planType === 'updates') {
            document.getElementById('planUpdates').checked = true;
        } else if (planType === 'complete') {
            document.getElementById('planComplete').checked = true;
        }

        // Set total and show relevant plan
        let totalAmount = 0;
        let totalText = '';

        switch(planType) {
            case 'website-build':
                totalAmount = 99.99;
                totalText = '$99.99';
                break;
            case 'hosting':
                document.getElementById('hostingItem').style.display = 'flex';
                totalAmount = 99.99 + 9.99; // Deposit + first month
                totalText = '$109.98';
                break;
            case 'updates':
                document.getElementById('updatesItem').style.display = 'flex';
                totalAmount = 99.99 + 9.99; // Deposit + first month
                totalText = '$109.98';
                break;
            case 'complete':
                document.getElementById('completeItem').style.display = 'flex';
                totalAmount = 99.99 + 14.99; // Deposit + first month
                totalText = '$114.98';
                break;
        }

        // Always show final payment note for all plans
        const totalNote = document.getElementById('totalFinalPaymentNote');
        if (totalNote) {
            totalNote.style.display = 'block';
        }

        document.getElementById('totalPrice').textContent = totalText;
    }

    hide() {
        // Restore body scrolling
        document.body.style.overflow = '';
        
        this.modal.classList.remove('active');
        this.cardElement.clear();
        document.getElementById('card-errors').textContent = '';
        
        // Reset payment type flags
        this.isFinalPayment = false;
        this.isEditAccessPayment = false;
        
        // Reset saved card UI
        this.useSavedCard = false;
        this.showCardInput();
    }

    showButtonSuccess() {
        console.log('✅ Showing button success state...');
        
        const submitButton = document.getElementById('submitPayment');
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoader = submitButton.querySelector('.btn-loader');
        
        // Hide the loading dots
        btnLoader.style.display = 'none';
        
        // Show success text with checkmark
        btnText.innerHTML = '✓ Payment Successful!';
        btnText.style.display = 'inline';
        
        // Add success class for styling
        submitButton.classList.add('success');
        
        // Keep button disabled to prevent additional clicks
        submitButton.disabled = true;
        
        console.log('✅ Button transformed to success state');
    }

    async checkSavedPaymentMethod() {
        console.log('💳 Checking for saved payment method...');
        
        const auth = window.FirebaseAuth?.auth;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            console.log('No user logged in, showing card input');
            this.showCardInput();
            return;
        }
        
        try {
            // Call getBillingData to check for saved payment method
            const getBillingData = firebase.app().functions().httpsCallable('getBillingData');
            const result = await getBillingData();
            
            const { paymentMethod } = result.data;
            
            if (paymentMethod) {
                console.log('✅ Found saved payment method:', paymentMethod);
                this.savedPaymentMethod = paymentMethod;
                this.useSavedCard = true;
                this.showSavedCardMessage();
            } else {
                console.log('No saved payment method, showing card input');
                this.savedPaymentMethod = null;
                this.useSavedCard = false;
                this.showCardInput();
            }
        } catch (error) {
            console.error('Error checking saved payment method:', error);
            // On error, show card input as fallback
            this.showCardInput();
        }
    }

    showSavedCardMessage() {
        const cardGroup = document.querySelector('.form-group:has(#card-element)');
        if (!cardGroup) return;
        
        const cardElement = document.getElementById('card-element');
        const cardErrors = document.getElementById('card-errors');
        
        // Hide the card element
        cardElement.style.display = 'none';
        cardErrors.textContent = '';
        
        // Clear the Stripe card element to prevent validation errors
        if (this.cardElement) {
            this.cardElement.clear();
        }
        
        // Create/update saved card message
        let savedCardMsg = cardGroup.querySelector('.saved-card-message');
        if (!savedCardMsg) {
            savedCardMsg = document.createElement('div');
            savedCardMsg.className = 'saved-card-message';
            cardElement.parentNode.insertBefore(savedCardMsg, cardElement);
        }
        
        savedCardMsg.innerHTML = `
            <div class="saved-card-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                <div class="saved-card-details">
                    <div class="saved-card-text">
                        <strong>${this.savedPaymentMethod.brand.toUpperCase()}</strong> ending in <strong>••••${this.savedPaymentMethod.last4}</strong>
                    </div>
                    <div class="saved-card-subtext">Expires ${this.savedPaymentMethod.exp_month}/${this.savedPaymentMethod.exp_year}</div>
                </div>
                <button type="button" class="use-different-card-btn" onclick="window.checkoutModal.showCardInput()">
                    Use a different card
                </button>
            </div>
        `;
        
        savedCardMsg.style.display = 'block';
    }

    showCardInput() {
        const cardGroup = document.querySelector('.form-group:has(#card-element)');
        if (!cardGroup) return;
        
        const cardElement = document.getElementById('card-element');
        const savedCardMsg = cardGroup.querySelector('.saved-card-message');
        
        // Show card element
        cardElement.style.display = 'block';
        
        // Hide saved card message
        if (savedCardMsg) {
            savedCardMsg.style.display = 'none';
        }
        
        // Clear the flag
        this.useSavedCard = false;
        
        // Clear any previous card input
        if (this.cardElement) {
            this.cardElement.clear();
        }
    }

    async checkPromoEligibility() {
        // Check if user has already used a referral code
        const auth = window.FirebaseServices?.auth;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            // Not logged in, show promo section by default
            return;
        }
        
        try {
            const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const promoSection = document.querySelector('.promo-code-section');
                
                // Check if user has usedReferralCode (they used a code during deposit)
                // This prevents using multiple codes, even if they haven't completed final payment yet
                if (userData.usedReferralCode) {
                    // User has already used a referral code - hide the section
                    if (promoSection) {
                        promoSection.style.display = 'none';
                        console.log('🚫 User already used referral code:', userData.usedReferralCode, '- hiding promo section');
                    }
                } else {
                    // User hasn't used a referral code yet - show the section
                    if (promoSection) {
                        promoSection.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error('Error checking promo eligibility:', error);
            // On error, show promo section to be safe
        }
    }

    async applyPromoCode() {
        const promoCode = document.getElementById('promoCode').value.trim().toUpperCase();
        const promoMessage = document.getElementById('promoMessage');

        if (!promoCode) {
            promoMessage.className = 'promo-message error';
            promoMessage.textContent = 'Please enter a promo code';
            return;
        }

        try {
            // Search for user with this referral code in Firebase
            const usersRef = firebase.firestore().collection('users');
            const querySnapshot = await usersRef
                .where('referralCode', '==', promoCode)
                .get();

            if (!querySnapshot.empty) {
                // Valid referral code found!
                this.usedReferralCode = promoCode;
                this.promoCodeId = promoCode; // Store the code as promoCodeId for discount logic
                
                console.log('✅ Referral code stored in memory:', this.usedReferralCode);
                
                promoMessage.className = 'promo-message success';
                promoMessage.textContent = `✓ Referral code applied! Save $100 on your final payment.`;

                // Apply discount to final payment display
                this.applyFinalPaymentDiscount();
            } else {
                // Invalid code
                throw new Error('Invalid referral code');
            }
        } catch (error) {
            console.error('Error applying referral code:', error);
            promoMessage.className = 'promo-message error';
            promoMessage.textContent = error.message || 'Invalid referral code';
            this.usedReferralCode = null;
            this.promoCodeId = null;
            
            // Remove discount from final payment
            this.removeFinalPaymentDiscount();
        }
    }

    applyFinalPaymentDiscount() {
        // Add 'discounted' class to show strike-through and new price
        // Apply to deposit item
        const finalPaymentAmount = document.getElementById('finalPaymentAmount');
        if (finalPaymentAmount) {
            finalPaymentAmount.textContent = ''; // Clear text content - CSS pseudo-elements will handle display
            finalPaymentAmount.classList.add('discounted');
        }
        
        // Apply to total section
        const totalFinalPaymentAmount = document.getElementById('totalFinalPaymentAmount');
        if (totalFinalPaymentAmount) {
            totalFinalPaymentAmount.textContent = ''; // Clear text content - CSS pseudo-elements will handle display
            totalFinalPaymentAmount.classList.add('discounted');
        }
    }

    removeFinalPaymentDiscount() {
        // Remove 'discounted' class
        // Remove from deposit item
        const finalPaymentAmount = document.getElementById('finalPaymentAmount');
        if (finalPaymentAmount) {
            finalPaymentAmount.classList.remove('discounted');
            finalPaymentAmount.textContent = '$299.99'; // Restore original text
        }
        
        // Remove from total section
        const totalFinalPaymentAmount = document.getElementById('totalFinalPaymentAmount');
        if (totalFinalPaymentAmount) {
            totalFinalPaymentAmount.classList.remove('discounted');
            totalFinalPaymentAmount.textContent = '$299.99'; // Restore original text
        }
    }

    async processPayment() {
        const submitButton = document.getElementById('submitPayment');
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoader = submitButton.querySelector('.btn-loader');
        const cardErrors = document.getElementById('card-errors');

        // Clear previous errors
        cardErrors.textContent = '';

        // Validate website name (skip if final payment or edit access payment)
        if (!this.isFinalPayment && !this.isEditAccessPayment) {
            const websiteNameInput = document.getElementById('websiteName');
            const websiteNameCore = websiteNameInput.value.trim();
            
            if (!websiteNameCore) {
                cardErrors.textContent = 'Please enter a name for your website.';
                websiteNameInput.focus();
                return;
            }

            if (websiteNameCore.length < 2) {
                cardErrors.textContent = 'Website name must be at least 2 characters.';
                websiteNameInput.focus();
                return;
            }

            // Validate that the name only contains valid characters (letters, numbers, hyphens)
            const validNamePattern = /^[a-zA-Z0-9-]+$/;
            if (!validNamePattern.test(websiteNameCore)) {
                cardErrors.textContent = 'Website name can only contain letters, numbers, and hyphens.';
                websiteNameInput.focus();
                return;
            }

            // Construct the full website name with www. and .com
            const fullWebsiteName = `www.${websiteNameCore}.com`;
            
            // Store full website name for later use
            this.websiteName = fullWebsiteName;
        }

        // Disable button and show loader
        submitButton.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';

        try {
            if (this.isFinalPayment) {
                // Process final payment
                await this.processFinalPayment();
            } else if (this.isEditAccessPayment) {
                // Process edit access payment
                await this.processEditAccessPayment();
            } else {
                const isSubscription = ['hosting', 'updates', 'complete'].includes(this.currentPlan);

                if (isSubscription) {
                    // For subscriptions, we need to:
                    // 1. Process the deposit payment
                    // 2. Start the subscription
                    await this.processDepositAndSubscription();
                } else {
                    // Just the website build deposit
                    await this.processOneTimePayment();
                }
            }

        } catch (error) {
            console.error('Payment error:', error);
            cardErrors.textContent = error.message || 'Payment failed. Please try again.';

            // Re-enable button
            submitButton.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    async processFinalPayment() {
        console.log('💰 Processing final payment...');
        
        // Get the final payment amount from website data
        const finalAmount = this.finalPaymentWebsiteData.finalPaymentAmount || 299.99;
        
        // Determine which price ID to use based on the final payment amount
        let priceId;
        if (finalAmount === 199.99) {
            // User used a referral code - use discounted price
            priceId = getStripePriceId('websiteBuildFinalDiscounted');
            console.log('💳 Using DISCOUNTED final payment price ID (referral code applied)');
        } else {
            // Regular final payment
            priceId = getStripePriceId('websiteBuildFinal');
            console.log('💳 Using REGULAR final payment price ID');
        }
        
        console.log('💳 Final payment amount:', finalAmount, 'Price ID:', priceId);
        
        // Get Firebase Functions
        const functions = window.FirebaseServices?.functions;
        if (!functions) {
            throw new Error('Firebase Functions not initialized. Please refresh the page.');
        }

        // Create payment intent for final payment
        const createPaymentIntent = functions.httpsCallable('createPaymentIntent');
        const result = await createPaymentIntent({
            priceId,
            metadata: {
                planType: 'final-payment',
                websiteId: this.finalPaymentWebsiteId,
                websiteName: this.finalPaymentWebsiteName,
                amount: finalAmount
            }
        });

        const { clientSecret } = result.data;

        // Check if using saved payment method
        if (this.useSavedCard && this.savedPaymentMethod) {
            console.log('💳 Using saved payment method for final payment:', this.savedPaymentMethod.id);
            // Use the saved payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: this.savedPaymentMethod.id,
            });
            
            if (error) {
                throw error;
            }
            
            if (paymentIntent.status === 'succeeded') {
                await this.handleFinalPaymentSuccess(paymentIntent);
            }
        } else {
            console.log('💳 Creating new payment method from card input for final payment');
            // Create payment method from card input
            const { error: methodError, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (methodError) {
                throw methodError;
            }

            console.log('💳 Payment method created:', paymentMethod.id);

            // Confirm the payment using the payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id,
            });

            if (error) {
                throw error;
            }

            if (paymentIntent.status === 'succeeded') {
                // Payment successful!
                await this.handleFinalPaymentSuccess(paymentIntent);
            }
        }
    }

    async handleFinalPaymentSuccess(paymentIntent) {
        console.log('✅ Final payment successful!');
        
        const userId = firebase.auth().currentUser.uid;
        const userRef = firebase.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('User data not found');
        }
        
        const userData = userDoc.data();
        const websitesMap = userData.websites || {};
        
        // Update the website status
        if (websitesMap[this.finalPaymentWebsiteName]) {
            websitesMap[this.finalPaymentWebsiteName].finalPaymentPaid = true;
            websitesMap[this.finalPaymentWebsiteName].finalPaymentDate = new Date();
            websitesMap[this.finalPaymentWebsiteName].status = 'finalizing'; // Changed from 'complete' to 'finalizing'
            
            // Check if this was a discounted final payment (199.99 instead of 299.99)
            // If so, mark that this user has used their promo code
            const finalAmount = websitesMap[this.finalPaymentWebsiteName].finalPaymentAmount || 299.99;
            const updateData = {
                websites: websitesMap,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (finalAmount === 199.99) {
                // User paid discounted price - mark promo code as used permanently
                updateData.promoCodeUsed = true;
                updateData.promoCodeUsedAt = firebase.firestore.FieldValue.serverTimestamp();
                console.log('🎟️ Promo code discount detected - marking as used on user account');
            }
            
            // Save updated data
            await userRef.set(updateData, { merge: true });
            
            console.log('✅ Website status updated to finalizing');
        }
        
        // Check if this was a discounted final payment ($199.99) and credit the referrer
        // Only credit when they actually used the discount, not on future full-price purchases
        const websiteData = websitesMap[this.finalPaymentWebsiteName];
        const finalAmount = websiteData?.finalPaymentAmount || 299.99;
        
        if (finalAmount === 199.99 && userData.usedReferralCode) {
            console.log('💰 Discounted payment detected - crediting referrer:', userData.usedReferralCode);
            
            // Find the user who owns this referral code
            const referrerQuery = await firebase.firestore()
                .collection('users')
                .where('referralCode', '==', userData.usedReferralCode)
                .get();
            
            if (!referrerQuery.empty) {
                const referrerDoc = referrerQuery.docs[0];
                const referrerId = referrerDoc.id;
                const referrerData = referrerDoc.data();
                
                // Award $50 to the referrer
                const currentEarnings = referrerData.referralEarnings || 0;
                const currentReferrals = referrerData.totalReferrals || 0;
                
                await firebase.firestore().collection('users').doc(referrerId).set({
                    referralEarnings: currentEarnings + 50,
                    totalReferrals: currentReferrals + 1,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log(`✅ Credited $50 to referrer ${referrerId}. Total earnings: $${currentEarnings + 50}`);
            }
        } else if (userData.usedReferralCode) {
            console.log('ℹ️ User has referral code but paid full price ($299.99) - no credit given');
        }
        
        // Save payment info to payments subcollection
        await userRef.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            planType: 'final-payment',
            websiteName: this.finalPaymentWebsiteName,
            websiteId: this.finalPaymentWebsiteId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Show success button state
        this.showButtonSuccess();
        
        // Reload the page to show updated status after brief delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    async processEditAccessPayment() {
        console.log('💰 Processing edit access payment...');
        
        // Use the edit access price ID (Live Mode)
        const priceId = 'price_1STRnmPzvK6hwHhJ7WdpsbeV';
        console.log('💳 Edit access payment - Price ID:', priceId);
        
        // Get Firebase Functions
        const functions = window.FirebaseServices?.functions;
        if (!functions) {
            throw new Error('Firebase Functions not initialized. Please refresh the page.');
        }

        // Create payment intent for edit access
        const createPaymentIntent = functions.httpsCallable('createPaymentIntent');
        const result = await createPaymentIntent({
            priceId,
            metadata: {
                planType: 'edit-access',
                websiteName: this.editAccessWebsiteName,
                amount: 5.00
            }
        });

        const { clientSecret } = result.data;

        // Check if using saved payment method
        if (this.useSavedCard && this.savedPaymentMethod) {
            console.log('💳 Using saved payment method for edit access payment:', this.savedPaymentMethod.id);
            // Use the saved payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: this.savedPaymentMethod.id,
            });
            
            if (error) {
                throw error;
            }
            
            if (paymentIntent.status === 'succeeded') {
                await this.handleEditAccessPaymentSuccess(paymentIntent);
            }
        } else {
            console.log('💳 Creating new payment method from card input for edit access payment');
            // Create payment method from card input
            const { error: methodError, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (methodError) {
                throw methodError;
            }

            console.log('💳 Payment method created:', paymentMethod.id);

            // Confirm the payment using the payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id,
            });

            if (error) {
                throw error;
            }

            if (paymentIntent.status === 'succeeded') {
                // Payment successful!
                await this.handleEditAccessPaymentSuccess(paymentIntent);
            }
        }
    }

    async handleEditAccessPaymentSuccess(paymentIntent) {
        console.log('✅ Edit access payment successful!');
        
        const userId = firebase.auth().currentUser.uid;
        const userRef = firebase.firestore().collection('users').doc(userId);
        
        // Save payment info to payments subcollection
        await userRef.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            planType: 'edit-access',
            websiteName: this.editAccessWebsiteName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('💾 Payment record saved');

        // Update website status to 'editing' AND save pre-edit snapshot
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = userData.websites || {};
            
            if (websitesMap[this.editAccessWebsiteName]) {
                const websiteData = websitesMap[this.editAccessWebsiteName];
                
                // Get the current form progress to save as snapshot
                const formProgress = websiteData.formProgress || {};
                
                // Save pre-edit snapshot (copy of current form data before edits)
                websitesMap[this.editAccessWebsiteName].preEditSnapshot = { ...formProgress };
                websitesMap[this.editAccessWebsiteName].status = 'editing';
                websitesMap[this.editAccessWebsiteName].editingStartedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                await userRef.set({
                    websites: websitesMap,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log(`✅ Pre-edit snapshot saved and status updated to 'editing' for ${this.editAccessWebsiteName}`);
            }
        }

        // Show success button state
        this.showButtonSuccess();
        
        // Set the pending edit website in sessionStorage so the form opens automatically
        sessionStorage.setItem('pendingEditWebsite', this.editAccessWebsiteName);
        
        // Reload the page to trigger the edit form opening after brief delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    async processOneTimePayment() {
        // Get the appropriate price ID
        const priceId = getStripePriceId('websiteBuildDeposit');

        // Get Firebase Functions from the initialized instance
        // CRITICAL: Must use the same Firebase app instance that has auth context
        console.log('🔍 Checking Firebase Functions availability:', {
            FirebaseServices: !!window.FirebaseServices,
            functions: !!window.FirebaseServices?.functions
        });
        const functions = window.FirebaseServices?.functions;
        if (!functions) {
            throw new Error('Firebase Functions not initialized. Please refresh the page.');
        }

        // Call Firebase Function to create payment intent
        const createPaymentIntent = functions.httpsCallable('createPaymentIntent');
        const result = await createPaymentIntent({
            priceId,
            metadata: {
                planType: this.currentPlan,
                promoCodeId: this.promoCodeId,
                websiteName: this.websiteName || 'Not specified'
            }
        });

        const { clientSecret } = result.data;

        // Check if using saved payment method
        if (this.useSavedCard && this.savedPaymentMethod) {
            console.log('💳 Using saved payment method:', this.savedPaymentMethod.id);
            // Use the saved payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: this.savedPaymentMethod.id,
            });
            
            if (error) {
                throw error;
            }
            
            if (paymentIntent.status === 'succeeded') {
                await this.handlePaymentSuccess(paymentIntent);
            }
        } else {
            console.log('💳 Creating new payment method from card input');
            // Create payment method explicitly (safer than inline)
            const { error: methodError, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (methodError) {
                throw methodError;
            }

            console.log('💳 Payment method created:', paymentMethod.id);

            // Confirm the payment using the payment method ID
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethod.id,
            });

            if (error) {
                throw error;
            }

            if (paymentIntent.status === 'succeeded') {
                // Payment successful!
                await this.handlePaymentSuccess(paymentIntent);
            }
        }
    }

    async processDepositAndSubscription() {
        // Verify user is authenticated before proceeding
        const auth = window.FirebaseServices?.auth;
        const currentUser = auth?.currentUser;
        
        if (!currentUser) {
            throw new Error('You must be logged in to complete checkout.');
        }
        
        // Force token refresh to ensure we have a valid auth token
        try {
            await currentUser.getIdToken(true);
            console.log('🔐 User authenticated for checkout:', {
                email: currentUser.email,
                uid: currentUser.uid,
                emailVerified: currentUser.emailVerified
            });
        } catch (tokenError) {
            console.error('Failed to get ID token:', tokenError);
            throw new Error('Authentication error. Please refresh and try again.');
        }

        // Step 1: Create or use existing payment method
        let paymentMethodId;
        
        if (this.useSavedCard && this.savedPaymentMethod) {
            console.log('💳 Using saved payment method for subscription:', this.savedPaymentMethod.id);
            paymentMethodId = this.savedPaymentMethod.id;
        } else {
            console.log('💳 Creating new payment method for subscription');
            const { error: methodError, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
            });

            if (methodError) {
                throw methodError;
            }
            
            paymentMethodId = paymentMethod.id;
        }

        // Get Firebase Functions from the initialized instance
        // CRITICAL: Must use the same Firebase app instance that has auth context
        // Use firebase.functions() directly to ensure it picks up current auth state
        const functions = firebase.functions();
        console.log('🔧 Using Firebase Functions instance (direct call)');

        // Step 2: Create subscription (automatically charges since payment method is attached)
        const subscriptionPriceId = this.getSubscriptionPriceId();
        const createSubscription = functions.httpsCallable('createSubscription');
        const subscriptionResult = await createSubscription({
            priceId: subscriptionPriceId,
            paymentMethodId: paymentMethodId
        });

        const { subscriptionId, status } = subscriptionResult.data;
        console.log('✅ Subscription created:', subscriptionId, 'Status:', status);

        // Step 3: Process deposit payment ($99.99) - use the SAME payment method that's now attached to customer
        const depositPriceId = getStripePriceId('websiteBuildDeposit');
        const createPaymentIntent = functions.httpsCallable('createPaymentIntent');
        const depositResult = await createPaymentIntent({
            priceId: depositPriceId,
            metadata: {
                planType: 'deposit-for-' + this.currentPlan,
                promoCodeId: this.promoCodeId,
                websiteName: this.websiteName || 'Not specified'
            }
        });

        // Confirm deposit payment (using the same payment method)
        const { error: depositError, paymentIntent: depositIntent } = await this.stripe.confirmCardPayment(
            depositResult.data.clientSecret,
            {
                payment_method: paymentMethodId
            }
        );

        if (depositError) {
            // Subscription went through but deposit failed - handle this gracefully
            throw new Error('Deposit payment failed: ' + depositError.message + '. Your subscription has been created. Please contact support.');
        }

        // Both payments successful!
        await this.handleDepositAndSubscriptionSuccess(depositIntent, subscriptionId);
    }

    getSubscriptionPriceId() {
        switch(this.currentPlan) {
            case 'hosting':
                return getStripePriceId('hostingPlan');
            case 'updates':
                return getStripePriceId('updatesPlan');
            case 'complete':
                return getStripePriceId('completePlan');
            default:
                throw new Error('Invalid subscription plan');
        }
    }

    async processSubscription() {
        // Get the appropriate price ID
        let priceId;
        switch(this.currentPlan) {
            case 'hosting':
                priceId = getStripePriceId('hostingPlan');
                break;
            case 'updates':
                priceId = getStripePriceId('updatesPlan');
                break;
            case 'complete':
                priceId = getStripePriceId('completePlan');
                break;
        }

        // Create payment method
        const { error: methodError, paymentMethod } = await this.stripe.createPaymentMethod({
            type: 'card',
            card: this.cardElement,
        });

        if (methodError) {
            throw methodError;
        }

        // Get Firebase Functions from the initialized instance
        // CRITICAL: Must use the same Firebase app instance that has auth context
        const functions = window.FirebaseServices?.functions;
        if (!functions) {
            throw new Error('Firebase Functions not initialized. Please refresh the page.');
        }

        // Call Firebase Function to create subscription
        const createSubscription = functions.httpsCallable('createSubscription');
        const result = await createSubscription({
            priceId,
            paymentMethodId: paymentMethod.id
        });

        const { clientSecret, subscriptionId } = result.data;

        // Confirm the subscription payment
        const { error: confirmError, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret);

        if (confirmError) {
            throw confirmError;
        }

        if (paymentIntent.status === 'succeeded') {
            // Subscription successful!
            await this.handleSubscriptionSuccess(subscriptionId);
        }
    }

    async handlePaymentSuccess(paymentIntent) {
        const userId = firebase.auth().currentUser.uid;
        
        // Generate unique referral code for this user
        const referralCode = await this.generateReferralCode(userId);
        
        // Determine final payment amount based on promo code usage
        const finalPaymentAmount = this.promoCodeId ? 199.99 : 299.99;
        
        // Get current user document or create new one
        const userRef = firebase.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        // Prepare website data (use regular Date instead of serverTimestamp in objects)
        const now = new Date();
        const websiteData = {
            websiteId: `website-${Date.now()}`,
            depositPaid: true,
            depositDate: now,
            finalPaymentPaid: false,
            finalPaymentAmount: finalPaymentAmount,
            services: {
                hosting: false,
                updates: false,
                complete: false
            },
            status: 'awaiting-info',
            createdAt: now
        };
        
        // Update or create user document - use MAP structure for websites
        // IMPORTANT: Use set() with merge instead of update() to avoid dot notation issues
        const websitesMap = userDoc.exists ? (userDoc.data().websites || {}) : {};
        websitesMap[this.websiteName] = websiteData;
        
        const userData = {
            referralCode: referralCode,
            websites: websitesMap,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save the referral code they used (if they used one)
        if (this.usedReferralCode) {
            userData.usedReferralCode = this.usedReferralCode;
            console.log('💾 Saving usedReferralCode to user account:', this.usedReferralCode);
        }
        
        // Add fields for new users only
        if (!userDoc.exists) {
            userData.email = firebase.auth().currentUser.email;
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Use set with merge to avoid dot notation issues in field paths
        await userRef.set(userData, { merge: true });
        
        // Save payment info to payments subcollection
        await userRef.collection('payments').add({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            planType: this.currentPlan,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Store website name for auto-form creation
        localStorage.setItem('pendingWebsite', this.websiteName);

        // Show success button state
        this.showButtonSuccess();
        
        // Redirect to My Websites page to start the setup form after brief delay
        setTimeout(() => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTablet = /iPad/i.test(navigator.userAgent);
            const myWebsitesFile = (isMobile && !isTablet) ? 'my-websites-mobile.html' : 'my-websites-desktop.html';
            const myWebsitesUrl = window.location.pathname.includes('/html/') 
                ? myWebsitesFile 
                : `./html/${myWebsitesFile}`;
            window.location.href = myWebsitesUrl;
        }, 1500);
    }

    async handleDepositAndSubscriptionSuccess(depositIntent, subscriptionId) {
        const userId = firebase.auth().currentUser.uid;
        
        // Get current user document or create new one
        const userRef = firebase.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        // Check if user already has a referral code (from previous website purchase)
        let referralCode;
        if (userDoc.exists && userDoc.data().referralCode) {
            // User already has a referral code - reuse it
            referralCode = userDoc.data().referralCode;
            console.log('♻️ User already has referral code:', referralCode);
        } else {
            // New user - generate a unique referral code
            referralCode = await this.generateReferralCode(userId);
            console.log('✨ Generated new referral code:', referralCode);
        }
        
        // Determine final payment amount based on promo code usage
        const finalPaymentAmount = this.promoCodeId ? 199.99 : 299.99;
        
        // Determine which services are active
        const services = {
            hosting: this.currentPlan === 'hosting' || this.currentPlan === 'complete',
            updates: this.currentPlan === 'updates' || this.currentPlan === 'complete',
            complete: this.currentPlan === 'complete'
        };
        
        // Prepare website data (use regular Date instead of serverTimestamp in objects)
        const now = new Date();
        const websiteData = {
            websiteId: `website-${Date.now()}`,
            depositPaid: true,
            depositDate: now,
            finalPaymentPaid: false,
            finalPaymentAmount: finalPaymentAmount,
            services: services,
            subscriptionId: subscriptionId,
            status: 'awaiting-info',
            createdAt: now
        };
        
        // Update or create user document - use MAP structure for websites
        // IMPORTANT: Use set() with merge instead of update() to avoid dot notation issues
        const websitesMap = userDoc.exists ? (userDoc.data().websites || {}) : {};
        websitesMap[this.websiteName] = websiteData;
        
        const userData = {
            referralCode: referralCode,
            websites: websitesMap,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save the referral code they used (if they used one)
        if (this.usedReferralCode) {
            userData.usedReferralCode = this.usedReferralCode;
            console.log('💾 Saving usedReferralCode to user account:', this.usedReferralCode);
        }
        
        // Add fields for new users only
        if (!userDoc.exists) {
            userData.email = firebase.auth().currentUser.email;
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Use set with merge to avoid dot notation issues in field paths
        await userRef.set(userData, { merge: true });

        // Save deposit payment to payments subcollection
        await userRef.collection('payments').add({
            paymentIntentId: depositIntent.id,
            amount: depositIntent.amount,
            currency: depositIntent.currency,
            status: depositIntent.status,
            planType: 'deposit-for-' + this.currentPlan,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Save subscription info to subscriptions subcollection
        await userRef.collection('subscriptions').add({
            subscriptionId: subscriptionId,
            planType: this.currentPlan,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Store website name for auto-form creation
        localStorage.setItem('pendingWebsite', this.websiteName);

        // Show success button state
        this.showButtonSuccess();
        
        // Redirect to My Websites page to start the setup form after brief delay
        setTimeout(() => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTablet = /iPad/i.test(navigator.userAgent);
            const myWebsitesFile = (isMobile && !isTablet) ? 'my-websites-mobile.html' : 'my-websites-desktop.html';
            const myWebsitesUrl = window.location.pathname.includes('/html/') 
                ? myWebsitesFile 
                : `./html/${myWebsitesFile}`;
            window.location.href = myWebsitesUrl;
        }, 1500);
    }

    async handleSubscriptionSuccess(subscriptionId) {
        // Save subscription info to Firestore
        await firebase.firestore()
            .collection('users')
            .doc(firebase.auth().currentUser.uid)
            .update({
                subscriptionId: subscriptionId,
                subscriptionPlan: this.currentPlan,
                subscriptionStartedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Show success button state
        this.showButtonSuccess();
        
        // Reload page to update UI after brief delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    // Generate unique referral code for user
    async generateReferralCode(userId) {
        // Create code from TALENT- prefix + last 4 chars of userId + random 2 digits
        const userIdSuffix = userId.substring(userId.length - 4).toUpperCase();
        const randomDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const code = `TALENT-${userIdSuffix}${randomDigits}`;
        
        // Check if code already exists in database
        const existingCode = await firebase.firestore()
            .collection('users')
            .where('referralCode', '==', code)
            .get();
        
        // If code exists, try again with different random digits
        if (!existingCode.empty) {
            const newRandomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `TALENT-${userIdSuffix}${newRandomDigits}`;
        }
        
        return code;
    }
}

// Initialize checkout modal when page loads
let checkoutModal;

// Initialize immediately or on DOMContentLoaded
async function initCheckoutModal() {
    if (!checkoutModal) {
        console.log('💳 Initializing checkout modal...');
        checkoutModal = new CheckoutModal();
        await checkoutModal.init();
        window.checkoutModal = checkoutModal; // Make it globally accessible (lowercase)
        window.CheckoutModal = checkoutModal; // Also make it available as CheckoutModal (uppercase)
        console.log('✅ Checkout modal initialized and available globally');
    }
}

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckoutModal);
} else {
    // DOM is already ready, initialize immediately
    initCheckoutModal();
}
