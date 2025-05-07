import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeFirebaseRules } from './firebase/initialize';

// Initialize Firebase rules before rendering the app
initializeFirebaseRules()
  .then(result => {
    console.log("Firebase initialization result:", result);
  })
  .catch(error => {
    console.error("Firebase initialization error:", error);
  })
  .finally(() => {
    // Render the app regardless of the result
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();