import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { app } from '../services/firebase';
import '../styles/AlexaConnect.css';

function OAuthCallback() {
  const [status, setStatus] = useState('Processing...');
  const [details, setDetails] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        if (!code) {
          setStatus('Error: No authorization code received');
          setDetails('The authorization code is required to complete the account linking process.');
          return;
        }
        
        // Get Firebase ID token from your auth system
        const auth = getAuth(app);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setStatus('Error: You must be signed in');
          setDetails('Please sign in and try again.');
          return;
        }
        
        setStatus('Connecting with Alexa...');
        setDetails('Please wait while we set up your Alexa skill connection.');
        
        const idToken = await currentUser.getIdToken(true);
        
        // Send code to your backend
        const response = await fetch('/api/alexa/link-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: window.location.origin + '/oauth-callback',
            state: state
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setStatus('Account successfully linked with Alexa!');
          setDetails('You can now use voice commands with your Alexa device to log workouts and meals.');
          // Redirect to dashboard after a delay
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus(`Error: ${data.message}`);
          setDetails('Please try again or contact support if the issue persists.');
        }
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        setStatus(`Error: ${error.message}`);
        setDetails('Please check your connection and try again.');
      }
    };
    
    handleCallback();
  }, [location, navigate]);
  
  return (
    <div className="alexa-callback-container">
      <h2>Alexa Account Linking</h2>
      
      <div className={`status-message ${status.startsWith('Error') ? 'error' : status === 'Processing...' ? 'processing' : 'success'}`}>
        {status === 'Processing...' && <div className="loading-spinner"></div>}
        {status === 'Connecting with Alexa...' && <div className="loading-spinner"></div>}
        <p className="status-text">{status}</p>
        {details && <p className="status-details">{details}</p>}
        
        {status.startsWith('Error') && (
          <button 
            className="retry-btn"
            onClick={() => navigate('/alexa-connect')}
          >
            Try Again
          </button>
        )}

        {status.startsWith('Account successfully') && (
          <button 
            className="continue-btn"
            onClick={() => navigate('/')}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;