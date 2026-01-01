
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process.env.API_KEY for Google GenAI SDK
// This runs before the App renders to ensure the key is available globally
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  (window as any).process.env = (window as any).process.env || {};
  
  try {
    // VITE_API_KEY is replaced by the build tool (Vite) with the actual string value
    // defined in your Vercel Environment Variables.
    // @ts-ignore
    const apiKey = import.meta.env.VITE_API_KEY;
    
    if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
      (window as any).process.env.API_KEY = apiKey;
      console.log('LifeOS: API Key successfully injected from environment.');
    } else {
      console.warn('LifeOS: VITE_API_KEY is missing or empty. Please check Vercel settings and redeploy.');
    }
  } catch (e) {
    console.error('LifeOS: Failed to initialize environment variables', e);
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
