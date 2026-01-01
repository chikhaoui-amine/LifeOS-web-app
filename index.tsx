import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- ROBUST ENVIRONMENT VARIABLE INJECTION ---
if (typeof window !== 'undefined') {
  // 1. Ensure global process object exists
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};

  try {
    // 2. Access Vite env vars safely
    // We use a conditional check: (import.meta && import.meta.env)
    // This prevents the "Cannot read properties of undefined" error if env is missing.
    // We keep the string 'import.meta.env.VITE_API_KEY' intact so Vite can replace it during build if the var exists.
    
    // @ts-ignore
    const viteKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_API_KEY : undefined;

    if (viteKey && typeof viteKey === 'string' && viteKey.trim().length > 0) {
      (window as any).process.env.API_KEY = viteKey;
      console.log(`LifeOS System: API Key injected successfully. (Length: ${viteKey.length})`);
    } else {
      console.warn('LifeOS System: VITE_API_KEY is missing or import.meta.env is undefined.');
      console.warn('1. Check Vercel Environment Variables.');
      console.warn('2. Ensure the key name is exactly "VITE_API_KEY".');
      console.warn('3. Redeploy the application after setting the key.');
    }
  } catch (e) {
    console.error('LifeOS Critical: Environment injection crashed.', e);
  }
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