// My Referrals Page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 My Referrals DOM loaded - starting initialization');
    
    // Use shared page utilities for consistent initialization
    if (typeof window.PageUtils !== 'undefined') {
        window.PageUtils.initPage('my-referrals', () => {
            // Custom initialization after header is set up
            initMyReferralsCustom();
        });
    } else {
        console.warn('PageUtils not available, loading page-utils.js');
        // Fallback initialization
        initMyReferralsPageFallback();
    }
});

// Custom initialization function called after header setup
function initMyReferralsCustom() {
    // Wait a moment for everything to be ready, then load referral data
    setTimeout(() => {
        checkAuthAndLoadReferrals();
    }, 500);
}

// Fallback function in case PageUtils isn't loaded
function initMyReferralsPageFallback() {
    console.log('My Referrals Page - Loaded (fallback mode)');
    setTimeout(() => {
        if (window.HeaderManager && window.HeaderManager.transformHeader) {
            window.HeaderManager.transformHeader('my-referrals');
        }
        // Show page after a delay
        checkAuthAndLoadReferrals();
    }, 800);
}

// Check authentication and load referral data
async function checkAuthAndLoadReferrals() {
    console.log('🔐 Checking authentication for My Referrals page');
    
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
        showMyReferralsPage();
        return;
    }
    
    // Check current user
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log('✅ User authenticated:', user.email);
            await loadUserReferralData(user);
        } else {
            console.log('❌ No user authenticated');
            // Could redirect to login or show error
        }
        showMyReferralsPage();
    });
}

// Load user's referral data from Firestore
async function loadUserReferralData(user) {
    console.log('📊 Loading referral data for user:', user.email);
    
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        if (!userDoc.exists) {
            console.error('❌ User document does not exist');
            return;
        }
        
        const userData = userDoc.data();
        
        // Get referral code from user data
        const referralCode = userData.referralCode || 'NO-CODE-FOUND';
        
        // Display referral code
        displayPromoCode(referralCode);
        
        // Get referral stats from user data
        const referralStats = {
            totalReferrals: userData.totalReferrals || 0,
            totalEarnings: userData.referralEarnings || 0  // Changed from totalEarnings to referralEarnings
        };
        
        // Display stats
        displayReferralStats(referralStats);
        
        // Load PayPal account if saved
        loadPayPalAccount(userData);
        
        // Calculate and display next payout countdown
        displayPayoutCountdown();
        
        // Load payout history
        loadPayoutHistory(user.uid);
        
    } catch (error) {
        console.error('❌ Error loading referral data:', error);
    }
}

// Display the promo code
function displayPromoCode(code) {
    const promoCodeText = document.getElementById('promoCodeText');
    if (promoCodeText) {
        promoCodeText.textContent = code;
    }
}

// Display referral statistics
function displayReferralStats(stats) {
    const totalReferralsEl = document.getElementById('totalReferrals');
    const totalEarningsEl = document.getElementById('totalEarnings');
    
    if (totalReferralsEl) {
        totalReferralsEl.textContent = stats.totalReferrals;
    }
    
    if (totalEarningsEl) {
        totalEarningsEl.textContent = `$${stats.totalEarnings}`;
    }
}

// Copy promo code to clipboard
function copyPromoCode() {
    const promoCodeText = document.getElementById('promoCodeText');
    if (!promoCodeText) return;
    
    const code = promoCodeText.textContent;
    
    // Use clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showCopyFeedback();
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(code);
        });
    } else {
        fallbackCopy(code);
    }
}

// Fallback copy method for older browsers
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Failed to copy code. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
}

// Show visual feedback when code is copied
function showCopyFeedback() {
    const btn = document.querySelector('.btn-copy');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="copy-icon">✅</span> Copied!';
    btn.style.backgroundColor = '#4caf50';
    btn.style.color = 'white';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.style.color = '';
    }, 2000);
}

// Show the page with smooth fade-in
function showMyReferralsPage() {
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
        console.log('✨ Showing My Referrals page content');
        mainWrapper.style.transition = 'opacity 0.3s ease-in';
        mainWrapper.style.opacity = '1';
    }
}

// Make functions globally available
window.copyPromoCode = copyPromoCode;

// Load PayPal account information
function loadPayPalAccount(userData) {
    const paypalEmail = userData.paypalEmail || null;
    const paypalEmpty = document.getElementById('paypalEmpty');
    const paypalSaved = document.getElementById('paypalSaved');
    const paypalEmailDisplay = document.getElementById('paypalEmail');
    
    if (paypalEmail) {
        // User has PayPal saved - show saved view
        paypalEmpty.style.display = 'none';
        paypalSaved.style.display = 'block';
        paypalEmailDisplay.textContent = paypalEmail;
    } else {
        // No PayPal saved - show add button
        paypalEmpty.style.display = 'block';
        paypalSaved.style.display = 'none';
    }
}

// Calculate and display countdown to next payout
function displayPayoutCountdown() {
    const countdownEl = document.getElementById('payoutCountdown');
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let nextPayoutDate;
    
    // Determine next payout date (1st or 15th)
    if (currentDay < 1) {
        nextPayoutDate = new Date(currentYear, currentMonth, 1);
    } else if (currentDay < 15) {
        nextPayoutDate = new Date(currentYear, currentMonth, 15);
    } else {
        // After 15th, next payout is 1st of next month
        nextPayoutDate = new Date(currentYear, currentMonth + 1, 1);
    }
    
    // Calculate days until next payout
    const timeDiff = nextPayoutDate - now;
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 0) {
        countdownEl.textContent = `🎉 Payout processing today!`;
    } else if (daysUntil === 1) {
        countdownEl.textContent = `⏰ Next payout tomorrow`;
    } else {
        countdownEl.textContent = `⏰ ${daysUntil} days until next payout`;
    }
}

