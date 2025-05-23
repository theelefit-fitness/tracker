import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/common.css'
import './styles/shopify-integration.css'
import App from './App.js'

// Check if we're running in Shopify environment
const isInShopify = window.location.hostname.includes('shopify.com') || 
                    document.referrer.includes('shopify.com') ||
                    window.parent !== window ||
                    (window.elefit && window.elefit.shopDomain);

// Add a class to the body element if we're in Shopify
if (isInShopify) {
  document.body.classList.add('shopify-embedded-app');
}

// Function to initialize the app
function initApp() {
  // Try to find either the standalone root or the Shopify embedded container
  const rootElement = document.getElementById('react-app-container') || document.getElementById('root');
  
  if (!rootElement) {
    console.log('Root element not found, delaying initialization...');
    // Try again in 100ms if the root element isn't found
    setTimeout(initApp, 100);
    return;
  }

  // Check if ad blocker is active
  const hasAdBlocker = document.documentElement.classList.contains('adblock-enabled');
  if (hasAdBlocker) {
    console.log('Initializing app with ad blocker compatibility');
    document.body.classList.add('adblock-compat');
  }

  try {
    // Create root and render app
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App isEmbedded={isInShopify} />
      </StrictMode>
    );
    
    console.log('React app initialized successfully in', isInShopify ? 'Shopify embedded mode' : 'standalone mode');
  } catch (error) {
    console.error('Error initializing React app:', error);
  }
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
