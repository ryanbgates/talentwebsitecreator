const functions = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Stripe - will be initialized in each function to avoid deployment issues
let stripe;

admin.initializeApp();

// Helper function to get Stripe instance
function getStripe() {
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key;
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripe = require("stripe")(stripeKey);
  }
  return stripe;
}

// Create Payment Intent for one-time payments (deposit or final payment)
exports.createPaymentIntent = onCall(async (request) => {
  // In v2, request.auth contains the authentication info
  console.log('createPaymentIntent v2 called with auth:', {
    hasAuth: !!request.auth,
    uid: request.auth?.uid,
    email: request.auth?.token?.email
  });

  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create payment intent.'
    );
  }

  const { priceId, metadata } = request.data;
  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;

  try {
    const stripe = getStripe();
    
    // Get or create Stripe customer
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      console.log('No Stripe customer found - creating new customer for payment intent');
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({ stripeCustomerId: customerId }, { merge: true });
      
      console.log('✅ Stripe customer created:', customerId);
    }
    
    // Get price details from Stripe
    const price = await stripe.prices.retrieve(priceId);
    
    // Create payment intent WITH customer (so payment method can be saved)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: userId,
        userEmail: userEmail,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      setup_future_usage: 'off_session', // Save payment method for future use
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: price.unit_amount,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Create Subscription for monthly plans
exports.createSubscription = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create subscription.'
    );
  }

  const { priceId, paymentMethodId, websiteName } = request.data;
  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;

  try {
    const stripe = getStripe();
    
    // Get or create Stripe customer
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    let customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      console.log('No Stripe customer found - creating new customer');
      
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({ stripeCustomerId: customerId }, { merge: true });
      
      console.log('✅ Stripe customer created:', customerId);
    }

    let defaultPaymentMethodId = paymentMethodId;

    // If no payment method provided, use the customer's saved payment method
    if (!paymentMethodId) {
      console.log('No payment method provided - using saved payment method');
      
      // Get customer's default payment method
      const customer = await stripe.customers.retrieve(customerId);
      defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;
      
      // If no default, get first available payment method
      if (!defaultPaymentMethodId) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
          limit: 1,
        });
        
        if (paymentMethods.data.length > 0) {
          defaultPaymentMethodId = paymentMethods.data[0].id;
          console.log('Using saved payment method:', defaultPaymentMethodId);
        } else {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'No payment method found. Please add a payment method first.'
          );
        }
      }
    } else {
      // Attach new payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription with automatic payment
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: defaultPaymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      websiteName: websiteName,
    });

    // Update Firestore with subscription ID for this website
    // Websites are stored as a map in the user document, not as a subcollection
    if (websiteName) {
      const userDocRef = admin.firestore().collection('users').doc(userId);
      const userDocData = await userDocRef.get();
      const userData = userDocData.data();
      const websitesMap = { ...userData.websites };

      if (websitesMap[websiteName]) {
        // Update the specific website with subscription details
        websitesMap[websiteName].subscriptionId = subscription.id;
        
        // Only set currentPeriodEnd if it exists
        if (subscription.current_period_end) {
          websitesMap[websiteName].currentPeriodEnd = subscription.current_period_end;
        }
        
        // Remove old cancellation fields when creating new subscription
        delete websitesMap[websiteName].subscriptionCancelledAt;
        delete websitesMap[websiteName].cancellationEffectiveAt;
        delete websitesMap[websiteName].pendingCancellation;
        
        websitesMap[websiteName].updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // Save updated websites map to user document
        await userDocRef.update({
          websites: websitesMap,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Subscription ID saved to website:', websiteName);
      } else {
        console.error('❌ Website not found in user data:', websiteName);
      }
    }

    // The subscription will automatically charge the saved payment method
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Apply promo code to payment
exports.applyPromoCode = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to apply promo code.'
    );
  }

  const { promoCode } = data;

  try {
    const stripe = getStripe();
    
    // Retrieve promotion code from Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
      limit: 1,
    });

    if (promoCodes.data.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Invalid promo code.');
    }

    const promotionCode = promoCodes.data[0];
    const coupon = await stripe.coupons.retrieve(promotionCode.coupon);

    return {
      valid: true,
      promotionCodeId: promotionCode.id,
      discount: {
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        currency: coupon.currency,
      },
    };
  } catch (error) {
    console.error('Error applying promo code:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cancel subscription when website is deleted
exports.cancelSubscription = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to cancel subscription.'
    );
  }

  const { subscriptionId } = request.data;
  const userId = request.auth.uid;

  console.log('Canceling subscription:', {
    subscriptionId,
    userId
  });

  try {
    const stripe = getStripe();
    
    // Verify the subscription belongs to this user
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      throw new functions.https.HttpsError('not-found', 'No Stripe customer found.');
    }

    // Retrieve the subscription to verify it belongs to this customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.customer !== customerId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'This subscription does not belong to you.'
      );
    }

    // Cancel the subscription immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    console.log('Subscription canceled successfully:', canceledSubscription.id);

    return {
      success: true,
      subscriptionId: canceledSubscription.id,
      status: canceledSubscription.status,
      message: 'Subscription canceled successfully'
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Update subscription when changing service plans
exports.updateSubscription = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update subscription.'
    );
  }

  const { subscriptionId, newPriceId, planType, changeType } = request.data;
  const userId = request.auth.uid;

  console.log('Updating subscription:', {
    subscriptionId,
    newPriceId,
    planType,
    changeType,
    userId
  });

  try {
    const stripe = getStripe();
    
    // Verify the subscription belongs to this user
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      throw new functions.https.HttpsError('not-found', 'No Stripe customer found.');
    }

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.customer !== customerId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'This subscription does not belong to you.'
      );
    }

    let updatedSubscription;

    // Handle pending cancellation - remove it before proceeding
    if (subscription.cancel_at_period_end === true) {
      console.log('⚠️ Subscription has pending cancellation - removing it');
      
      // Remove the cancellation
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
      
      console.log('✅ Cancellation removed from subscription');
      
      // If reactivating same plan (same price), return early
      const currentPriceId = subscription.items.data[0].price.id;
      if (newPriceId === currentPriceId) {
        console.log('🔄 Reactivation: Same plan selected, no price change needed');
        return {
          success: true,
          type: 'reactivation',
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          message: 'Subscription reactivated successfully'
        };
      }
      
      // Otherwise, continue with plan change (upgrade/downgrade)
      console.log('🔄 Proceeding with plan change after removing cancellation');
    }

    // If planType is 'none', cancel the subscription at period end
    if (planType === 'none' || !newPriceId) {
      console.log('Canceling subscription at period end (no service plan selected)');
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
      
      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: updatedSubscription.current_period_end,
        message: 'Subscription will be canceled at the end of the billing period'
      };
    }

    // Get the current subscription item ID
    const subscriptionItemId = subscription.items.data[0].id;

    // Handle based on upgrade/downgrade
    if (changeType === 'upgrade') {
      // UPGRADE: Charge $5 proration immediately and update now
      console.log('Upgrading plan - charging proration immediately');
      
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice', // Create invoice for the $5 upgrade
      });

      console.log('Subscription upgraded successfully:', updatedSubscription.id);

      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.current_period_end,
        message: 'Plan upgraded successfully. Proration charge applied.'
      };

    } else if (changeType === 'downgrade') {
      // DOWNGRADE: Schedule change for end of billing period
      console.log('Downgrading plan - scheduling for end of period');
      
      // For downgrades, update subscription but no immediate charge
      // The change will take effect at the end of the current billing period
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        proration_behavior: 'none', // No proration for downgrades
        billing_cycle_anchor: 'unchanged' // Keep same billing date
      });

      console.log('Subscription scheduled for downgrade at period end');
      
      // Get current_period_end from the subscription item (not the subscription itself)
      const periodEnd = updatedSubscription.items.data[0]?.current_period_end;
      
      console.log('📊 Period end timestamp:', {
        periodEnd,
        periodEndDate: periodEnd ? new Date(periodEnd * 1000).toISOString() : 'null',
        subscriptionId: updatedSubscription.id
      });
      
      if (!periodEnd) {
        console.error('⚠️ Warning: No current_period_end found in subscription items');
      }

      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: periodEnd,
        message: 'Plan will be updated at the end of your billing period',
        scheduledChange: true
      };

    } else {
      // SAME LEVEL: Switch immediately with no proration (same price)
      console.log('Same level plan switch - updating immediately');
      
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: newPriceId,
        }],
        proration_behavior: 'none', // No charge difference
      });

      console.log('Subscription updated successfully:', updatedSubscription.id);

      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.current_period_end,
        message: 'Plan updated successfully'
      };
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Stripe Webhook Handler - handles all subscription events
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('❌ Webhook secret not configured in environment variables');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log('✅ Webhook verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// Handle subscription updated event
async function handleSubscriptionUpdated(subscription) {
  console.log('📝 Handling subscription.updated:', subscription.id);

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  
  // Get current_period_end from subscription items (Stripe's new location)
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  
  console.log('📊 Period data:', {
    currentPeriodEnd,
    cancelAtPeriodEnd,
    fromItems: subscription.items?.data?.[0]?.current_period_end,
    fromSubscription: subscription.current_period_end
  });

  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price?.id;

  // Map price IDs to plan types (Live Mode)
  const priceIdToPlan = {
    'price_1STRlFPzvK6hwHhJfFQb1ZHg': { planType: 'hosting', services: { hosting: true, updates: false, complete: false } },
    'price_1STRlqPzvK6hwHhJtXi6NPKF': { planType: 'updates', services: { hosting: false, updates: true, complete: false } },
    'price_1STRmUPzvK6hwHhJitDjZSOB': { planType: 'complete', services: { hosting: true, updates: true, complete: true } }
  };

  let planInfo = null;
  
  if (priceId) {
    planInfo = priceIdToPlan[priceId];
    if (!planInfo) {
      console.warn('⚠️ Unknown price ID:', priceId, '- this may be a cancellation or downgrade');
    } else {
      console.log('📊 Plan info:', planInfo);
    }
  } else {
    console.log('ℹ️ No price ID found - subscription may be cancelled or have no items');
  }

  // Find user by Stripe customer ID
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('❌ No user found for customer:', customerId);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  const websitesMap = { ...userData.websites };

  // Find the website with this subscription ID
  let websiteName = null;
  for (const [name, data] of Object.entries(websitesMap)) {
    if (data.subscriptionId === subscriptionId) {
      websiteName = name;
      break;
    }
  }

  if (!websiteName) {
    console.error('❌ No website found for subscription:', subscriptionId);
    return;
  }

  console.log(`✅ Found website: ${websiteName}`);

  // Handle cancellation at period end FIRST (before plan logic)
  if (cancelAtPeriodEnd) {
    console.log('🚫 Subscription set to cancel at period end');
    websitesMap[websiteName].pendingCancellation = true;
    // Use fallback to subscription.current_period_end if currentPeriodEnd is null
    websitesMap[websiteName].cancellationEffectiveAt = currentPeriodEnd || subscription.current_period_end;
    
    // If this is a cancellation, we don't need to process plan changes
    // Just update the metadata and exit
    websitesMap[websiteName].currentPeriodEnd = currentPeriodEnd || subscription.current_period_end;
    websitesMap[websiteName].updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('users').doc(userId).update({
      websites: websitesMap,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Cancellation scheduled for:', websiteName);
    return;
  } else {
    // Remove cancellation flag if it was re-enabled
    delete websitesMap[websiteName].pendingCancellation;
    delete websitesMap[websiteName].cancellationEffectiveAt;
  }

  // If planInfo is null, we can't process this update (skip it)
  if (!planInfo) {
    console.warn('⚠️ No plan info available - skipping service update');
    
    // Still update metadata
    websitesMap[websiteName].currentPeriodEnd = currentPeriodEnd;
    websitesMap[websiteName].updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await admin.firestore().collection('users').doc(userId).update({
      websites: websitesMap,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Subscription metadata updated for:', websiteName);
    return;
  }

  // Check if this is a downgrade taking effect (pendingDowngrade exists)
  const hasPendingDowngrade = websitesMap[websiteName].pendingDowngrade;
  
  // Determine if this is a downgrade by comparing plan values
  const currentServices = websitesMap[websiteName].services || {};
  
  const currentPlanValue = currentServices.complete ? 3 : (currentServices.updates ? 2 : (currentServices.hosting ? 1 : 0));
  const newPlanValue = planInfo.services.complete ? 3 : (planInfo.services.updates ? 2 : (planInfo.services.hosting ? 1 : 0));
  const isDowngrade = newPlanValue < currentPlanValue;
  
  console.log('📊 Change detection:', {
    isDowngrade,
    currentPlanValue,
    newPlanValue,
    hasPendingDowngrade,
    periodEnd: currentPeriodEnd
  });

  // Logic for handling subscription updates:
  // 1. If pendingDowngrade exists, check if it's time to apply it
  // 2. If downgrade AND no pendingDowngrade, it's a NEW scheduled downgrade
  // 3. Otherwise, it's an upgrade or same-level change - apply immediately
  
  if (hasPendingDowngrade) {
    const effectiveAt = hasPendingDowngrade.effectiveAt;
    
    // If effectiveAt is null or undefined, we can't determine when to apply the downgrade
    // This shouldn't happen, but handle it gracefully
    if (!effectiveAt) {
      console.error('⚠️ Warning: pendingDowngrade has no effectiveAt - removing flag');
      delete websitesMap[websiteName].pendingDowngrade;
    } else {
      // Check if the subscription has actually renewed past the effective date
      // currentPeriodEnd should be GREATER than effectiveAt (not equal)
      // This means the billing period has moved forward
      if (currentPeriodEnd > effectiveAt) {
        console.log('⬇️ Processing pending downgrade - period end reached');
        
        // Update services to the new (downgraded) plan
        websitesMap[websiteName].services = planInfo.services;
        
        // Remove pending downgrade flag
        delete websitesMap[websiteName].pendingDowngrade;
        
        console.log('✅ Downgrade applied:', planInfo.planType);
      } else {
        console.log('⏳ Downgrade scheduled but not yet effective - keeping current services');
        // Don't update services yet, just update subscription metadata
      }
    }
  } else if (isDowngrade) {
    // This is a NEW downgrade being scheduled - don't update services yet
    console.log('⏳ New downgrade detected - scheduling for period end, keeping current services');
    
    // Set the pending downgrade flag
    websitesMap[websiteName].pendingDowngrade = {
      newPlanType: planInfo.planType,
      newServices: planInfo.services,
      effectiveAt: currentPeriodEnd,
      scheduledAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Don't update services - they'll be updated when period ends
  } else {
    // No pending downgrade - this is an upgrade or same-level change
    // Update services immediately
    websitesMap[websiteName].services = planInfo.services;
    console.log('✅ Services updated immediately (upgrade or same-level):', planInfo.planType);
  }

  // Update subscription status and period end
  websitesMap[websiteName].currentPeriodEnd = currentPeriodEnd;
  websitesMap[websiteName].updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // Save to Firestore
  await admin.firestore().collection('users').doc(userId).update({
    websites: websitesMap,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Subscription updated in Firestore for:', websiteName);
}

// Handle subscription deleted event (actually cancelled)
async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Handling subscription.deleted:', subscription.id);

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  // Find user by Stripe customer ID
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('❌ No user found for customer:', customerId);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  const websitesMap = { ...userData.websites };

  // Find the website with this subscription ID
  let websiteName = null;
  for (const [name, data] of Object.entries(websitesMap)) {
    if (data.subscriptionId === subscriptionId) {
      websiteName = name;
      break;
    }
  }

  if (!websiteName) {
    console.error('❌ No website found for subscription:', subscriptionId);
    return;
  }

  console.log(`✅ Found website for cancellation: ${websiteName}`);

  // Remove all services (subscription is actually cancelled)
  websitesMap[websiteName].services = {
    hosting: false,
    updates: false,
    complete: false
  };

  // Remove subscription ID
  delete websitesMap[websiteName].subscriptionId;

  // Remove pending flags
  delete websitesMap[websiteName].pendingCancellation;
  delete websitesMap[websiteName].pendingDowngrade;

  // Mark as cancelled
  websitesMap[websiteName].subscriptionCancelledAt = admin.firestore.FieldValue.serverTimestamp();
  websitesMap[websiteName].updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // Save to Firestore
  await admin.firestore().collection('users').doc(userId).update({
    websites: websitesMap,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Subscription cancelled in Firestore for:', websiteName);
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Handling invoice.payment_succeeded:', invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountPaid = invoice.amount_paid / 100; // Convert from cents

  console.log(`✅ Payment succeeded: $${amountPaid} for subscription ${subscriptionId}`);

  // You can add additional logic here if needed (e.g., send receipt email)
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Handling invoice.payment_failed:', invoice.id);

  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountDue = invoice.amount_due / 100; // Convert from cents

  console.log(`❌ Payment failed: $${amountDue} for subscription ${subscriptionId}`);

  // Find user and send notification
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('❌ No user found for customer:', customerId);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // You can add logic here to:
  // 1. Send email notification to user
  // 2. Update website status to "payment-failed"
  // 3. Log the failed payment

  console.log(`⚠️ Payment failed for user ${userId}`);
}

// Get billing data for user (payment history, subscriptions, payment method)
exports.getBillingData = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to view billing data.'
    );
  }

  const userId = request.auth.uid;

  try {
    const stripe = getStripe();
    
    // Get user's Stripe customer ID and website data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;
    const websites = userData?.websites || {};

    if (!customerId) {
      return {
        paymentHistory: [],
        subscriptions: [],
        paymentMethod: null
      };
    }

    // Create a map of subscription IDs to website names
    const subscriptionToWebsite = {};
    for (const [websiteName, websiteData] of Object.entries(websites)) {
      if (websiteData.subscriptionId) {
        subscriptionToWebsite[websiteData.subscriptionId] = {
          name: websiteName,
          services: websiteData.services || {}
        };
      }
    }

    console.log('🗺️ Subscription to website map:', subscriptionToWebsite);

    // Get payment history (charges and invoices)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 50
    });

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    });

    // Build a map of subscription amounts and product names for matching
    const subscriptionDetailsMap = {};
    for (const sub of subscriptions.data) {
      const subscriptionItem = sub.items.data[0];
      const amount = subscriptionItem.price.unit_amount;
      
      // Fetch product name
      let productName = subscriptionItem.price.nickname || 'Subscription';
      try {
        const product = await stripe.products.retrieve(subscriptionItem.price.product);
        productName = product.name || productName;
      } catch (err) {
        console.error('Error fetching product:', err);
      }
      
      subscriptionDetailsMap[sub.id] = {
        amount: amount,
        productName: productName,
        websiteInfo: subscriptionToWebsite[sub.id]
      };
    }

    console.log('📊 Subscription details map:', subscriptionDetailsMap);

    // Format payment history with enhanced descriptions
    const paymentHistory = await Promise.all(charges.data.map(async (charge) => {
      let description = 'Payment';
      const metadata = charge.metadata || {};
      const amount = charge.amount / 100; // Convert from cents to dollars
      
      console.log('💰 Processing charge:', {
        chargeId: charge.id,
        amount: amount,
        description: charge.description,
        created: charge.created
      });
      
      // Check if this is a subscription creation charge by description
      if (charge.description === 'Subscription creation') {
        // Match by amount to determine which subscription plan
        const matchingSubscription = Object.values(subscriptionDetailsMap).find(sub => 
          sub.amount === charge.amount
        );
        
        if (matchingSubscription && matchingSubscription.websiteInfo) {
          description = `Subscription Creation (${matchingSubscription.productName}) - ${matchingSubscription.websiteInfo.name}`;
        } else if (matchingSubscription) {
          description = `Subscription Creation (${matchingSubscription.productName})`;
        } else {
          description = 'Subscription creation';
        }
      } else if (charge.description === 'Subscription update') {
        // Handle subscription upgrades/downgrades
        // Subscription updates should have an invoice that links to the subscription
        let subscriptionId = null;
        
        console.log('🔄 Subscription update charge:', {
          chargeId: charge.id,
          invoice: charge.invoice,
          hasInvoice: !!charge.invoice
        });
        
        // Try to get subscription ID from invoice if available
        if (charge.invoice) {
          try {
            const invoice = await stripe.invoices.retrieve(charge.invoice);
            subscriptionId = invoice.subscription;
            console.log('📄 Invoice retrieved:', {
              invoiceId: invoice.id,
              subscriptionId: subscriptionId
            });
          } catch (err) {
            console.error('Error retrieving invoice for subscription update:', err);
          }
        } else {
          // No invoice - try to match by checking which subscription was recently updated
          // Look for subscriptions with billing_mode.updated_at close to the charge time
          const matchingSubscription = Object.entries(subscriptionDetailsMap).find(([subId, details]) => {
            const sub = subscriptions.data.find(s => s.id === subId);
            if (!sub || !sub.billing_mode || !sub.billing_mode.updated_at) return false;
            
            const timeDiff = Math.abs(charge.created - sub.billing_mode.updated_at);
            return timeDiff < 60; // Within 60 seconds of subscription update
          });
          
          if (matchingSubscription) {
            subscriptionId = matchingSubscription[0];
            console.log('✅ Matched subscription by update time:', subscriptionId);
          }
        }
        
        // If we got a subscription ID, use it to get details
        if (subscriptionId && subscriptionDetailsMap[subscriptionId]) {
          const details = subscriptionDetailsMap[subscriptionId];
          if (details.websiteInfo) {
            description = `Subscription Update (${details.productName}) - ${details.websiteInfo.name}`;
          } else {
            description = `Subscription Update (${details.productName})`;
          }
        } else {
          description = 'Subscription update';
        }
      } else if (metadata.websiteName) {
        // If we have website name in metadata, use it
        if (amount === 99.99) {
          description = `Website Build Deposit - ${metadata.websiteName}`;
        } else if (amount === 199.99 || amount === 299.99) {
          description = `Final Payment - ${metadata.websiteName}`;
        } else {
          description = `${metadata.planType || 'Payment'} - ${metadata.websiteName}`;
        }
      } else if (charge.invoice) {
        // Handle subscription renewals and other invoice-based charges
        // These don't have a specific description but have an invoice linking to subscription
        try {
          const invoice = await stripe.invoices.retrieve(charge.invoice);
          const subscriptionId = invoice.subscription;
          
          if (subscriptionId && subscriptionDetailsMap[subscriptionId]) {
            const details = subscriptionDetailsMap[subscriptionId];
            if (details.websiteInfo) {
              description = `Subscription Payment (${details.productName}) - ${details.websiteInfo.name}`;
            } else {
              description = `Subscription Payment (${details.productName})`;
            }
          } else {
            description = charge.description || 'Payment';
          }
        } catch (err) {
          console.error('Error retrieving invoice:', err);
          description = charge.description || 'Payment';
        }
      } else {
        // Fallback for older payments without website name
        if (amount === 99.99) {
          description = 'Website Build Deposit';
        } else if (amount === 199.99) {
          description = 'Final Payment (Professional)';
        } else if (amount === 299.99) {
          description = 'Final Payment (Premium)';
        } else if (charge.description) {
          description = charge.description;
        }
      }
      
      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description: description,
        created: charge.created,
        receipt_url: charge.receipt_url,
        metadata: metadata
      };
    }));

    // Format subscriptions with proper date, product name, and website
    const subscriptionData = await Promise.all(subscriptions.data.map(async (sub) => {
      console.log('📊 Full Subscription object:', JSON.stringify(sub, null, 2));
      
      // Get the period dates from the subscription item, not the subscription itself
      const subscriptionItem = sub.items.data[0];
      const currentPeriodEnd = subscriptionItem.current_period_end;
      const currentPeriodStart = subscriptionItem.current_period_start;
      
      console.log('📊 Subscription data:', {
        id: sub.id,
        current_period_end: currentPeriodEnd,
        current_period_start: currentPeriodStart,
        productId: subscriptionItem.price.product
      });
      
      // Fetch the product details separately to get the name
      let productName = subscriptionItem.price.nickname || 'Subscription';
      try {
        const product = await stripe.products.retrieve(subscriptionItem.price.product);
        productName = product.name || productName;
      } catch (err) {
        console.error('Error fetching product:', err);
      }
      
      // Get website name for this subscription
      const websiteInfo = subscriptionToWebsite[sub.id];
      const websiteName = websiteInfo?.name || null;
      
      return {
        id: sub.id,
        status: sub.status,
        current_period_end: currentPeriodEnd,
        current_period_start: currentPeriodStart,
        cancel_at_period_end: sub.cancel_at_period_end,
        websiteName: websiteName,
        plan: {
          amount: subscriptionItem.price.unit_amount,
          currency: subscriptionItem.price.currency,
          interval: subscriptionItem.price.recurring.interval,
          nickname: subscriptionItem.price.nickname,
          productId: subscriptionItem.price.product,
          productName: productName
        }
      };
    }));

    // Format payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1
    });
    
    const paymentMethod = paymentMethods.data.length > 0 ? {
      id: paymentMethods.data[0].id,
      brand: paymentMethods.data[0].card.brand,
      last4: paymentMethods.data[0].card.last4,
      exp_month: paymentMethods.data[0].card.exp_month,
      exp_year: paymentMethods.data[0].card.exp_year
    } : null;

    return {
      paymentHistory,
      subscriptions: subscriptionData,
      paymentMethod
    };

  } catch (error) {
    console.error('Error getting billing data:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Create Setup Intent for updating payment method
exports.createSetupIntent = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to update payment method.'
    );
  }

  const userId = request.auth.uid;

  try {
    const stripe = getStripe();
    
    // Get user's Stripe customer ID
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      throw new functions.https.HttpsError('not-found', 'No Stripe customer found.');
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return {
      clientSecret: setupIntent.client_secret
    };

  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// SendGrid Email Service
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Generate custom verification token and send email
exports.sendCustomVerificationEmail = onCall(async (request) => {
  console.log('sendCustomVerificationEmail called');
  
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = request.auth.uid;
  const email = request.auth.token.email;
  const displayName = request.data.displayName || email;
  
  try {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
    
    // Store token in Firestore
    await admin.firestore().collection('verificationTokens').doc(token).set({
      userId: userId,
      email: email,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      used: false
    });
    
    // Create verification link
    const verificationLink = `https://talentwebsitecreator.com/html/email-action-handler.html?mode=verifyEmail&token=${token}`;
    
    // Set SendGrid API key
    const sendgridKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.api_key;
    if (!sendgridKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(sendgridKey);
    
    // Send email via SendGrid
    const msg = {
      to: email,
      from: {
        email: 'noreply@talentwebsitecreator.com',
        name: 'Talent Website Creator'
      },
      replyTo: 'talentwebsitecreator@gmail.com',
      subject: 'Welcome to Talent Website Creator - Verify Your Email ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000000; margin-bottom: 20px;">Welcome to Talent Website Creator!</h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Hi ${displayName},
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Thank you for creating an account! We're excited to help you build your professional portfolio website.
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #000000; word-break: break-all;">${verificationLink}</a>
          </p>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
          
          <p style="color: #999999; font-size: 12px; line-height: 1.6;">
            If you didn't create an account with Talent Website Creator, you can safely ignore this email.
          </p>
        </div>
      `
    };
    
    await sgMail.send(msg);
    console.log('Verification email sent successfully to:', email);
    
    return { success: true, message: 'Verification email sent' };
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Verify custom token
exports.verifyCustomToken = onCall(async (request) => {
  console.log('verifyCustomToken called');
  
  const { token } = request.data;
  
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token required');
  }
  
  try {
    // Get token from Firestore
    const tokenDoc = await admin.firestore().collection('verificationTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid verification link');
    }
    
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Verification link has expired');
    }
    
    // Check if token already used
    if (tokenData.used) {
      throw new functions.https.HttpsError('already-exists', 'Verification link has already been used');
    }
    
    // Mark token as used
    await admin.firestore().collection('verificationTokens').doc(token).update({
      used: true,
      usedAt: Date.now()
    });
    
    // Verify the user's email in Firebase Auth
    await admin.auth().updateUser(tokenData.userId, {
      emailVerified: true
    });
    
    console.log('Email verified successfully for user:', tokenData.userId);
    
    return { success: true, message: 'Email verified successfully' };
    
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send custom password reset email
exports.sendCustomPasswordResetEmail = onCall(async (request) => {
  console.log('sendCustomPasswordResetEmail called');
  
  const { email } = request.data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email required');
  }
  
  try {
    // Check if user exists
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // Don't reveal if user exists or not for security
      console.log('User not found for password reset:', email);
      return { success: true, message: 'If an account exists, password reset email sent' };
    }
    
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (1 * 60 * 60 * 1000); // 1 hour from now
    
    // Store token in Firestore
    await admin.firestore().collection('passwordResetTokens').doc(token).set({
      userId: user.uid,
      email: email,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      used: false
    });
    
    // Create reset link
    const resetLink = `https://talentwebsitecreator.com/html/email-action-handler.html?mode=resetPassword&token=${token}`;
    
    // Set SendGrid API key
    const sendgridKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.api_key;
    if (!sendgridKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(sendgridKey);
    
    // Send email via SendGrid
    const msg = {
      to: email,
      from: {
        email: 'noreply@talentwebsitecreator.com',
        name: 'Talent Website Creator'
      },
      replyTo: 'talentwebsitecreator@gmail.com',
      subject: 'Password Reset for Talent Website Creator 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000000; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Hello,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            You requested to reset your password for your Talent Website Creator account. No problem!
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #000000; word-break: break-all;">${resetLink}</a>
          </p>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This link will expire in 1 hour.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
          
          <p style="color: #999999; font-size: 12px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
      `
    };
    
    await sgMail.send(msg);
    console.log('Password reset email sent successfully to:', email);
    
    return { success: true, message: 'If an account exists, password reset email sent' };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Verify password reset token and update password
exports.verifyPasswordResetToken = onCall(async (request) => {
  console.log('verifyPasswordResetToken called');
  
  const { token, newPassword } = request.data;
  
  if (!token || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'Token and new password required');
  }
  
  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }
  
  try {
    // Get token from Firestore
    const tokenDoc = await admin.firestore().collection('passwordResetTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid password reset link');
    }
    
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Password reset link has expired');
    }
    
    // Check if token already used
    if (tokenData.used) {
      throw new functions.https.HttpsError('already-exists', 'Password reset link has already been used');
    }
    
    // Mark token as used
    await admin.firestore().collection('passwordResetTokens').doc(token).update({
      used: true,
      usedAt: Date.now()
    });
    
    // Update the user's password in Firebase Auth
    await admin.auth().updateUser(tokenData.userId, {
      password: newPassword
    });
    
    console.log('Password reset successfully for user:', tokenData.userId);
    
    return { success: true, message: 'Password reset successfully' };
    
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Old function - keeping for backwards compatibility
exports.sendVerificationEmail = onCall(async (request) => {
  console.log('sendVerificationEmail called');
  
  const { email, displayName, actionLink } = request.data;
  
  if (!email || !actionLink) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and action link required');
  }
  
  try {
    // Set SendGrid API key
    const sendgridKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.api_key;
    if (!sendgridKey) {
      throw new Error('SendGrid API key not configured');
    }
    sgMail.setApiKey(sendgridKey);
    
    // Email content
    const msg = {
      to: email,
      from: {
        email: 'noreply@talentwebsitecreator.com',
        name: 'Talent Website Creator'
      },
      replyTo: 'talentwebsitecreator@gmail.com',
      subject: 'Welcome to Talent Website Creator - Verify Your Email ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #000000; margin-bottom: 20px;">Welcome to Talent Website Creator!</h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Hi ${displayName || email},
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Thank you for creating an account! We're excited to help you build your professional portfolio website.
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              Verify Your Email
            </a>
          </div>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${actionLink}" style="color: #000000; word-break: break-all;">${actionLink}</a>
          </p>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This verification link will expire in 24 hours.
          </p>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6;">
            If you didn't create this account, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999999; font-size: 12px;">
            Questions? Contact us at <a href="mailto:talentwebsitecreator@gmail.com" style="color: #000000;">talentwebsitecreator@gmail.com</a>
          </p>
          
          <p style="color: #999999; font-size: 12px;">
            © 2025 Talent Website Creator. All rights reserved.
          </p>
        </div>
      `,
      text: `
Welcome to Talent Website Creator!

Hi ${displayName || email},

Thank you for creating an account! Please verify your email address by clicking the link below:

${actionLink}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Questions? Contact us at talentwebsitecreator@gmail.com

© 2025 Talent Website Creator
      `
    };
    
    await sgMail.send(msg);
    console.log('✅ Verification email sent successfully to:', email);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