// Add PayPal account
async function addPayPalAccount() {
    // Open modal
    openPayPalModal('add');
}

// Change PayPal account
async function changePayPalAccount() {
    // Open modal with current email pre-filled
    openPayPalModal('change');
}

// Open PayPal modal
function openPayPalModal(mode) {
    const modal = document.getElementById('paypalModal');
    const modalTitle = document.getElementById('paypalModalTitle');
    const emailInput = document.getElementById('paypalEmailInput');
    
    if (mode === 'change') {
        modalTitle.textContent = 'Change PayPal Account';
        const currentEmail = document.getElementById('paypalEmail').textContent;
        emailInput.value = currentEmail;
    } else {
        modalTitle.textContent = 'Add PayPal Account';
        emailInput.value = '';
    }
    
    modal.style.display = 'flex';
    emailInput.focus();
}

// Close PayPal modal
function closePayPalModal() {
    const modal = document.getElementById('paypalModal');
    modal.style.display = 'none';
}

// Save PayPal email
async function savePayPalEmail() {
    const emailInput = document.getElementById('paypalEmailInput');
    const email = emailInput.value.trim();
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn.textContent;
    
    if (!email) {
        showToast('Please enter an email address.', 'error');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }
    
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    
    try {
        // Get current user
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('You must be logged in to save PayPal information.', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            return;
        }
        
        // Check if this PayPal email is already used by another account
        const existingUsers = await firebase.firestore()
            .collection('users')
            .where('paypalEmail', '==', email)
            .get();
        
        // If email exists and belongs to a different user, reject it
        if (!existingUsers.empty) {
            const isDifferentUser = existingUsers.docs.some(doc => doc.id !== user.uid);
            if (isDifferentUser) {
                showToast('This PayPal email is already associated with another account.', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                return;
            }
        }
        
        // Save to Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
            paypalEmail: email,
            paypalUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('✅ PayPal email saved:', email);
        
        // Update UI
        document.getElementById('paypalEmpty').style.display = 'none';
        document.getElementById('paypalSaved').style.display = 'block';
        document.getElementById('paypalEmail').textContent = email;
        
        // Close modal
        closePayPalModal();
        
        // Reset button
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        
        // Show success toast
        showToast('PayPal account saved successfully!');
        
    } catch (error) {
        console.error('❌ Error saving PayPal email:', error);
        showToast('Error saving PayPal account. Please try again.', 'error');
        
        // Reset button on error
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    // Change color based on type
    if (type === 'error') {
        toast.style.background = '#ef4444';
    } else {
        toast.style.background = '#10b981';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make PayPal functions globally available
window.addPayPalAccount = addPayPalAccount;
window.changePayPalAccount = changePayPalAccount;
window.closePayPalModal = closePayPalModal;
window.savePayPalEmail = savePayPalEmail;
window.showToast = showToast;

// Add goToMyReferrals for header navigation
window.goToMyReferrals = function() {
    console.log('Navigating to My Referrals');
    
    if (typeof window.PageUtils !== 'undefined') {
        const url = window.PageUtils.getDeviceSpecificUrl('my-referrals');
        
        if (typeof NavigationUtils !== 'undefined') {
            NavigationUtils.navigateTo(url);
        } else {
            window.location.href = url;
        }
    } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = isMobile ? 'my-referrals-mobile.html' : 'my-referrals-desktop.html';
        window.location.href = url;
    }
};

// Load payout history from payouts subcollection
async function loadPayoutHistory(userId) {
    console.log('📋 Loading payout history for user:', userId);
    
    try {
        const payoutsSnapshot = await firebase.firestore()
            .collection('users')
            .doc(userId)
            .collection('payouts')
            .orderBy('processedAt', 'desc')
            .get();
        
        const historyList = document.getElementById('payoutHistoryList');
        const noHistory = document.getElementById('noPayoutHistory');
        const tableWrapper = document.querySelector('.payout-table-wrapper');
        
        if (payoutsSnapshot.empty) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            noHistory.style.display = 'block';
            return;
        }
        
        if (tableWrapper) tableWrapper.style.display = 'block';
        noHistory.style.display = 'none';
        historyList.innerHTML = '';
        
        payoutsSnapshot.docs.forEach(doc => {
            const payout = doc.data();
            const payoutRow = createPayoutHistoryRow(payout);
            historyList.appendChild(payoutRow);
        });
        
        console.log(`✅ Loaded ${payoutsSnapshot.docs.length} payout records`);
        
    } catch (error) {
        console.error('❌ Error loading payout history:', error);
    }
}

// Create payout history table row
function createPayoutHistoryRow(payout) {
    const row = document.createElement('tr');
    
    // Format date
    const processedDate = payout.processedAt ? 
        new Date(payout.processedAt.toDate()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'Unknown';
    
    row.innerHTML = `
        <td class="date-cell">${processedDate}</td>
        <td class="amount-cell">$${(payout.amount || 0).toFixed(2)}</td>
        <td class="referrals-cell">${payout.referralCount || 0}</td>
        <td class="paypal-cell">${payout.paypalEmail || 'N/A'}</td>
    `;
    
    return row;
}
