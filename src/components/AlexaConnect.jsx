import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, getIdToken } from 'firebase/auth';
import { app } from '../services/firebase';
import { useAuth } from './AuthProvider';
import '../styles/AlexaConnect.css';

const AlexaConnect = () => {
  const [linkStatus, setLinkStatus] = useState('initial');
  const [error, setError] = useState(null);
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has already linked their Alexa account
  useEffect(() => {
    const checkLinkStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get user's ID token
        const auth = getAuth(app);
        const idToken = await getIdToken(auth.currentUser, true);
        
        // Check with the backend if this user has linked their Alexa account
        const response = await fetch('/api/alexa/check-link-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLinked(data.isLinked || false);
        }
      } catch (error) {
        console.error('Error checking link status:', error);
        setError('Failed to check account link status. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkLinkStatus();
  }, [user]);
  
  const connectWithAlexa = async () => {
    if (!user) {
      setError('Please sign in before connecting with Alexa.');
      return;
    }
    
    setLinkStatus('connecting');
    setError(null);
    
    try {
      // Get the user's ID token
      const auth = getAuth(app);
      const idToken = await getIdToken(auth.currentUser, true);
      
      // Redirect to Alexa Login with OAuth parameters
      const clientId = 'elefit-alexa-client';
      const redirectUri = encodeURIComponent(`${window.location.origin}/alexa-auth-callback`);
      const responseType = 'code';
      const scope = 'profile';
      const state = generateRandomState();
      
      // Store state in localStorage to verify in callback
      localStorage.setItem('alexaAuthState', state);
      
      // Log info for debugging
      console.log('Starting Alexa connection with:');
      console.log('- Client ID:', clientId);
      console.log('- Redirect URI:', decodeURIComponent(redirectUri));
      console.log('- State:', state);
      
      // Generate the Amazon login URL
      const alexaLoginUrl = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=${scope}&response_type=${responseType}&redirect_uri=${redirectUri}&state=${state}`;
      
      // Redirect to Amazon login
      window.location.href = alexaLoginUrl;
      
    } catch (error) {
      console.error('Error connecting to Alexa:', error);
      setError('Failed to connect with Alexa. Please try again.');
      setLinkStatus('error');
    }
  };
  
  // Generate a random state string for OAuth security
  const generateRandomState = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  const unlinkAccount = async () => {
    if (!user) {
      setError('Please sign in first.');
      return;
    }
    
    try {
      setLinkStatus('unlinking');
      setError(null);
      
      // Get user's ID token
      const auth = getAuth(app);
      const idToken = await getIdToken(auth.currentUser, true);
      
      // Call backend to unlink account
      const response = await fetch('/api/alexa/unlink-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsLinked(false);
        setLinkStatus('initial');
      } else {
        throw new Error(data.message || 'Failed to unlink account');
      }
    } catch (error) {
      console.error('Error unlinking account:', error);
      setError('Failed to unlink your Alexa account. Please try again.');
      setLinkStatus('error');
    }
  };
  
  if (loading) {
    return (
      <div className="alexa-connect-container">
        <h2>Connect with Alexa</h2>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="alexa-connect-container">
      <h2>Connect with Alexa</h2>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <div className="alexa-info">
        <h3>EleFit Tracker Alexa Skill</h3>
        <p>
          Link your account to use voice commands with your Alexa device
          to log workouts and meals. Just say:
        </p>
        <ul className="voice-commands">
          <li>"Alexa, open EleFit Tracker"</li>
          <li>"Log a running workout for 30 minutes"</li>
          <li>"Log breakfast with eggs and toast"</li>
        </ul>
      </div>
      
      {isLinked ? (
        <div className="linked-status">
          <div className="status-icon connected">
            <span>✓</span>
          </div>
          <h3>Your account is linked with Alexa</h3>
          <p>You can now use voice commands with your Alexa device.</p>
          
          <button 
            className="unlink-btn"
            onClick={unlinkAccount}
            disabled={linkStatus === 'unlinking'}
          >
            {linkStatus === 'unlinking' ? 'Unlinking...' : 'Unlink Account'}
          </button>
        </div>
      ) : (
        <button 
          className="connect-btn"
          onClick={connectWithAlexa}
          disabled={linkStatus === 'connecting' || !user}
        >
          {linkStatus === 'connecting' ? 'Connecting...' : 'Connect with Alexa'}
        </button>
      )}
      
      <div className="navigation-buttons">
        <button 
          className="back-btn"
          onClick={() => navigate('/settings')}
        >
          Back to Settings
        </button>
      </div>
    </div>
  );
};

export default AlexaConnect; 