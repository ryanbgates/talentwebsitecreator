// Checkout Modal Loader
(function() {
    console.log('🔧 Checkout loader starting...');
    
    // Load Stripe.js first (required for checkout modal)
    const loadStripe = new Promise((resolve, reject) => {
        // Check if Stripe is already loaded
        if (typeof Stripe !== 'undefined') {
            console.log('✅ Stripe.js already loaded');
            resolve();
            return;
        }
        
        console.log('📦 Loading Stripe.js...');
        const stripeScript = document.createElement('script');
        stripeScript.src = 'https://js.stripe.com/v3/';
        stripeScript.onload = () => {
            console.log('✅ Stripe.js loaded successfully');
            resolve();
        };
        stripeScript.onerror = () => {
            console.error('❌ Failed to load Stripe.js');
            reject(new Error('Failed to load Stripe.js'));
        };
        document.head.appendChild(stripeScript);
    });

    // Load checkout modal CSS
    const checkoutCSS = document.createElement('link');
    checkoutCSS.rel = 'stylesheet';
    checkoutCSS.href = '../components/checkout-modal.css';
    document.head.appendChild(checkoutCSS);

    // Wait for Stripe to load, then load checkout modal
    loadStripe.then(() => {
        console.log('📦 Loading checkout modal HTML...');
        
        // Load checkout modal HTML
        fetch('../components/checkout-modal.html')
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                document.body.appendChild(tempDiv.firstElementChild);
                
                console.log('✅ Checkout modal HTML loaded');

                // Load checkout modal JS after HTML is loaded
                const checkoutScript = document.createElement('script');
                checkoutScript.src = '../components/checkout-modal.js';
                
                // The checkout-modal.js has auto-initialization at the end
                // No need to initialize again here
                console.log('📦 Loading checkout modal JS...');
                
                document.body.appendChild(checkoutScript);
            })
            .catch(error => {
                console.error('❌ Error loading checkout modal HTML:', error);
            });
    }).catch(error => {
        console.error('❌ Error in checkout loader:', error);
    });
})();
