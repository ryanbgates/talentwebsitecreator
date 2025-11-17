// Admin Dashboard JavaScript
console.log('🎬 Admin Dashboard loaded');

let currentFilter = 'building'; // Default to 'building' instead of 'all'
let allForms = []; // Website requests from users collection
let allReferralUsers = [];
let currentTab = 'website-requests';
const ADMIN_EMAIL = 'talentwebsitecreator@gmail.com'; // Admin email

// Wait for Firebase to initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔵 Admin Dashboard initializing...');
    
    // Wait for Firebase to be ready
    await waitForFirebase();
    
    // Check if already authenticated
    checkAdminAuth();
});

// Wait for Firebase services
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = setInterval(() => {
            if (window.AdminFirebaseServices && window.AdminFirebaseServices.isInitialized()) {
                clearInterval(checkFirebase);
                console.log('✅ Admin Firebase ready');
                resolve();
            }
        }, 100);
    });
}

// Check if user is authenticated admin
function checkAdminAuth() {
    const { auth } = window.AdminFirebaseServices;
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user && user.email === ADMIN_EMAIL) {
            console.log('✅ Admin authenticated:', user.email);
            showAdminDashboard(user);
        } else if (user) {
            console.log('❌ User is not admin:', user.email);
            alert('Access denied. Admin privileges required.');
            auth.signOut();
            showAuthScreen();
        } else {
            console.log('❌ Not authenticated');
            showAuthScreen();
        }
    });
}

// Show auth screen
function showAuthScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    
    // Set up sign in button - use Google Sign-In
    document.getElementById('signInBtn').onclick = async () => {
        const { auth } = window.AdminFirebaseServices;
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            await auth.signInWithPopup(provider);
            console.log('✅ Signed in with Google successfully');
        } catch (error) {
            console.error('❌ Sign in error:', error);
            alert('Sign in failed: ' + error.message);
        }
    };
}

// Show admin dashboard
function showAdminDashboard(user) {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // Display admin email
    document.getElementById('adminEmail').textContent = user.email;
    
    // Set up sign out button
    document.getElementById('signOutBtn').onclick = async () => {
        const { auth } = window.AdminFirebaseServices;
        await auth.signOut();
        location.reload();
    };
    
    // Load forms
    loadCompletedForms();
    
    // Load referral data
    loadReferralUsers();
    
    // Load processed payouts
    loadProcessedPayouts();
}

// Switch between tabs
window.switchTab = function(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab content
    const websiteTab = document.getElementById('websiteRequestsTab');
    const currentReferralsTab = document.getElementById('currentReferralsTab');
    const processedPayoutsTab = document.getElementById('processedPayoutsTab');
    
    // Hide all tabs
    websiteTab.classList.remove('active');
    currentReferralsTab.classList.remove('active');
    processedPayoutsTab.classList.remove('active');
    
    // Show selected tab
    if (tabName === 'website-requests') {
        websiteTab.classList.add('active');
    } else if (tabName === 'current-referrals') {
        currentReferralsTab.classList.add('active');
    } else if (tabName === 'processed-payouts') {
        processedPayoutsTab.classList.add('active');
    }
};

// Load all website requests from users collection
async function loadCompletedForms() {
    console.log('📥 Loading website requests from users collection...');
    
    try {
        const db = window.AdminFirebaseServices.db;
        const usersSnapshot = await db.collection('users').get();
        
        allForms = [];
        
        // Loop through all users
        usersSnapshot.docs.forEach(userDoc => {
            const userData = userDoc.data();
            const userId = userDoc.id;
            const websitesMap = userData.websites || {};
            
            // Extract each website from the user's websites map
            Object.keys(websitesMap).forEach(websiteName => {
                const websiteData = websitesMap[websiteName];
                
                // Only include websites that have been submitted (have formProgress)
                if (websiteData.formProgress) {
                    const formData = websiteData.formProgress;
                    
                    // Combine website data with form data and user info
                    const completeFormData = {
                        // Generate unique ID (userId + websiteName)
                        id: `${userId}_${websiteName}`,
                        userId: userId,
                        websiteName: websiteName,
                        
                        // User-level data
                        userEmail: userData.email || formData.userEmail,
                        phoneNumber: userData.phoneNumber,
                        displayName: userData.displayName,
                        stripeCustomerId: userData.stripeCustomerId,
                        
                        // Form data from formProgress
                        ...formData,
                        
                        // Pre-edit snapshot for change tracking
                        preEditSnapshot: websiteData.preEditSnapshot || null,
                        
                        // Website tracking data (overrides formProgress if present)
                        status: websiteData.status || formData.status || 'building',
                        depositPaid: websiteData.depositPaid,
                        depositDate: websiteData.depositDate,
                        finalPaymentAmount: websiteData.finalPaymentAmount,
                        finalPaymentPaid: websiteData.finalPaymentPaid,
                        finalPaymentDate: websiteData.finalPaymentDate,
                        previewApprovedAt: websiteData.previewApprovedAt,
                        services: websiteData.services,
                        subscriptionId: websiteData.subscriptionId,
                        websiteId: websiteData.websiteId,
                        createdAt: websiteData.createdAt || formData.createdAt,
                        submittedAt: websiteData.submittedAt || formData.submittedAt
                    };
                    
                    allForms.push(completeFormData);
                }
            });
        });
        
        // Sort by submission date (newest first)
        allForms.sort((a, b) => {
            const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
            const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
            return dateB - dateA;
        });
        
        console.log(`✅ Loaded ${allForms.length} website requests from users collection`);
        
        // Update stats
        updateStats(allForms);
        
        // Display forms
        displayForms(allForms);
        
    } catch (error) {
        console.error('❌ Error loading website requests:', error);
        alert('Error loading website requests: ' + error.message);
    }
}

