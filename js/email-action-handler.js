// Email Action Handler Script
// Handles email verification, password reset, and other Firebase Auth email actions

console.log('🔵 Email Action Handler loaded');

// Wait for Firebase to be initialized
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.FirebaseServices && window.FirebaseServices.isInitialized()) {
                console.log('✅ Firebase initialized');
                resolve();
            } else {
                console.log('⏳ Waiting for Firebase...');
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Get URL parameters
function getParameterByName(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Show specific state
function showState(stateId) {
    // Hide all states
    const states = ['loadingState', 'successState', 'errorState', 'resetPasswordState', 'resetSuccessState'];
    states.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show requested state
    const targetState = document.getElementById(stateId);
    if (targetState) {
        targetState.style.display = 'block';
    }
}

// Show error message
function showError(message) {
    showState('errorState');
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

// Handle email verification
async function handleVerifyEmail(auth, actionCode) {
    console.log('🔵 Handling email verification');
    
    try {
        // Apply the action code (verify email)
        await auth.applyActionCode(actionCode);
        console.log('✅ Email verified successfully');
        
        // Show success state
        showState('successState');
        
    } catch (error) {
        console.error('❌ Email verification error:', error);
        
        let errorMessage = 'Unable to verify your email. ';
        
        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage += 'The verification link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage += 'The verification link is invalid or has already been used.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email address.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showError(errorMessage);
    }
}

// Handle password reset
async function handleResetPassword(auth, actionCode) {
    console.log('🔵 Handling password reset');
    
    try {
        // Verify the password reset code is valid
        await auth.verifyPasswordResetCode(actionCode);
        console.log('✅ Password reset code verified');
        
        // Show password reset form
        showState('resetPasswordState');
        
        // Handle form submission
        const form = document.getElementById('resetPasswordForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const messageElement = document.getElementById('resetMessage');
                
                // Validate passwords match
                if (newPassword !== confirmPassword) {
                    messageElement.textContent = 'Passwords do not match.';
                    messageElement.className = 'message error';
                    messageElement.style.display = 'block';
                    return;
                }
                
                // Validate password length
                if (newPassword.length < 6) {
                    messageElement.textContent = 'Password must be at least 6 characters.';
                    messageElement.className = 'message error';
                    messageElement.style.display = 'block';
                    return;
                }
                
                try {
                    // Confirm password reset
                    await auth.confirmPasswordReset(actionCode, newPassword);
                    console.log('✅ Password reset successfully');
                    
                    // Show success state
                    showState('resetSuccessState');
                    
                } catch (error) {
                    console.error('❌ Password reset error:', error);
                    
                    let errorMessage = 'Failed to reset password. ';
                    
                    switch (error.code) {
                        case 'auth/expired-action-code':
                            errorMessage += 'The reset link has expired. Please request a new one.';
                            break;
                        case 'auth/invalid-action-code':
                            errorMessage += 'The reset link is invalid or has already been used.';
                            break;
                        case 'auth/weak-password':
                            errorMessage += 'Password is too weak. Please use a stronger password.';
                            break;
                        default:
                            errorMessage += error.message;
                    }
                    
                    messageElement.textContent = errorMessage;
                    messageElement.className = 'message error';
                    messageElement.style.display = 'block';
                }
            };
        }
        
    } catch (error) {
        console.error('❌ Password reset verification error:', error);
        
        let errorMessage = 'Unable to reset password. ';
        
        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage += 'The reset link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage += 'The reset link is invalid or has already been used.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showError(errorMessage);
    }
}

// Handle recover email (when user reverts an email change)
async function handleRecoverEmail(auth, actionCode) {
    console.log('🔵 Handling email recovery');
    
    try {
        // Get info about the action
        const info = await auth.checkActionCode(actionCode);
        
        // Revert to the old email
        await auth.applyActionCode(actionCode);
        console.log('✅ Email recovered successfully');
        
        // Show success
        showState('successState');
        document.querySelector('#successState h2').textContent = 'Email Recovered Successfully!';
        document.querySelector('#successState p').textContent = `Your email has been restored to: ${info.data.email}`;
        
    } catch (error) {
        console.error('❌ Email recovery error:', error);
        showError('Unable to recover your email. The link may have expired or is invalid.');
    }
}

// Redirect functions
function redirectToLogin() {
    console.log('🔵 Redirecting to login...');
    
    // Detect if mobile or desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        window.location.href = '/html/dashboard-mobile.html';
    } else {
        window.location.href = '/html/dashboard-desktop.html';
    }
}

function redirectToHome() {
    console.log('🔵 Redirecting to home...');
    window.location.href = '/';
}

// Main handler function
async function handleEmailAction() {
    console.log('🔵 Starting email action handler');
    
    // Show loading state
    showState('loadingState');
    
    // Wait for Firebase
    await waitForFirebase();
    
    const auth = window.FirebaseServices.auth;
    
    if (!auth) {
        console.error('❌ Firebase Auth not available');
        showError('Firebase authentication service is not available. Please try again later.');
        return;
    }
    
    // Get action parameters from URL
    const mode = getParameterByName('mode');
    const actionCode = getParameterByName('oobCode');
    
    console.log('🔍 Action mode:', mode);
    console.log('🔍 Action code:', actionCode ? 'Present' : 'Missing');
    
    // Validate action code
    if (!actionCode) {
        console.error('❌ No action code provided');
        showError('Invalid or missing verification link. Please check the link in your email.');
        return;
    }
    
    // Handle different action modes
    switch (mode) {
        case 'verifyEmail':
            await handleVerifyEmail(auth, actionCode);
            break;
            
        case 'resetPassword':
            await handleResetPassword(auth, actionCode);
            break;
            
        case 'recoverEmail':
            await handleRecoverEmail(auth, actionCode);
            break;
            
        default:
            console.error('❌ Unknown action mode:', mode);
            showError('Invalid action. Please check the link in your email.');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleEmailAction);
} else {
    handleEmailAction();
}

// Make redirect functions globally available
window.redirectToLogin = redirectToLogin;
window.redirectToHome = redirectToHome;

console.log('✅ Email Action Handler initialized');
