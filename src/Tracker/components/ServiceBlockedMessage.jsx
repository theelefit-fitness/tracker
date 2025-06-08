import React, { useState, useEffect } from 'react';

const ServiceBlockedMessage = ({ service }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show modal after a short delay
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        {/* Modal Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          {/* Close Button */}
          <button 
            onClick={() => setIsVisible(false)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              border: 'none',
              background: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>

          <h4 style={{ 
            margin: '0 0 15px 0',
            color: '#333',
            fontSize: '18px'
          }}>
            Limited Functionality Mode
          </h4>
          
          <p style={{ 
            margin: '0 0 15px 0',
            color: '#666',
            lineHeight: '1.4'
          }}>
            Some features might be limited due to your browser settings. To enable all features:
          </p>

          <ul style={{ 
            margin: '0 0 20px 0',
            padding: '0 0 0 20px',
            color: '#666'
          }}>
            <li style={{ marginBottom: '8px' }}>Disable your ad blocker for this site</li>
            <li style={{ marginBottom: '8px' }}>Allow third-party cookies</li>
            <li style={{ marginBottom: '8px' }}>Check your privacy settings</li>
          </ul>

          <button 
            onClick={() => setIsVisible(false)}
            style={{
              backgroundColor: '#EB6C44',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </>
  );
};

export default ServiceBlockedMessage; 