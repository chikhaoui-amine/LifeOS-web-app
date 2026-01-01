
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe Environment Variable Injection
// We shim process.env for the Google GenAI SDK
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  (window as any).process.env = (window as any).process.env || {};
  
  try {
    // We access the variable directly so Vite can statically replace 'import.meta.env.VITE_API_KEY' with the string value.
    // We check if import.meta.env exists before accessing the property to avoid runtime crashes.
    // @ts-ignore
    const env = import.meta.env; 
    
    // @ts-ignore
    const key = env ? env.VITE_API_KEY : undefined;

    if (key && typeof key === 'string' && key.length > 0) {
      (window as any).process.env.API_KEY = key;
      console.log('LifeOS: API Key injected successfully.');
    } else {
      console.warn('LifeOS: VITE_API_KEY is missing. Check Vercel Environment Variables.');
    }
  } catch (e) {
    console.warn('LifeOS: Environment variable detection failed safely.', e);
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
