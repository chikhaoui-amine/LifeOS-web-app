import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process.env.API_KEY for Google GenAI SDK
// We do this in the TSX file so Vite properly replaces import.meta.env.VITE_API_KEY at build time
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  (window as any).process.env = (window as any).process.env || {};
  
  try {
    // Vite replaces this with the actual string value during build
    const apiKey = (import.meta as any).env.VITE_API_KEY;
    if (apiKey) {
      (window as any).process.env.API_KEY = apiKey;
    }
  } catch (e) {
    console.warn('Failed to access import.meta.env', e);
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