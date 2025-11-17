# Authentication Modal Component

This is a reusable authentication modal system that can be used across different pages in the Talent Website Creator platform.

## Files Structure

```
components/
├── auth-modal.html       # HTML structure for the auth modals
├── auth-modal.css        # CSS styles for the auth system
├── auth-modal.js         # JavaScript functionality
└── auth-loader.js        # Automatic loader for the auth component
```

## Usage

### Method 1: Automatic Loading (Recommended)

1. Include the auth loader script in your page:
```html
<script src="../components/auth-loader.js"></script>
```

2. Add a button with `onclick="loginAccount()"`:
```html
<button onclick="loginAccount()">Login / Create Account</button>
```

The auth system will automatically load when needed!

### Method 2: Manual Loading

1. Include all three files in your HTML:
```html
<link rel="stylesheet" href="../components/auth-modal.css">
<script src="../components/auth-modal.js"></script>
```

2. Include the HTML component in your page body:
```html
<!-- Include the contents of auth-modal.html here -->
```

3. Call the functions:
```javascript
showAuthSection(); // Show the auth modal
hideAuthSection(); // Hide the auth modal
```

## Available Functions

- `showAuthSection()` - Display the auth modal
- `hideAuthSection()` - Hide the auth modal
- `showLogin()` - Switch to login form
- `showCreateAccount()` - Switch to create account form
- `showForgotPassword()` - Switch to forgot password form

## Features

- ✅ Responsive design (desktop and mobile optimized)
- ✅ Smooth animations and transitions
- ✅ Form validation
- ✅ Firebase-ready (placeholder integration points)
- ✅ Keyboard navigation (ESC to close)
- ✅ Click outside to close
- ✅ Touch-friendly for mobile
- ✅ Automatic path detection for different directory structures

## Current Integration

The auth system is currently integrated into:
- Landing page (desktop and mobile versions)
- Ready for integration into pricing page and other future pages

## Future Enhancements

- Firebase authentication integration
- Social login options (Google, Facebook)
- Email verification
- Password strength validation
- Remember me functionality

## CSS Variables Used

The component respects the following CSS variables from your main theme:
- `--primary-color`
- `--secondary-color`
- `--text-primary`
- `--text-secondary`
- `--border-color`
- `--shadow`
- `--shadow-hover`
- `--transition`
- `--border-radius`

## Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile Safari optimized
- Touch device optimized
- Keyboard accessible