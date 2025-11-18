// Authentication Modal System JavaScript
// This script can be included on any page that uses the auth modal component



// Auth System Functions
function showAuthSection() {
    const authSection = document.getElementById('authSection');
    
    if (!authSection) {
        console.error('Auth section not found. Make sure to include auth-modal.html component.');
        return;
    }
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // DON'T hide main content - just overlay the modal
    // This prevents scroll position from resetting
    
    // Prevent body scroll and compensate for scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
    }
    
    // Show auth section
    authSection.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
        authSection.classList.add('show');
    }, 10);
    
    // Show login container by default with clean state
    showLogin();
}

function hideAuthSection() {
    const authSection = document.getElementById('authSection');
    
    if (!authSection) return;
    
    // Hide auth section with animation
    authSection.classList.remove('show');
    
    setTimeout(() => {
        authSection.style.display = 'none';
        
        // Clean up forms and messages for next time
        clearAllForms();
        removeAuthMessages();
        
        // Simply restore body scroll - no content to restore since we didn't hide it
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = '';
        
        // That's it! Scroll position never changed.
    }, 300);
}

function showLogin() {
    hideAllAuthContainers();
    clearAllForms();
    removeAuthMessages();
    const loginContainer = document.getElementById('loginContainer');
    if (loginContainer) {
        loginContainer.style.display = 'block';
    }
}

function showCreateAccount() {
    hideAllAuthContainers();
    clearAllForms();
    removeAuthMessages();
    const createAccountContainer = document.getElementById('createAccountContainer');
    if (createAccountContainer) {
        createAccountContainer.style.display = 'block';
    }
}

function showForgotPassword() {
    hideAllAuthContainers();
    clearAllForms();
    removeAuthMessages();
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
    if (forgotPasswordContainer) {
        forgotPasswordContainer.style.display = 'block';
    }
}

function hideAllAuthContainers() {
    const containers = ['loginContainer', 'createAccountContainer', 'forgotPasswordContainer'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
    });
}

function clearAllForms() {
    // Clear login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
        // Also clear individual fields in case reset() doesn't work
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
    }
    
    // Clear create account form
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.reset();
        // Also clear individual fields in case reset() doesn't work
        const createUsername = document.getElementById('createUsername');
        const createEmail = document.getElementById('createEmail');
        const createPhone = document.getElementById('createPhone');
        const createPassword = document.getElementById('createPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        if (createUsername) createUsername.value = '';
        if (createEmail) createEmail.value = '';
        if (createPhone) createPhone.value = '';
        if (createPassword) createPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
    }
    
    // Clear forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.reset();
        // Also clear individual field in case reset() doesn't work
        const resetEmail = document.getElementById('resetEmail');
        if (resetEmail) resetEmail.value = '';
    }
    
    // Restore any hidden form elements (in case they were hidden by email verification message)
    const allInputGroups = document.querySelectorAll('#authSection .input-group');
    allInputGroups.forEach(group => group.style.display = '');
    
    const allAuthActions = document.querySelectorAll('#authSection .auth-actions');
    allAuthActions.forEach(action => action.style.display = '');
    
    // Clear any validation states (remove any error/success styling)
    const allInputs = document.querySelectorAll('#authSection input');
    allInputs.forEach(input => {
        input.classList.remove('error', 'success', 'invalid', 'valid');
        input.style.borderColor = '';
        input.style.backgroundColor = '';
    });
    
    // Reset any button states that might be stuck
    const allButtons = document.querySelectorAll('#authSection button[type="submit"]');
    allButtons.forEach(button => {
        button.disabled = false;
        button.style.pointerEvents = '';
        // Reset button text if it was changed to loading state
        if (button.textContent.includes('...')) {
            if (button.closest('#loginForm')) {
                button.textContent = 'Sign In';
            } else if (button.closest('#createAccountForm')) {
                button.textContent = 'Create Account';
            } else if (button.closest('#forgotPasswordForm')) {
                button.textContent = 'Send Reset Email';
            }
        }
    });
    
    // Remove any submission flags
    const allForms = document.querySelectorAll('#authSection form');
    allForms.forEach(form => {
        form.removeAttribute('data-submitting');
        form.style.pointerEvents = '';
    });
}

