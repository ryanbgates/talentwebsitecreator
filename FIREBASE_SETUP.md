# Firebase Setup Instructions for Talent Website Creator

This guide will walk you through setting up Firebase for your project. You'll need to configure Firebase Authentication and Firestore Database.

## Part 1: Firebase Console Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `talentwebsitecreator` (or your preferred name)
4. Click **Continue**
5. **Optional**: Enable Google Analytics (recommended for user insights)
6. Click **Create project**
7. Wait for project creation to complete, then click **Continue**

### Step 2: Enable Authentication
1. In your Firebase project dashboard, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **Email/Password** authentication:
   - Click on **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**
5. **Optional**: Enable other sign-in methods if desired (Google, Facebook, etc.)

### Step 3: Create Firestore Database
1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** for now (we'll configure security rules later)
4. Select your preferred location (choose the closest to your users)
5. Click **"Done"**

### Step 4: Get Firebase Configuration
1. In your Firebase project, click the **Settings gear icon** (⚙️) in the left sidebar
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter app nickname: `Talent Website Creator Web App`
6. **Check** "Also set up Firebase Hosting" (optional but recommended)
7. Click **"Register app"**
8. **IMPORTANT**: Copy the Firebase configuration object shown

## Part 2: Configure Your Project

### Step 5: Update Firebase Configuration
1. Open the file: `js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // Only if you enabled Analytics
};
```

**Example of what it should look like:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyB1234567890abcdefghijklmnop",
    authDomain: "talentwebsitecreator-12345.firebaseapp.com",
    projectId: "talentwebsitecreator-12345",
    storageBucket: "talentwebsitecreator-12345.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456",
    measurementId: "G-ABCDEF1234"
};
```

### Step 6: Test Your Setup
1. Open your website in a browser
2. Open browser Developer Tools (F12)
3. Go to the Console tab
4. Look for these success messages:
   - ✅ Firebase app initialized successfully
   - ✅ Firebase Auth initialized
   - ✅ Firestore initialized
   - ✅ Firebase Auth Service loaded and ready

If you see any errors, double-check your configuration values.

## Part 3: Security Configuration (Important!)

### Step 7: Configure Firestore Security Rules
1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab
3. Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more collection rules as needed for your app
    // Example for user websites/projects:
    match /websites/{websiteId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Click **"Publish"**

### Step 8: Configure Authentication Settings
1. Go to **Authentication** → **Settings** tab
2. **Authorized domains**: Add your domain when you deploy (for now, localhost should be there)
3. **Email templates**: Customize password reset and verification emails if desired
4. **User actions**: Configure password requirements if needed

## Part 4: Testing Authentication

### Step 9: Test User Registration
1. Go to your website landing page
2. Click **"Login / Register"**
3. Click **"Create one here"** to go to signup
4. Fill out the form and submit
5. Check Firebase Console → Authentication → Users to see if the user was created

### Step 10: Test User Login
1. Try logging in with the account you just created
2. You should be redirected to the dashboard
3. Check the browser console for success messages
4. Try logging out from the user menu

## Part 5: Optional Enhancements

### Email Verification (Recommended)
1. In Firebase Console → Authentication → Templates
2. Customize the **Email address verification** template
3. In your code, you can add email verification after signup:

```javascript
// Add this to firebase-auth.js after successful signup
await user.sendEmailVerification();
```

### Password Reset Functionality
- Already implemented! Users can click "Forgot Password?" to reset their password

### Google Sign-In (Optional)
1. In Authentication → Sign-in method, enable Google
2. Add your domain to authorized domains
3. Update your auth modal to include Google sign-in button

## Troubleshooting

### Common Issues:
1. **"Firebase not initialized"** - Check that config values are correct
2. **"Auth domain not authorized"** - Add your domain in Firebase Console → Authentication → Settings
3. **"Permission denied"** - Check Firestore security rules
4. **Console errors** - Make sure all Firebase SDK scripts are loaded before your custom scripts

### Getting Help:
- Check browser console for detailed error messages
- Verify all configuration steps were completed
- Ensure you're using the correct Firebase project
- Test with a simple HTML page first if issues persist

## Next Steps

Once Firebase is working:
1. Test all authentication flows (signup, login, logout, password reset)
2. Verify user data is being stored in Firestore
3. Test the dashboard access control
4. Configure production security rules
5. Set up Firebase Hosting for deployment (optional)

Your Firebase integration is now complete! The website will automatically:
- Redirect logged-in users to the dashboard
- Redirect logged-out users away from protected pages
- Maintain login state across browser sessions
- Handle all authentication flows seamlessly