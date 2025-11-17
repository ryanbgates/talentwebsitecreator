// Stripe Configuration
// Replace with your actual Stripe keys

const STRIPE_CONFIG = {
    // Test Mode Keys (for development/testing)
    test: {
        publishableKey: 'pk_test_51QpyWmADVeCT4cfZE64cOY0EbviEc7xapPDq4Bdf6g5ucmkAnLG71Q7tjb865Ho7zE2qh9ek1kVJ5LkgELcegVMQ003siE5Ki0',
        
        // Product Price IDs (Test Mode)
        prices: {
            websiteBuildDeposit: 'price_1SOh5JADVeCT4cfZuXC5iWeQ',     // $99.99 one-time
            websiteBuildFinal: 'price_1SOh6JADVeCT4cfZNH05v1tr',       // $299.99 one-time
            websiteBuildFinalDiscounted: 'price_1SPSgKADVeCT4cfZbn3y8EfB', // $199.99 one-time (with referral code)
            hostingPlan: 'price_1SOh8VADVeCT4cfZDHEVK2Oz',             // $9.99/month
            updatesPlan: 'price_1SOh9HADVeCT4cfZ0SwDe8qw',             // $9.99/month
            completePlan: 'price_1SOhAZADVeCT4cfZ6M1Xj9vJ'             // $14.99/month
        }
    },
    
    // Live Mode Keys (TalentWebsiteCreator - Production)
    live: {
        publishableKey: 'pk_live_51STR8JPzvK6hwHhJczlZGZWcfRzBZeya6q036Q2NF7sABOsQY8d3RnSzaxk6gAFELhWw4UDQPxPN7gWuL2h7M8EU00uUn3bIAE',
        
        // Product Price IDs (Live Mode)
        prices: {
            websiteBuildDeposit: 'price_1STRiKPzvK6hwHhJZwqLoTMx',     // $99.99 one-time
            websiteBuildFinal: 'price_1STRj1PzvK6hwHhJLGaNnyz5',       // $299.99 one-time
            websiteBuildFinalDiscounted: 'price_1STRjzPzvK6hwHhJiLufekzH', // $199.99 one-time (with referral code)
            hostingPlan: 'price_1STRlFPzvK6hwHhJfFQb1ZHg',             // $9.99/month
            updatesPlan: 'price_1STRlqPzvK6hwHhJtXi6NPKF',             // $9.99/month
            completePlan: 'price_1STRmUPzvK6hwHhJitDjZSOB'             // $14.99/month
        }
    },
    
    // Current mode (change to 'test' for development/testing)
    mode: 'live'
};

// Helper function to get current config
function getStripeConfig() {
    return STRIPE_CONFIG[STRIPE_CONFIG.mode];
}

// Helper function to get publishable key
function getStripePublishableKey() {
    return getStripeConfig().publishableKey;
}

// Helper function to get price ID by name
function getStripePriceId(productName) {
    return getStripeConfig().prices[productName];
}

// Make available globally
window.STRIPE_CONFIG = STRIPE_CONFIG;
window.getStripeConfig = getStripeConfig;
window.getStripePublishableKey = getStripePublishableKey;
window.getStripePriceId = getStripePriceId;
