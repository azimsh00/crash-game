# Multiplayer Crash Game 0.1

A real-time multiplayer crash game built with React, TypeScript, and Firebase.

## Troubleshooting Guide

If you're experiencing issues with the game getting stuck on "INITIALISING", follow these steps:

### 1. Check Firebase Configuration

The most common issue is incorrect Firebase configuration, particularly the database URL.

1. Make sure your `.env.local` file has the correct Firebase configuration:
   - Check that `REACT_APP_FIREBASE_DATABASE_URL` points to your Realtime Database URL
   - Try the alternative URLs listed in the comments if the default one doesn't work

2. Use the Firebase Test tool:
   - When running the app, click "Show Firebase Test" in the top right corner
   - Run the tests to check both Database and Authentication connections
   - If any test fails, check the error message for clues

### 2. Check Network Connectivity

1. Open your browser's developer tools (F12)
2. Go to the Network tab
3. Look for requests to `firebaseio.com` domains
4. Check for any failed requests or CORS errors

### 3. Verify Firebase Rules

1. Check that your Firebase Realtime Database rules allow read/write access
2. The rules should match those in `firebase-rules.json`
3. Verify the rules are correctly deployed to your Firebase project

### 4. Clearing Local Storage

Sometimes old game IDs stored in localStorage can cause issues:

1. Open browser developer tools (F12)
2. Go to Application tab > Storage > Local Storage
3. Clear items for your domain
4. Refresh the page

### 5. Check Firebase Console

1. Go to your Firebase Console
2. Navigate to Realtime Database
3. Verify that the database is created and accessible
4. Check if any data is being written when you start the app

### 6. Logging and Debugging

This version includes extensive console logging to help diagnose issues:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages or warnings
4. Follow the flow of game initialization to see where it might be failing

## Deployment on Netlify

1. Make sure your Netlify configuration includes:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add your environment variables in Netlify's build settings

2. Add the `_redirects` file to handle SPA routing:
   ```
   /*    /index.html   200
   ```

## Contact

If you continue to have issues after trying these troubleshooting steps, please open an issue on this repository with:
- Detailed description of the problem
- Screenshots of any errors in the console
- Information about your environment (browser, operating system)