// Update statistics
function updateStats(forms) {
    const stats = {
        building: 0,
        preview: 0,
        awaitingPayment: 0,
        finalizing: 0,
        complete: 0,
        editing: 0,
        edited: 0
    };
    
    forms.forEach(form => {
        const status = form.status || 'building';
        if (status === 'building') stats.building++;
        else if (status === 'preview') stats.preview++;
        else if (status === 'awaiting-final-payment') stats.awaitingPayment++;
        else if (status === 'finalizing') stats.finalizing++;
        else if (status === 'complete') stats.complete++;
        else if (status === 'editing') stats.editing++;
        else if (status === 'edited') stats.edited++;
    });
    
    document.getElementById('statBuilding').textContent = stats.building;
    document.getElementById('statPreview').textContent = stats.preview;
    document.getElementById('statAwaitingPayment').textContent = stats.awaitingPayment;
    document.getElementById('statFinalizing').textContent = stats.finalizing;
    document.getElementById('statComplete').textContent = stats.complete;
    document.getElementById('statEditing').textContent = stats.editing;
    document.getElementById('statEdited').textContent = stats.edited;
}

// Filter by status - called when stat cards are clicked
window.filterByStatus = function(status) {
    currentFilter = status;
    
    // Remove active class from all stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => card.classList.remove('active'));
    
    // Add active class to clicked card
    const activeCard = document.querySelector(`.stat-card[data-filter="${status}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
    
    // Re-render forms
    displayForms(allForms);
};

// Display forms based on current filter
function displayForms(forms) {
    const formsList = document.getElementById('formsList');
    const noForms = document.getElementById('noForms');
    
    // Filter forms by current status (no "all" option)
    const filteredForms = forms.filter(form => form.status === currentFilter);
    
    // Clear list
    formsList.innerHTML = '';
    
    if (filteredForms.length === 0) {
        formsList.style.display = 'none';
        noForms.style.display = 'block';
        return;
    }
    
    formsList.style.display = 'grid';
    noForms.style.display = 'none';
    
    // Create form cards
    filteredForms.forEach(form => {
        const card = createFormCard(form);
        formsList.appendChild(card);
    });
}

// Create a form card
function createFormCard(form) {
    const card = document.createElement('div');
    card.className = 'form-card';
    card.dataset.status = form.status || 'info-submitted';
    
    const statusInfo = getStatusInfo(form.status);
    const submittedDate = form.submittedAt?.toDate ? form.submittedAt.toDate() : new Date();
    
    card.innerHTML = `
        <div class="form-card-header">
            <h3>${form.websiteName || 'Untitled Website'}</h3>
            <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
        </div>
        <div class="form-card-body">
            <div class="form-info">
                <div class="info-row">
                    <span class="info-label">Client:</span>
                    <span class="info-value">${form.firstName} ${form.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${form.userEmail}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${form.phoneNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Profession:</span>
                    <span class="info-value">${form.profession || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">${formatDate(submittedDate)}</span>
                </div>
            </div>
        </div>
        <div class="form-card-actions">
            <button class="btn-view" onclick="viewFormDetails('${form.id}')">View Details</button>
            <button class="btn-primary" onclick="updateStatus('${form.id}')">Update Status</button>
        </div>
    `;
    
    return card;
}

// Get status info
function getStatusInfo(status) {
    const statusMap = {
        'building': { label: 'Building', class: 'status-building' },
        'preview': { label: 'In Preview', class: 'status-preview' },
        'awaiting-final-payment': { label: 'Awaiting Payment', class: 'status-payment' },
        'finalizing': { label: 'Finalizing', class: 'status-finalizing' },
        'complete': { label: 'Complete', class: 'status-complete' },
        'editing': { label: 'Editing', class: 'status-editing' },
        'edited': { label: 'Edited', class: 'status-edited' }
    };
    
    return statusMap[status] || { label: 'Unknown', class: 'status-unknown' };
}

// Format date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
}

// Get changed fields by comparing current data with pre-edit snapshot
function getChangedFields(form) {
    if (!form.preEditSnapshot) {
        return {}; // No snapshot means no edits tracked
    }
    
    const changes = {};
    const currentData = form;
    const snapshot = form.preEditSnapshot;
    
    // Define fields to check for changes (excluding metadata fields)
    const fieldsToCheck = [
        'firstName', 'lastName', 'birthDate', 'birthplace', 'ageRange', 'profession',
        'height', 'weight', 'eyeColor', 'hairColor',
        'directEmail', 'directPhone', 'phoneNumber',
        'agentName', 'agentEmail', 'agentPhone',
        'biography', 'resume', 'training', 'skills',
        'imdb', 'instagram', 'demoReel',
        'primaryColor', 'secondaryColor', 'accentColor'
    ];
    
    fieldsToCheck.forEach(field => {
        const currentValue = currentData[field];
        const snapshotValue = snapshot[field];
        
        // Check if values are different (handle null/undefined as empty string)
        const current = currentValue || '';
        const previous = snapshotValue || '';
        
        if (current !== previous) {
            changes[field] = {
                old: previous,
                new: current
            };
        }
    });
    
    // Check photo arrays for changes (compare actual photo URLs, not just count)
    const currentHeadshots = currentData.headshots || [];
    const snapshotHeadshots = snapshot.headshots || [];
    const currentPerformance = currentData.performancePhotos || [];
    const snapshotPerformance = snapshot.performancePhotos || [];
    
    // Helper function to check if two photo arrays are different
    function photosChanged(current, previous) {
        if (current.length !== previous.length) return true;
        
        // Extract URLs from photo objects (photos are objects with {url, originalName, etc})
        const getCurrentUrl = (photo) => typeof photo === 'string' ? photo : photo?.url || '';
        const currentUrls = current.map(getCurrentUrl).sort();
        const previousUrls = previous.map(getCurrentUrl).sort();
        
        // Compare sorted URL arrays
        for (let i = 0; i < currentUrls.length; i++) {
            if (currentUrls[i] !== previousUrls[i]) {
                return true;
            }
        }
        return false;
    }
    
    // Check if headshots changed
    if (photosChanged(currentHeadshots, snapshotHeadshots)) {
        changes.headshots = {
            old: snapshotHeadshots.length,
            new: currentHeadshots.length,
            type: 'photoCount'
        };
    }
    
    // Check if performance photos changed
    if (photosChanged(currentPerformance, snapshotPerformance)) {
        changes.performancePhotos = {
            old: snapshotPerformance.length,
            new: currentPerformance.length,
            type: 'photoCount'
        };
    }
    
    return changes;
}

// Check if a field was changed
function isFieldChanged(fieldName, changedFields) {
    return changedFields.hasOwnProperty(fieldName);
}

// View form details
window.viewFormDetails = function(formId) {
    const form = allForms.find(f => f.id === formId);
    if (!form) return;
    
    const modal = document.getElementById('formDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    // All form data comes from completedForms, no need to check formProgress
    modalTitle.textContent = `${form.firstName || 'N/A'} ${form.lastName || 'N/A'} - ${form.websiteName}`;
    
    // Get changed fields if this is an edited form
    const changedFields = getChangedFields(form);
    const hasChanges = Object.keys(changedFields).length > 0;
    
    // Helper function to create a detail item with change highlighting
    const createDetailItem = (label, value, fieldName) => {
        const isChanged = isFieldChanged(fieldName, changedFields);
        const changedClass = isChanged ? 'field-changed' : '';
        const changedBadge = isChanged ? '<span class="changed-badge">✏️ Edited</span>' : '';
        
        return `
            <div class="detail-item ${changedClass}">
                <strong>${label}:</strong> ${changedBadge}${value}
            </div>
        `;
    };
    
    // Build form details HTML
    let detailsHTML = `
        <div class="form-details">
            ${hasChanges ? '<div class="changes-alert">📝 This form has been edited. Changed fields are highlighted below.</div>' : ''}
            
            <section class="detail-section">
                <h3>Personal Information</h3>
                <div class="detail-grid">
                    ${createDetailItem('Name', `${form.firstName || 'N/A'} ${form.lastName || 'N/A'}`, 'firstName')}
                    ${createDetailItem('Email', form.userEmail || 'N/A', 'userEmail')}
                    ${createDetailItem('Birth Date', form.birthDate || 'N/A', 'birthDate')}
                    ${createDetailItem('Birth Place', form.birthplace || 'N/A', 'birthplace')}
                    ${createDetailItem('Age Range', form.ageRange || 'N/A', 'ageRange')}
                    ${createDetailItem('Profession', form.profession || 'N/A', 'profession')}
                    <div class="detail-item">
                        <strong>Domain:</strong> ${form.websiteName || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Domain Status:</strong> ${form.domainStatus || 'N/A'}
                    </div>
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Physical Characteristics</h3>
                <div class="detail-grid">
                    ${createDetailItem('Height', form.height || 'N/A', 'height')}
                    ${createDetailItem('Weight', form.weight || 'N/A', 'weight')}
                    ${createDetailItem('Eye Color', form.eyeColor || 'N/A', 'eyeColor')}
                    ${createDetailItem('Hair Color', form.hairColor || 'N/A', 'hairColor')}
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Contact Information</h3>
                <div class="detail-grid">
                    ${createDetailItem('Direct Email', form.directEmail || 'N/A', 'directEmail')}
                    ${createDetailItem('Direct Phone', form.directPhone || 'N/A', 'directPhone')}
                    ${createDetailItem('Phone (from account)', form.phoneNumber || 'N/A', 'phoneNumber')}
                    ${createDetailItem('Agent Name', form.agentName || 'N/A', 'agentName')}
                    ${createDetailItem('Agent Email', form.agentEmail || 'N/A', 'agentEmail')}
                    ${createDetailItem('Agent Phone', form.agentPhone || 'N/A', 'agentPhone')}
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Professional Information</h3>
                <div class="detail-grid">
                    ${createDetailItem('Biography', `<div style="white-space: pre-wrap; margin-top: 8px;">${form.biography || 'N/A'}</div>`, 'biography')}
                    ${createDetailItem('Resume/Credits', `<div style="white-space: pre-wrap; margin-top: 8px;">${form.resume || 'N/A'}</div>`, 'resume')}
                    ${createDetailItem('Training', `<div style="white-space: pre-wrap; margin-top: 8px;">${form.training || 'N/A'}</div>`, 'training')}
                    ${createDetailItem('Skills', `<div style="white-space: pre-wrap; margin-top: 8px;">${form.skills || 'N/A'}</div>`, 'skills')}
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Online Presence</h3>
                <div class="detail-grid">
                    ${createDetailItem('IMDb', form.imdb || 'N/A', 'imdb')}
                    ${createDetailItem('Instagram', form.instagram || 'N/A', 'instagram')}
                    ${createDetailItem('Demo Reel', form.demoReel || 'N/A', 'demoReel')}
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Design Preferences</h3>
                <div class="detail-grid">
                    <div class="detail-item ${isFieldChanged('primaryColor', changedFields) ? 'field-changed' : ''}">
                        <strong>Primary Color:</strong> ${isFieldChanged('primaryColor', changedFields) ? '<span class="changed-badge">✏️ Edited</span>' : ''}
                        ${form.primaryColor ? `<span style="display: inline-block; width: 30px; height: 30px; background: ${form.primaryColor}; border: 1px solid #ccc; border-radius: 4px; margin-left: 8px; vertical-align: middle;"></span> <span style="margin-left: 8px;">${form.primaryColor}</span>` : 'N/A'}
                    </div>
                    <div class="detail-item ${isFieldChanged('secondaryColor', changedFields) ? 'field-changed' : ''}">
                        <strong>Secondary Color:</strong> ${isFieldChanged('secondaryColor', changedFields) ? '<span class="changed-badge">✏️ Edited</span>' : ''}
                        ${form.secondaryColor ? `<span style="display: inline-block; width: 30px; height: 30px; background: ${form.secondaryColor}; border: 1px solid #ccc; border-radius: 4px; margin-left: 8px; vertical-align: middle;"></span> <span style="margin-left: 8px;">${form.secondaryColor}</span>` : 'N/A'}
                    </div>
                    <div class="detail-item ${isFieldChanged('accentColor', changedFields) ? 'field-changed' : ''}">
                        <strong>Accent Color:</strong> ${isFieldChanged('accentColor', changedFields) ? '<span class="changed-badge">✏️ Edited</span>' : ''}
                        ${form.accentColor ? `<span style="display: inline-block; width: 30px; height: 30px; background: ${form.accentColor}; border: 1px solid #ccc; border-radius: 4px; margin-left: 8px; vertical-align: middle;"></span> <span style="margin-left: 8px;">${form.accentColor}</span>` : 'N/A'}
                    </div>
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Payment Information (from user account)</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Deposit Paid:</strong> ${form.depositPaid ? '✅ Yes' : '❌ No'}
                    </div>
                    <div class="detail-item">
                        <strong>Deposit Date:</strong> ${form.depositDate ? formatDate(form.depositDate.toDate()) : 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Final Payment Amount:</strong> ${form.finalPaymentAmount ? '$' + form.finalPaymentAmount : 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Final Payment Paid:</strong> ${form.finalPaymentPaid ? '✅ Yes' : '❌ No'}
                    </div>
                    <div class="detail-item">
                        <strong>Final Payment Date:</strong> ${form.finalPaymentDate ? formatDate(form.finalPaymentDate.toDate()) : 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Preview Approved:</strong> ${form.previewApprovedAt ? formatDate(form.previewApprovedAt.toDate()) : 'Not yet approved'}
                    </div>
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Services & Subscription (from user account)</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Updates Service:</strong> ${form.services?.updates ? '✅ Active' : '❌ Not active'}
                    </div>
                    <div class="detail-item">
                        <strong>Hosting Service:</strong> ${form.services?.hosting ? '✅ Active' : '❌ Not active'}
                    </div>
                    <div class="detail-item">
                        <strong>Subscription ID:</strong> ${form.subscriptionId || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Website ID:</strong> ${form.websiteId || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Stripe Customer ID:</strong> ${form.stripeCustomerId || 'N/A'}
                    </div>
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Submission Info</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Submitted:</strong> ${form.submittedAt ? formatDate(form.submittedAt.toDate()) : 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> ${getStatusInfo(form.status).label}
                    </div>
                    <div class="detail-item">
                        <strong>User ID:</strong> ${form.userId}
                    </div>
                    <div class="detail-item">
                        <strong>Referral:</strong> ${form.hasReferral === 'yes' ? `Yes - ${form.referralName || 'N/A'}` : 'No'}
                    </div>
                </div>
            </section>
            
            <section class="detail-section">
                <h3>Photos & Media</h3>
                <div class="detail-grid">
                    <div class="detail-item ${isFieldChanged('headshots', changedFields) ? 'field-changed' : ''}">
                        <strong>Headshots:</strong> ${isFieldChanged('headshots', changedFields) ? '<span class="changed-badge">✏️ Edited</span>' : ''}
                        ${form.headshots?.length || 0} photos uploaded
                        ${isFieldChanged('headshots', changedFields) ? `<span style="color: #64748b; font-size: 12px; display: block; margin-top: 4px;">(was ${changedFields.headshots.old} photos)</span>` : ''}
                    </div>
                    <div class="detail-item ${isFieldChanged('performancePhotos', changedFields) ? 'field-changed' : ''}">
                        <strong>Performance Photos:</strong> ${isFieldChanged('performancePhotos', changedFields) ? '<span class="changed-badge">✏️ Edited</span>' : ''}
                        ${form.performancePhotos?.length || 0} photos uploaded
                        ${isFieldChanged('performancePhotos', changedFields) ? `<span style="color: #64748b; font-size: 12px; display: block; margin-top: 4px;">(was ${changedFields.performancePhotos.old} photos)</span>` : ''}
                    </div>
                </div>
                ${(form.headshots?.length > 0 || form.performancePhotos?.length > 0) ? `
                    <div style="margin-top: 16px;">
                        <button class="btn-download-photos" onclick="downloadAllPhotos('${formId}')">
                            📥 Download All Photos as ZIP
                        </button>
                    </div>
                ` : '<p style="color: #94a3b8; margin-top: 12px;">No photos uploaded yet</p>'}
            </section>
        </div>
    `;
    
    modalBody.innerHTML = detailsHTML;
    modal.style.display = 'flex';
    
    // Force scroll to top after a brief delay to override browser's scroll restoration
    setTimeout(() => {
        modalBody.scrollTop = 0;
    }, 0);
};

// Close form details modal
window.closeFormDetail = function() {
    document.getElementById('formDetailModal').style.display = 'none';
};

// Store the current form being updated
let currentFormBeingUpdated = null;

// Update status - opens modal instead of prompt
window.updateStatus = async function(formId) {
    const form = allForms.find(f => f.id === formId);
    if (!form) return;
    
    // Store the form for later use
    currentFormBeingUpdated = form;
    
    const currentStatus = form.status || 'building';
    const statusInfo = getStatusInfo(currentStatus);
    
    // Update modal content
    document.getElementById('statusModalTitle').textContent = 'Update Website Status';
    document.getElementById('statusModalSubtitle').textContent = `${form.websiteName} - Current Status: ${statusInfo.label}`;
    
    // Highlight current status
    const statusOptions = document.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        if (option.dataset.status === currentStatus) {
            option.classList.add('current');
        } else {
            option.classList.remove('current');
        }
    });
    
    // Show modal
    document.getElementById('updateStatusModal').style.display = 'flex';
};

// Close status modal
window.closeStatusModal = function() {
    document.getElementById('updateStatusModal').style.display = 'none';
    currentFormBeingUpdated = null;
};

// Select status and update in Firebase
window.selectStatus = async function(newStatus) {
    if (!currentFormBeingUpdated) return;
    
    const form = currentFormBeingUpdated;
    
    try {
        const db = window.AdminFirebaseServices.db;
        
        // Update only in users collection (single source of truth)
        const userRef = db.collection('users').doc(form.userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const websitesMap = userData.websites || {};
            
            if (websitesMap[form.websiteName]) {
                // Update the status in the website data
                websitesMap[form.websiteName].status = newStatus;
                
                // Save back to Firebase
                await userRef.set({
                    websites: websitesMap
                }, { merge: true });
                
                console.log(`✅ Status updated successfully to: ${newStatus} for ${form.websiteName}`);
            } else {
                console.error('❌ Website not found in user data:', form.websiteName);
                alert('Error: Website not found in user data');
                return;
            }
        } else {
            console.error('❌ User not found:', form.userId);
            alert('Error: User not found');
            return;
        }
        
        // Close modal
        closeStatusModal();
        
        // Reload website requests
        loadCompletedForms();
        
    } catch (error) {
        console.error('❌ Error updating status:', error);
        alert('Error updating status: ' + error.message);
    }
};

// Load referral users from Firebase
async function loadReferralUsers() {
    console.log('📥 Loading referral users...');
    
    try {
        const db = window.AdminFirebaseServices.db;
        const snapshot = await db.collection('users').get();
        
        console.log(`📊 Found ${snapshot.docs.length} total users in database`);
        
        allReferralUsers = [];
        let totalEarnings = 0;
        let totalReferrals = 0;
        
        snapshot.docs.forEach(doc => {
            const userData = doc.data();
            
            console.log(`Checking user ${userData.email}: referralEarnings=${userData.referralEarnings}, totalReferrals=${userData.totalReferrals}`);
            
            // Include ALL users with referral data (earnings OR referrals)
            if ((userData.referralEarnings && userData.referralEarnings > 0) || (userData.totalReferrals && userData.totalReferrals > 0)) {
                allReferralUsers.push({
                    id: doc.id,
                    ...userData
                });
                totalEarnings += userData.referralEarnings || 0;
                totalReferrals += userData.totalReferrals || 0;
                console.log(`✅ Added user ${userData.email} to referral list`);
            }
        });
        
        console.log(`✅ Loaded ${allReferralUsers.length} users with referral earnings or referrals`);
        
        // Update stats
        document.getElementById('totalReferralUsers').textContent = allReferralUsers.length;
        document.getElementById('totalEarnings').textContent = '$' + totalEarnings.toFixed(2);
        document.getElementById('totalReferralsCount').textContent = totalReferrals;
        
        // Display users
        displayReferralUsers(allReferralUsers);
        
    } catch (error) {
        console.error('❌ Error loading referral users:', error);
        alert('Error loading referral users: ' + error.message);
    }
}

// Display referral users
function displayReferralUsers(users) {
    const usersList = document.getElementById('referralUsersList');
    const noUsers = document.getElementById('noReferralUsers');
    
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.style.display = 'none';
        noUsers.style.display = 'block';
        return;
    }
    
    usersList.style.display = 'grid';
    noUsers.style.display = 'none';
    
    // Sort by earnings (highest first)
    const sortedUsers = [...users].sort((a, b) => (b.referralEarnings || 0) - (a.referralEarnings || 0));
    
    sortedUsers.forEach(user => {
        const card = createReferralUserCard(user);
        usersList.appendChild(card);
    });
}

// Create referral user card
function createReferralUserCard(user) {
    const card = document.createElement('div');
    card.className = 'referral-user-card';
    
    // Check if PayPal email is saved
    const paypalEmail = user.paypalEmail || 'Not set';
    const paypalClass = user.paypalEmail ? 'paypal-set' : 'paypal-not-set';
    
    card.innerHTML = `
        <div class="referral-user-header">
            <div class="referral-user-info">
                <h3>${user.displayName || 'Unknown User'}</h3>
                <p class="referral-user-email">${user.email || 'N/A'}</p>
            </div>
            <div class="referral-earnings">
                <div class="earnings-amount">$${(user.referralEarnings || 0).toFixed(2)}</div>
                <div class="earnings-label">Total Earnings</div>
            </div>
        </div>
        <div class="referral-user-body">
            <div class="referral-detail">
                <span class="referral-detail-label">Referral Code:</span>
                <span class="referral-detail-value">${user.referralCode || 'N/A'}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">Total Referrals:</span>
                <span class="referral-detail-value">${user.totalReferrals || 0}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">PayPal Email:</span>
                <span class="referral-detail-value ${paypalClass}">${paypalEmail}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">Phone:</span>
                <span class="referral-detail-value">${user.phoneNumber || 'N/A'}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">Stripe Customer:</span>
                <span class="referral-detail-value">${user.stripeCustomerId || 'N/A'}</span>
            </div>
        </div>
        <div class="referral-user-actions">
            <button class="btn-payout" onclick="processPayout('${user.id}')">Processed</button>
        </div>
    `;
    
    return card;
}

// Process payout
window.processPayout = function(userId) {
    const user = allReferralUsers.find(u => u.id === userId);
    if (!user) return;
    
    const paypalEmail = user.paypalEmail || 'NOT SET';
    const paypalWarning = user.paypalEmail ? '' : '\n\n⚠️ WARNING: User has not set a PayPal email!';
    
    const message = `Mark payout as processed for ${user.displayName || user.email}?\n\n` +
                    `Amount: $${(user.referralEarnings || 0).toFixed(2)}\n` +
                    `PayPal Email: ${paypalEmail}\n` +
                    `Total Referrals: ${user.totalReferrals || 0}${paypalWarning}\n\n` +
                    `This will reset their earnings and referral count to 0.`;
    
    const confirmed = confirm(message);
    
    if (confirmed) {
        console.log('Processing payout for user:', userId);
        console.log('PayPal Email:', paypalEmail);
        console.log('Amount:', user.referralEarnings);
        
        // Mark as paid and save to payouts subcollection
        markPayoutAsPaid(userId, user.referralEarnings || 0, user.totalReferrals || 0, paypalEmail, user.displayName, user.email);
    }
};

// Mark payout as paid (reset earnings and save to payouts subcollection)
async function markPayoutAsPaid(userId, amount, referralCount, paypalEmail, displayName, email) {
    try {
        const db = window.AdminFirebaseServices.db;
        const userRef = db.collection('users').doc(userId);
        
        // Create payout record in subcollection
        const payoutData = {
            amount: amount,
            referralCount: referralCount,
            paypalEmail: paypalEmail,
            userName: displayName || 'Unknown User',
            userEmail: email || 'N/A',
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedDate: new Date().toISOString()
        };
        
        // Add to payouts subcollection
        await userRef.collection('payouts').add(payoutData);
        
        // Reset user's referral earnings and count
        await userRef.set({
            referralEarnings: 0,
            totalReferrals: 0,
            lastPayoutDate: firebase.firestore.FieldValue.serverTimestamp(),
            lastPayoutAmount: amount
        }, { merge: true });
        
        alert(`✅ Payout processed!\n\n$${amount.toFixed(2)} marked as paid.\nReferral earnings and count reset to 0.`);
        
        // Reload the referral users list and processed payouts
        loadReferralUsers();
        loadProcessedPayouts();
        
    } catch (error) {
        console.error('❌ Error processing payout:', error);
        alert('Error processing payout: ' + error.message);
    }
}

// Load all processed payouts from all users
async function loadProcessedPayouts() {
    console.log('📥 Loading processed payouts...');
    
    try {
        const db = window.AdminFirebaseServices.db;
        const usersSnapshot = await db.collection('users').get();
        
        let allPayouts = [];
        
        // Loop through all users and get their payouts subcollection
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const payoutsSnapshot = await db.collection('users').doc(userDoc.id).collection('payouts').get();
            
            payoutsSnapshot.docs.forEach(payoutDoc => {
                const payoutData = payoutDoc.data();
                allPayouts.push({
                    id: payoutDoc.id,
                    userId: userDoc.id,
                    userName: userData.displayName || 'Unknown User',
                    userEmail: userData.email || 'N/A',
                    ...payoutData
                });
            });
        }
        
        // Sort by processedAt timestamp (most recent first)
        allPayouts.sort((a, b) => {
            const timeA = a.processedAt ? a.processedAt.toDate() : new Date(0);
            const timeB = b.processedAt ? b.processedAt.toDate() : new Date(0);
            return timeB - timeA; // Most recent first
        });
        
        console.log(`✅ Loaded ${allPayouts.length} processed payouts`);
        
        // Calculate stats
        const totalAmount = allPayouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
        const totalReferrals = allPayouts.reduce((sum, payout) => sum + (payout.referralCount || 0), 0);
        
        // Update stats
        document.getElementById('totalPayoutsProcessed').textContent = allPayouts.length;
        document.getElementById('totalAmountPaid').textContent = '$' + totalAmount.toFixed(2);
        document.getElementById('totalReferralsPaid').textContent = totalReferrals;
        
        // Display payouts
        displayProcessedPayouts(allPayouts);
        
    } catch (error) {
        console.error('❌ Error loading processed payouts:', error);
        alert('Error loading processed payouts: ' + error.message);
    }
}

// Display processed payouts
function displayProcessedPayouts(payouts) {
    const payoutsList = document.getElementById('processedPayoutsList');
    const noPayouts = document.getElementById('noProcessedPayouts');
    
    payoutsList.innerHTML = '';
    
    if (payouts.length === 0) {
        payoutsList.style.display = 'none';
        noPayouts.style.display = 'block';
        return;
    }
    
    payoutsList.style.display = 'grid';
    noPayouts.style.display = 'none';
    
    payouts.forEach(payout => {
        const card = createProcessedPayoutCard(payout);
        payoutsList.appendChild(card);
    });
}

// Create processed payout card
function createProcessedPayoutCard(payout) {
    const card = document.createElement('div');
    card.className = 'referral-user-card';
    
    const processedDate = payout.processedAt ? 
        new Date(payout.processedAt.toDate()).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unknown';
    
    card.innerHTML = `
        <div class="referral-user-header">
            <div class="referral-user-info">
                <h3>${payout.userName}</h3>
                <p class="referral-user-email">${payout.userEmail}</p>
            </div>
            <div class="referral-earnings">
                <div class="earnings-amount">$${(payout.amount || 0).toFixed(2)}</div>
                <div class="earnings-label">Paid Out</div>
            </div>
        </div>
        <div class="referral-user-body">
            <div class="referral-detail">
                <span class="referral-detail-label">Processed Date:</span>
                <span class="referral-detail-value">${processedDate}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">Referral Count:</span>
                <span class="referral-detail-value">${payout.referralCount || 0}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">PayPal Email:</span>
                <span class="referral-detail-value ${payout.paypalEmail ? 'paypal-set' : 'paypal-not-set'}">${payout.paypalEmail || 'Not set'}</span>
            </div>
            <div class="referral-detail">
                <span class="referral-detail-label">Status:</span>
                <span class="referral-detail-value status-processed">✓ Processed</span>
            </div>
        </div>
    `;
    
    return card;
}

// Download all photos as ZIP
window.downloadAllPhotos = async function(formId) {
    const form = allForms.find(f => f.id === formId);
    if (!form) {
        alert('Form not found');
        return;
    }
    
    const headshots = form.headshots || [];
    const performancePhotos = form.performancePhotos || [];
    const totalPhotos = headshots.length + performancePhotos.length;
    
    if (totalPhotos === 0) {
        alert('No photos to download');
        return;
    }
    
    // Show progress
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
    progressDiv.innerHTML = `
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Downloading Photos...</div>
        <div style="color: #64748b; margin-bottom: 16px;">
            <span id="photoProgress">0</span> / ${totalPhotos} photos
        </div>
        <div style="width: 300px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div id="photoProgressBar" style="width: 0%; height: 100%; background: #6366f1; transition: width 0.3s ease;"></div>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    try {
        const storage = window.AdminFirebaseServices.storage;
        const zip = new JSZip();
        let downloadedCount = 0;
        
        // Helper function to download and add to zip
        const addPhotoToZip = async (photo, folderName) => {
            try {
                // Use Firebase Storage SDK to get download URL
                const storageRef = storage.ref(photo.storagePath);
                const downloadURL = await storageRef.getDownloadURL();
                
                // Use fetch with no-cors mode to get the image data
                const response = await fetch(downloadURL, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                
                const filename = photo.originalName || photo.fileName || `photo_${Date.now()}.jpg`;
                zip.folder(folderName).file(filename, blob);
                
                downloadedCount++;
                document.getElementById('photoProgress').textContent = downloadedCount;
                document.getElementById('photoProgressBar').style.width = `${(downloadedCount / totalPhotos) * 100}%`;
            } catch (error) {
                console.error(`Failed to download ${photo.originalName}:`, error);
            }
        };
        
        // Download all headshots
        for (const photo of headshots) {
            await addPhotoToZip(photo, 'Headshots');
        }
        
        // Download all performance photos
        for (const photo of performancePhotos) {
            await addPhotoToZip(photo, 'Performance Photos');
        }
        
        // Generate ZIP file
        progressDiv.innerHTML = '<div style="font-size: 18px; font-weight: 600;">Creating ZIP file...</div>';
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download ZIP
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        const clientName = `${form.firstName}_${form.lastName}`.replace(/\s+/g, '_');
        link.download = `${clientName}_${form.websiteName}_Photos.zip`;
        link.click();
        
        // Clean up
        document.body.removeChild(progressDiv);
        
        alert(`Successfully downloaded ${downloadedCount} photos!`);
        
    } catch (error) {
        console.error('Error creating ZIP:', error);
        document.body.removeChild(progressDiv);
        alert('Error downloading photos: ' + error.message);
    }
};


// Close modal when clicking outside
window.onclick = function(event) {
    const formModal = document.getElementById('formDetailModal');
    const statusModal = document.getElementById('updateStatusModal');
    
    if (event.target === formModal) {
        closeFormDetail();
    }
    if (event.target === statusModal) {
        closeStatusModal();
    }
};
