/**
 * API Service for EleFit Tracker
 * Handles configuration for API endpoints and communication with the backend
 */

// Configuration for API URLs
const LOCAL_API_URL = 'http://localhost:5000';
const PRODUCTION_API_URL = 'https://elefit-backend.onrender.com';

// Determine which API URL to use
// If the hostname is localhost or 127.0.0.1, use local API
// Otherwise use production API
export const getBaseApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return LOCAL_API_URL;
  }
  return PRODUCTION_API_URL;
};

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<any>} - Response data
 */
export const apiGet = async (endpoint) => {
  try {
    const baseUrl = getBaseApiUrl();
    const response = await fetch(`${baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API GET error:', error);
    throw error;
  }
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Data to send in the request body
 * @returns {Promise<any>} - Response data
 */
export const apiPost = async (endpoint, data) => {
  try {
    const baseUrl = getBaseApiUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API POST error:', error);
    throw error;
  }
};

export default {
  getBaseApiUrl,
  apiGet,
  apiPost
}; 