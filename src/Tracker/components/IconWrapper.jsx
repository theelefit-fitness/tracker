import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Check if we're in Shopify environment
const isInShopify = () => {
  return window.location.hostname.includes('shopify.com') || 
         document.referrer.includes('shopify.com') ||
         window.parent !== window;
};

/**
 * IconWrapper - A component that wraps FontAwesomeIcon and provides a fallback for Shopify CSP
 * When in Shopify, it uses CSS classes instead of FontAwesome's JavaScript
 */
const IconWrapper = ({ icon, ...props }) => {
  // If not in Shopify, use FontAwesomeIcon as normal
  if (!isInShopify()) {
    return <FontAwesomeIcon icon={icon} {...props} />;
  }
  
  // In Shopify, use CSS classes
  let iconName = '';
  if (typeof icon === 'object' && icon.iconName) {
    iconName = icon.iconName;
  } else if (Array.isArray(icon) && icon.length > 1) {
    iconName = icon[1];
  } else if (typeof icon === 'string') {
    iconName = icon;
  }
  
  return (
    <i className={`fa fa-${iconName}`} aria-hidden="true" {...props}></i>
  );
};

export default IconWrapper; 