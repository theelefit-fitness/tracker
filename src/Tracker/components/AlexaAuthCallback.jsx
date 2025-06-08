import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { app } from '../services/firebase';
import '../styles/AlexaConnect.css';

const AlexaAuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your Alexa account link...');
  const [details, setDetails] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse the URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const state = queryParams.get('state');
        const error = queryParams.get('error');
        
        // Check if there was an error from Amazon's OAuth
        if (error) {
          setStatus('error');
          setMessage(`Error linking your account: ${error}`);
          setDetails('Please try again or contact support if the issue persists.');
          return;
        }
        
        // Verify the state parameter to prevent CSRF attacks
        const storedState = localStorage.getItem('alexaAuthState');
        if (!state || state !== storedState) {
          setStatus('error');
          setMessage('Invalid authentication state. Please try again.');
          setDetails('This could happen if you used an expired link or if the session was reset.');
          return;
        }
        
        // Clean up the state from localStorage
        localStorage.removeItem('alexaAuthState');
        
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received. Please try again.');
          setDetails('The authorization code is required to complete the account linking process.');
          return;
        }
        
        // Get the user's Firebase auth token
        const auth = getAuth(app);
        const user = auth.currentUser;
        
        if (!user) {
          setStatus('error');
          setMessage('You must be signed in to link your Alexa account.');
          setDetails('Please sign in and try again.');
          return;
        }

        setStatus('connecting');
        setMessage('Connecting with Alexa...');
        setDetails('Please wait while we set up your Alexa skill connection.');
        
        const idToken = await user.getIdToken(true);
        
        // Send the code and token to your backend to complete the linking process
        console.log('Sending request to backend for account linking...');
        const response = await fetch('/api/alexa/link-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/alexa-auth-callback`
          })
        });
        
        const data = await response.json();
        console.log('Account linking response:', data);
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to link account');
        }
        
        // Account linking successful
        setStatus('success');
        setMessage('Your account has been successfully linked with Alexa!');
        setDetails('You can now use voice commands with your Alexa device to log workouts and meals.');
        
        // Redirect back to dashboard after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
        
      } catch (error) {
        console.error('Error in Alexa auth callback:', error);
        setStatus('error');
        setMessage(`Failed to link your account: ${error.message}`);
        setDetails('Please check your connection and try again. If the problem persists, contact support.');
      }
    };
    
    processCallback();
  }, [location, navigate]);
  
  return (
    <div className="alexa-callback-container">
      <h2>Alexa Account Linking</h2>
      
      <div className={`status-message ${status}`}>
        {status === 'processing' && <div className="loading-spinner"></div>}
        {status === 'connecting' && <div className="loading-spinner"></div>}
        <p className="status-text">{message}</p>
        {details && <p className="status-details">{details}</p>}
        
        {status === 'error' && (
          <button 
            className="retry-btn"
            onClick={() => navigate('/alexa-connect')}
          >
            Try Again
          </button>
        )}

        {status === 'success' && (
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
};

export default AlexaAuthCallback; 