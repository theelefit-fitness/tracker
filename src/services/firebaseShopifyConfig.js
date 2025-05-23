// This file contains special configuration for Firebase when running within Shopify
// to comply with Shopify's Content Security Policy

/**
 * Initializes Firebase with settings optimized for Shopify CSP
 * @param {Object} firebaseApp - Firebase app instance
 */
export const configureFirebaseForShopify = (firebaseApp) => {
  // Check if we're in Shopify environment
  const isInShopify = window.location.hostname.includes('shopify.com') || 
                      document.referrer.includes('shopify.com') ||
                      window.parent !== window;
  
  if (!isInShopify) {
    return; // No changes needed outside Shopify
  }
  
  try {
    // Apply settings to work with Shopify CSP
    
    // 1. Configure to use localhost for emulator (if in development)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Use localhost emulator for development
      console.log('Using Firebase local emulator for Shopify CSP compatibility');
      // Add emulator configuration here if needed
    }
    
    // 2. Disable analytics features that might violate CSP
    if (firebaseApp.analytics) {
      // Disable analytics collection
      firebaseApp.analytics().setAnalyticsCollectionEnabled(false);
    }
    
    // 3. Set storage to only use Shopify-approved domains
    if (firebaseApp.storage) {
      // Configure storage to use only CSP-approved domains
    }
    
    console.log('Firebase configured for Shopify CSP');
  } catch (error) {
    console.error('Error configuring Firebase for Shopify:', error);
  }
};

/**
 * Custom authentication function for Shopify environment
 * Uses techniques that comply with Shopify's CSP
 */
export const shopifyAuthProvider = {
  // Custom auth methods would go here
  // For example, redirecting to Shopify-approved domains for auth
};

export default { configureFirebaseForShopify, shopifyAuthProvider }; 