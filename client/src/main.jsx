import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor to attach Authorization and Multi-Tenant headers
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  options.headers = options.headers || {};
  
  // Set Authorization header if user token exists
  const token = localStorage.getItem('token');
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Set Authorization header if customer token exists (fallback)
  const customerToken = localStorage.getItem('customerToken');
  if (customerToken && !options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${customerToken}`;
  }

  // Set Multi-Tenant Restaurant ID header
  const restaurantId = localStorage.getItem('restaurantId');
  if (restaurantId && !options.headers['X-Restaurant-ID']) {
    options.headers['X-Restaurant-ID'] = restaurantId;
  }
  
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for Web Push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('🚀 Service Worker registered successfully with scope:', reg.scope))
      .catch((err) => console.error('❌ Service Worker registration failed:', err));
  });
}