// Initialize auth system - handle both DOM ready and already loaded cases
function initializeAuthModal() {
    const log = console; // Simple console logging fallback
    
    try {
    
    // Check if auth section exists at all
    const authSectionElement = document.getElementById('authSection');
    log.debug && log.debug('Auth section exists', { exists: !!authSectionElement });
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    log.debug && log.debug('Login form exists', { exists: !!loginForm });
    
    if (loginForm) {
        log.formSubmission && log.formSubmission('Adding submit event listener to login form');
        loginForm.addEventListener('submit', async function(e) {
            // IMMEDIATE logging - this should appear first
            console.log('🚨 FORM SUBMIT TRIGGERED!');
            
            // Prevent double submissions
            if (this.hasAttribute('data-submitting')) {
                console.log('🚫 Form already submitting, ignoring duplicate submission');
                e.preventDefault();
                return;
            }
            this.setAttribute('data-submitting', 'true');
            

            log.formSubmission && log.formSubmission('LOGIN FORM SUBMITTED - Starting login process');
            
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent any potential form submission
            if (e.defaultPrevented) {
                log.formSubmission && log.formSubmission('Default form submission prevented');
            }
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = this.querySelector('.auth-btn');
            
            log.authFlow && log.authFlow('Login attempt started', { 
                email: email, 
                passwordLength: password ? password.length : 0 
            });
            
            if (!email || !password) {
                log.authFlow && log.authFlow('Validation failed - missing fields');
                showAuthError('Please fill in all fields.');
                return;
            }
            
            // Show loading state and prevent further submissions
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;
            
            // Prevent any other form submissions during this process
            loginForm.style.pointerEvents = 'none';
            log.authFlow && log.authFlow('Button state changed to loading and form disabled');
            
            // Check if Firebase is available
            log.authFlow && log.authFlow('Checking Firebase availability', {
                firebase: typeof window.firebase !== 'undefined',
                FirebaseAuth: typeof window.FirebaseAuth !== 'undefined',
                FirebaseServices: typeof window.FirebaseServices !== 'undefined',
                servicesInitialized: window.FirebaseServices ? window.FirebaseServices.isInitialized() : false
            });
            
            // Safety check - if Firebase auth not ready, show error and return
            if (!window.FirebaseAuth) {
                log.error && log.error('CRITICAL: window.FirebaseAuth is not available!');
                showAuthError('Authentication system is not ready. Please refresh the page and try again.');
                return;
            }
            
            try {
                log.authFlow && log.authFlow('Calling window.FirebaseAuth.signIn...');
                const result = await window.FirebaseAuth.signIn(email, password);
                log.authFlow && log.authFlow('SignIn result received', result);
                
                if (result && result.success) {
                    log.authFlow && log.authFlow('Login successful, showing success message in button');
                    
                    // Show success in button
                    submitBtn.textContent = '✓ Success!';
                    submitBtn.classList.add('auth-btn-success');
                    
                    // Close modal and redirect after a short delay to show success message
                    setTimeout(() => {
                        hideAuthSection();
                        // The Firebase auth state change will handle the redirect
                    }, 1500);
                    
                    // Don't reset button - we want to keep success state visible
                    return;
                    
                } else if (result && result.emailNotVerified) {
                    log.authFlow && log.authFlow('Login failed - email not verified', result);
                    
                    // Show email verification error in button only
                    submitBtn.textContent = '✗ Email Not Verified';
                    submitBtn.classList.add('auth-btn-error');
                    
                    // Immediately restore form interactivity so user can fix input
                    loginForm.style.pointerEvents = 'auto';
                    loginForm.removeAttribute('data-submitting');
                    
                } else {
                    log.authFlow && log.authFlow('Login failed', result);
                    
                    // Show error in button
                    submitBtn.textContent = '✗ ' + (result ? result.error : 'Login failed');
                    submitBtn.classList.add('auth-btn-error');
                    
                    // Immediately restore form interactivity so user can fix input
                    loginForm.style.pointerEvents = 'auto';
                    loginForm.removeAttribute('data-submitting');
                }
            } catch (error) {
                log.error && log.error('LOGIN ERROR CAUGHT', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                
                // Show error in button
                submitBtn.textContent = '✗ An unexpected error occurred';
                submitBtn.classList.add('auth-btn-error');
                
                // Immediately restore form interactivity so user can fix input
                loginForm.style.pointerEvents = 'auto';
                loginForm.removeAttribute('data-submitting');
            } finally {
                // Only reset if not successful (success returns early)
                if (!submitBtn.classList.contains('auth-btn-success')) {
                    log.authFlow && log.authFlow('Resetting button state after error');
                    
                    // Wait 3 seconds to show error, then reset
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('auth-btn-error');
                        loginForm.style.pointerEvents = 'auto';
                        loginForm.removeAttribute('data-submitting');
                    }, 3000);
                }
            }
        });
    }
    
    // Create account form handler
    const createAccountForm = document.getElementById('createAccountForm');
    log.debug && log.debug('Create account form exists', { exists: !!createAccountForm });
    
    if (createAccountForm) {
        log.formSubmission && log.formSubmission('Adding submit event listener to create account form');
        
        createAccountForm.addEventListener('submit', async function(e) {
            // IMMEDIATE logging - this should appear first
            console.log('🚨 CREATE ACCOUNT FORM SUBMIT TRIGGERED!');
            e.preventDefault();
            
            const username = document.getElementById('createUsername').value;
            const email = document.getElementById('createEmail').value;
            const phone = document.getElementById('createPhone').value;
            const password = document.getElementById('createPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = this.querySelector('.auth-btn');
            
            // Validation
            if (!username || !email || !phone || !password || !confirmPassword) {
                showAuthError('Please fill in all fields.');
                return;
            }
            
            // Phone number validation (supports international formats)
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
            const phoneRegex = /^\+?[1-9]\d{9,14}$/; // International format: + followed by 10-15 digits
            if (!phoneRegex.test(cleanPhone)) {
                showAuthError('Please enter a valid phone number (10-15 digits with optional country code).');
                return;
            }
            
            if (password !== confirmPassword) {
                showAuthError('Passwords do not match!');
                return;
            }
            
            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters long.');
                return;
            }
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            try {
                const result = await window.FirebaseAuth.signUp(email, password, username, phone);
                
                if (result.success && result.emailVerificationSent) {
                    showEmailVerificationSuccess(result.message || 'Account created! Please check your email to verify your account before logging in.');
                } else if (result.success) {
                    showAuthSuccess('Account created successfully! Redirecting to your dashboard...');
                    // Don't auto-close modal - let the page redirect handle it
                    // This prevents the jarring modal close -> page redirect sequence
                } else {
                    showAuthError(result.error);
                }
            } catch (error) {
                showAuthError('An unexpected error occurred. Please try again.');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Forgot password form handler
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value;
            const submitBtn = this.querySelector('.auth-btn');
            
            if (!email) {
                showAuthError('Please enter your email address.');
                return;
            }
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const result = await window.FirebaseAuth.sendPasswordReset(email);
                
                if (result.success) {
                    // Hide form elements and show success message
                    showPasswordResetSuccess(result.message);
                    // Don't auto-redirect - let user click back button
                } else {
                    showAuthError(result.error);
                    // Reset button state on error
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                showAuthError('An unexpected error occurred. Please try again.');
                // Reset button state on error
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Close auth section when clicking outside and setup other event handlers
    const authSection = document.getElementById('authSection');
    if (authSection) {
        let mouseDownTarget = null;
        
        // Track where the mouse was pressed down
        authSection.addEventListener('mousedown', function(e) {
            mouseDownTarget = e.target;
        });
        
        // Only close if both mousedown and mouseup happened on the background
        authSection.addEventListener('mouseup', function(e) {
            // Only close if both mousedown and mouseup were on the background (authSection itself)
            if (e.target === authSection && mouseDownTarget === authSection) {
                hideAuthSection();
            }
            
            // Reset the tracking
            mouseDownTarget = null;
        });
        
        // Focus management for accessibility
        authSection.addEventListener('show', function() {
            const firstInput = authSection.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
    }
    
    // Escape key to close auth modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const currentAuthSection = document.getElementById('authSection');
            if (currentAuthSection && currentAuthSection.style.display === 'flex') {
                hideAuthSection();
            }
        }
    });
    
    } catch (error) {
        console.error('AUTH MODAL ERROR: Failed to initialize', error);
        if (log.error) {
            log.error('Auth modal initialization failed', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
    }
}

// Call initialization - handle both DOM ready and already loaded states
if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initializeAuthModal);
} else {

    initializeAuthModal();
}

// Show error message in auth modal
function showAuthError(message) {
    // Remove any existing messages
    removeAuthMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-message-error';
    errorDiv.innerHTML = `<p style="color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0; border: 1px solid #f5c6cb;">${message}</p>`;
    
    // Insert into current visible auth container
    const visibleContainer = document.querySelector('.auth-container[style*="block"], .auth-container:not([style*="none"])');
    if (visibleContainer) {
        const form = visibleContainer.querySelector('.auth-form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeAuthMessages();
    }, 5000);
}

// Show success message in auth modal
function showAuthSuccess(message) {
    // Remove any existing messages
    removeAuthMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-message-success';
    successDiv.innerHTML = `
        <p style="color: #155724; background: #d4edda; padding: 10px; border-radius: 4px; margin: 10px 0; border: 1px solid #c3e6cb;">
            ${message} The email may take 5-10 minutes to arrive—check your spam folder if you don't see it.
        </p>
    `;
    
    // Insert into current visible auth container
    const visibleContainer = document.querySelector('.auth-container[style*="block"], .auth-container:not([style*="none"])');
    if (visibleContainer) {
        const form = visibleContainer.querySelector('.auth-form');
        if (form) {
            form.insertBefore(successDiv, form.firstChild);
        }
    }
}

// Remove auth messages
function removeAuthMessages() {
    const messages = document.querySelectorAll('.auth-message-error, .auth-message-success, .auth-message-verification');
    messages.forEach(msg => msg.remove());
}

// Show email verification success message after signup
function showEmailVerificationSuccess(message) {
    removeAuthMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-message-verification';
    successDiv.innerHTML = `
        <div class="verification-box">
            <h2>✓ Verification Email Sent!</h2>
            <p>Please check your email and click the verification link. The email may take 5-10 minutes to arrive—check your spam folder if you don't see it.</p>
            <p>
                <a href="javascript:void(0)" onclick="showLogin()">
                    Return to Login
                </a>
            </p>
        </div>
    `;
    
    const visibleContainer = document.querySelector('.auth-container[style*="block"], .auth-container:not([style*="none"])');
    if (visibleContainer) {
        const form = visibleContainer.querySelector('.auth-form');
        if (form) {
            // Hide all form inputs and buttons - only show the verification message
            const inputs = form.querySelectorAll('.input-group');
            const buttons = form.querySelectorAll('.auth-actions');
            
            inputs.forEach(input => input.style.display = 'none');
            buttons.forEach(button => button.style.display = 'none');
            
            // Insert verification message at the top
            form.insertBefore(successDiv, form.firstChild);
        }
    }
}

// Show password reset success message after sending reset email
function showPasswordResetSuccess(message) {
    removeAuthMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-message-verification';
    successDiv.innerHTML = `
        <div class="verification-box">
            <h2>✓ Password Reset Email Sent!</h2>
            <p>${message} The email may take 5-10 minutes to arrive—check your spam folder if you don't see it.</p>
            <p>
                <a href="javascript:void(0)" onclick="showLogin()">
                    Return to Login
                </a>
            </p>
        </div>
    `;
    
    const visibleContainer = document.querySelector('.auth-container[style*="block"], .auth-container:not([style*="none"])');
    if (visibleContainer) {
        const form = visibleContainer.querySelector('.auth-form');
        if (form) {
            // Hide all form inputs and buttons - only show the success message
            const inputs = form.querySelectorAll('.input-group');
            const buttons = form.querySelectorAll('.auth-actions');
            
            inputs.forEach(input => input.style.display = 'none');
            buttons.forEach(button => button.style.display = 'none');
            
            // Insert success message at the top
            form.insertBefore(successDiv, form.firstChild);
        }
    }
}

// Show email verification message for login attempts with unverified email
function showEmailVerificationMessage(email, password) {
    removeAuthMessages();
    
    const verificationDiv = document.createElement('div');
    verificationDiv.className = 'auth-message-verification';
    verificationDiv.innerHTML = `
        <div style="color: #721c24; background: #f8d7da; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #f5c6cb;">
            <strong>📧 Email Verification Required</strong>
            <p style="margin: 8px 0;">Please verify your email address before logging in. Check your inbox for a verification link.</p>
            <div style="margin-top: 12px;">
                <button onclick="resendVerificationEmail('${email}', '${password}')" 
                        style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    Resend Verification Email
                </button>
                <a href="javascript:void(0)" onclick="showLogin(); removeAuthMessages();" 
                   style="color: #721c24; text-decoration: underline; font-size: 14px;">
                    Back to Login
                </a>
            </div>
        </div>
    `;
    
    const visibleContainer = document.querySelector('.auth-container[style*="block"], .auth-container:not([style*="none"])');
    if (visibleContainer) {
        const form = visibleContainer.querySelector('.auth-form');
        if (form) {
            form.insertBefore(verificationDiv, form.firstChild);
        }
    }
}

// Resend verification email function
async function resendVerificationEmail(email, password) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Sending...';
    button.disabled = true;
    
    try {
        const result = await window.FirebaseAuth.resendEmailVerification(email, password);
        
        if (result.success) {
            showAuthSuccess(result.message);
        } else {
            showAuthError(result.error);
        }
    } catch (error) {
        showAuthError('Failed to resend verification email. Please try again.');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Make functions globally available
window.showEmailVerificationSuccess = showEmailVerificationSuccess;
window.showPasswordResetSuccess = showPasswordResetSuccess;
window.showEmailVerificationMessage = showEmailVerificationMessage;
window.resendVerificationEmail = resendVerificationEmail;

// Make functions globally available
window.clearAllForms = clearAllForms;

// Export functions for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAuthSection,
        hideAuthSection,
        showLogin,
        showCreateAccount,
        showForgotPassword,
        showAuthError,
        showAuthSuccess,
        showEmailVerificationSuccess,
        showPasswordResetSuccess,
        showEmailVerificationMessage,
        resendVerificationEmail,
        clearAllForms
    };
}