import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- ROBUST ENVIRONMENT VARIABLE INJECTION ---
// 1. Ensure global process object exists (Polyfill for browser)
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

// 2. Safely extract API Key from various potential sources
try {
  let key = '';

  // Attempt 1: Check standard process.env (if available via build time replacement)
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_KEY) {
    key = process.env.VITE_API_KEY;
  }

  // Attempt 2: Check Vite's import.meta.env
  // We use a specific inner try-catch because simply accessing import.meta can cause syntax errors in some older parsers
  if (!key) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY;
      }
    } catch (innerErr) {
      // Ignore errors accessing import.meta
    }
  }

  // 3. Inject into the location expected by the App (process.env.API_KEY)
  if (key && typeof key === 'string' && key.trim().length > 0) {
    (window as any).process.env.API_KEY = key;
    console.log(`LifeOS System: API Key injected successfully.`);
  } else {
    // Only warn if we are in a development/preview environment where we expect a key
    console.warn('LifeOS System: VITE_API_KEY not found. AI features may not work.');
  }

} catch (e) {
  console.error('LifeOS Critical: Environment injection logic crashed.', e);
}

// Register Service Worker for PWA/Capacitor
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful');
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);