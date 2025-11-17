# Stripe Webhook Setup Guide

## Overview
Webhooks allow Stripe to notify your application when subscription events occur (renewals, cancellations, downgrades, etc.). This ensures your Firestore database stays in sync with Stripe.

---

## Step 1: Get Your Webhook URL

After deploying the `stripeWebhook` function, your webhook URL will be:

```
https://us-central1-talentwebsitecreator-8356b.cloudfunctions.net/stripeWebhook
```

To verify, run:
```bash
firebase functions:config:get
```

Or check the Firebase Console:
- Go to Firebase Console → Functions
- Find `stripeWebhook`
- Copy the trigger URL

---

## Step 2: Create Webhook in Stripe Dashboard

1. **Login to Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/
   - Switch to **Test Mode** (top right toggle) for testing

2. **Navigate to Webhooks**
   - Click "Developers" in the top navigation
   - Click "Webhooks" in the left sidebar
   - Click "+ Add endpoint"

3. **Configure the Endpoint**
   - **Endpoint URL**: Paste your Cloud Function URL from Step 1
   - **Description**: "TalentWebsiteCreator Subscription Events"
   - **Events to send**: Click "Select events"

4. **Select These Events** (click "+ Select events"):
   ✅ `customer.subscription.updated` - Handles renewals, downgrades, plan changes
   ✅ `customer.subscription.deleted` - Handles actual cancellations
   ✅ `invoice.payment_succeeded` - Tracks successful payments
   ✅ `invoice.payment_failed` - Alerts for failed payments

5. **Click "Add endpoint"**

---

## Step 3: Get Webhook Signing Secret

After creating the webhook:

1. Click on your newly created webhook endpoint
2. Click "Reveal" next to **Signing secret**
3. Copy the secret (starts with `whsec_...`)

---

## Step 4: Add Webhook Secret to Firebase

You need to add the webhook secret to your Firebase environment:

### Option 1: Using Firebase CLI (Recommended)

```bash
cd functions
firebase functions:config:set stripe.webhook_secret="whsec_your_signing_secret_here"
firebase deploy --only functions:stripeWebhook
```

### Option 2: Using .env File (Local Development)

1. Edit `functions/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

2. Redeploy:
```bash
firebase deploy --only functions:stripeWebhook
```

---

## Step 5: Test the Webhook

### Using Stripe CLI (Recommended for Local Testing)

1. **Install Stripe CLI**:
   - Download from: https://stripe.com/docs/stripe-cli
   - Or: `npm install -g stripe`

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Function**:
   ```bash
   stripe listen --forward-to https://us-central1-talentwebsitecreator-8356b.cloudfunctions.net/stripeWebhook
   ```

4. **Trigger Test Events**:
   ```bash
   stripe trigger customer.subscription.updated
   stripe trigger customer.subscription.deleted
   stripe trigger invoice.payment_succeeded
   ```

### Using Stripe Dashboard

1. Go to Developers → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Select an event type
5. Click "Send test webhook"

---

## Step 6: Monitor Webhook Events

### In Firebase Console:
1. Go to Functions → stripeWebhook
2. Click "Logs" tab
3. Watch for webhook events in real-time

### In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click your endpoint
3. View recent deliveries and responses

---

## What Happens When Events Fire

### `customer.subscription.updated`
- **Downgrade Scheduled**: Updates services when billing period ends
- **Cancel at Period End**: Marks subscription for cancellation
- **Renewal**: Updates `currentPeriodEnd` timestamp

### `customer.subscription.deleted`
- **Removes all services**: `hosting: false, updates: false, complete: false`
- **Removes subscription ID** from website
- **Logs cancellation timestamp**

### `invoice.payment_succeeded`
- Logs successful payment
- Can be extended to send receipt emails

### `invoice.payment_failed`
- Logs failed payment
- Can be extended to notify user and pause services

---

## Production Setup

When you're ready to go live:

1. **Switch to Live Mode** in Stripe
2. **Create a new webhook endpoint** (same URL, but in Live mode)
3. **Get the LIVE webhook secret** (different from test)
4. **Update Firebase config** with live secret:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_live_secret_here"
   firebase deploy --only functions:stripeWebhook
   ```

---

## Troubleshooting

### Webhook Not Receiving Events
- ✅ Check webhook URL is correct
- ✅ Verify endpoint is enabled in Stripe
- ✅ Check Firebase function logs for errors
- ✅ Ensure webhook secret is configured correctly

### Signature Verification Failed
- ✅ Double-check webhook secret matches Stripe
- ✅ Redeploy function after updating secret
- ✅ Make sure using raw body (not parsed JSON)

### Events Not Updating Firestore
- ✅ Check function logs for errors
- ✅ Verify user has `stripeCustomerId` field
- ✅ Ensure subscription ID matches website data
- ✅ Check Firestore security rules allow updates

---

## Security Notes

🔒 **Never commit webhook secrets to git**
🔒 **Use environment variables or Firebase config**
🔒 **Always verify webhook signatures**
🔒 **Use HTTPS for webhook endpoints**

---

## Need Help?

- Stripe Webhooks Docs: https://stripe.com/docs/webhooks
- Firebase Functions Docs: https://firebase.google.com/docs/functions
- Test your webhooks: https://dashboard.stripe.com/test/webhooks
