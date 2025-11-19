// Contact Modal Handler
class ContactModal {
    constructor() {
        this.modal = null;
        this.handlersSetup = false;
    }

    async init() {
        console.log('📞 ContactModal.init() called');
        
        // Wait for modal HTML to be loaded
        await this.waitForModal();
        
        this.modal = document.getElementById('contactModal');
        console.log('✅ Contact modal initialized:', !!this.modal);
        
        // Setup click handlers for contact items
        this.setupClickHandlers();
    }
    
    setupClickHandlers() {
        if (this.handlersSetup) {
            console.log('⚠️ Click handlers already setup');
            return;
        }
        
        const contactItems = document.querySelectorAll('.contact-info-item[data-copy-text]');
        console.log('📞 Setting up click handlers for', contactItems.length, 'contact items');
        
        contactItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const textToCopy = item.getAttribute('data-copy-text');
                const valueElement = item.querySelector('.contact-value');
                this.copyToClipboard(textToCopy, valueElement);
            });
        });
        
        this.handlersSetup = true;
        console.log('✅ Click handlers setup complete');
    }
    
    async waitForModal() {
        console.log('⏳ Waiting for contact modal HTML to load...');
        let attempts = 0;
        return new Promise((resolve) => {
            const checkModal = setInterval(() => {
                if (document.getElementById('contactModal') || attempts >= 50) {
                    clearInterval(checkModal);
                    if (attempts >= 50) {
                        console.error('❌ Contact modal HTML failed to load');
                    } else {
                        console.log('✅ Contact modal HTML loaded');
                    }
                    resolve();
                }
                attempts++;
            }, 100);
        });
    }

    show() {
        // Check if modal is initialized
        if (!this.modal) {
            console.error('❌ Contact modal not initialized');
            return;
        }
        
        console.log('📞 Showing contact modal');
        this.modal.classList.add('active');
        
        // Ensure handlers are setup (in case init was called before HTML loaded)
        if (!this.handlersSetup) {
            this.setupClickHandlers();
        }
    }

    hide() {
        if (!this.modal) return;
        
        console.log('📞 Hiding contact modal');
        this.modal.classList.remove('active');
    }
    
    async copyToClipboard(text, valueElement) {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            // Show "Copied!" feedback
            const originalText = valueElement.textContent;
            valueElement.textContent = '✓ Copied!';
            valueElement.classList.add('copied');
            
            // Reset after 2 seconds
            setTimeout(() => {
                valueElement.textContent = originalText;
                valueElement.classList.remove('copied');
            }, 2000);
            
            console.log('✅ Copied to clipboard:', text);
        } catch (err) {
            console.error('❌ Failed to copy:', err);
            alert('Failed to copy. Please try again.');
        }
    }
}

// Initialize contact modal when page loads
let contactModal;

// Initialize immediately or on DOMContentLoaded
async function initContactModal() {
    if (!contactModal) {
        contactModal = new ContactModal();
        await contactModal.init();
        
        // Make globally available
        window.contactModal = contactModal;
    }
}

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactModal);
} else {
    // DOM is already ready, initialize immediately
    initContactModal();
}
