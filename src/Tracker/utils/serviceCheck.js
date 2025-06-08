/**
 * Checks if a service is blocked by adblockers or privacy settings
 */
export const checkServiceAvailability = async (serviceName) => {
  switch (serviceName) {
    case 'firebase':
      try {
        // Try to load a Firebase resource
        const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword');
        return response.status !== 0; // If status is 0, the request was blocked
      } catch (error) {
        return false;
      }
    
    case 'analytics':
      try {
        // Check if common analytics endpoints are blocked
        const testScript = document.createElement('script');
        testScript.src = 'https://www.google-analytics.com/analytics.js';
        testScript.async = true;
        
        return new Promise((resolve) => {
          testScript.onload = () => resolve(true);
          testScript.onerror = () => resolve(false);
          document.head.appendChild(testScript);
          setTimeout(() => {
            document.head.removeChild(testScript);
            resolve(false);
          }, 1000);
        });
      } catch (error) {
        return false;
      }

    default:
      return true;
  }
};

/**
 * Returns a user-friendly message about blocked services
 */
export const getBlockedServicesMessage = (blockedServices) => {
  if (!blockedServices.length) return null;
  
  const messages = {
    firebase: 'Some app features like authentication and data storage',
    analytics: 'Usage analytics and performance monitoring'
  };

  return blockedServices.map(service => messages[service] || service).join(', ');
}; 