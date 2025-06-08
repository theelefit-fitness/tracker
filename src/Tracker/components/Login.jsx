import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { signInWithGoogle, getCurrentUser, getAuthRedirectResult, onAuthChange } from '../services/firebase';
import '../styles/Login.css';

const Login = ({ isEmbedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('Login component mounted', isEmbedded ? 'in embedded mode' : 'in standalone mode');
    
    // Check if the user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      console.log('Already logged in as:', currentUser.email);
      setUser(currentUser);
      setLoading(false);
      return;
    }
    
    // Check if we just came back from a redirect
    const checkRedirectResult = async () => {
      try {
        console.log('Checking redirect result...');
        const redirectUser = await getAuthRedirectResult();
        if (redirectUser) {
          // User successfully authenticated through redirect
          console.log('Redirect successful, logged in as:', redirectUser.email);
          setUser(redirectUser);
          // Force navigation to dashboard
          navigate('/', { replace: true });
        } else {
          console.log('No redirect result found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Redirect login error:', error);
        setError('Failed to sign in. Please try again.');
        setLoading(false);
      }
    };
    
    // Set up auth state listener
    const unsubscribe = onAuthChange((currentUser) => {
      if (currentUser) {
        console.log('Auth state changed, user logged in:', currentUser.email);
        setUser(currentUser);
        setLoading(false);
        // Force navigation to dashboard when auth state changes
        navigate('/', { replace: true });
      }
    });
    
    checkRedirectResult();
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate, isEmbedded]);
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    console.log('User authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google sign-in process...');
      // This will either complete with popup or redirect to Google
      const user = await signInWithGoogle();
      
      if (user) {
        // If we got a user back directly (from popup), set it
        console.log('Popup sign-in successful, user:', user.email);
        setUser(user);
        // Force navigation to dashboard
        navigate('/', { replace: true });
      } else {
        // Redirect was initiated, wait for redirect to complete
        console.log('Redirect initiated, waiting for callback');
        // Leave loading true as we're redirecting
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to sign in. Please try again. Error: ' + error.message);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={`login-page ${isEmbedded ? 'login-embedded' : ''}`}>
        <div className={`login-container ${isEmbedded ? 'login-embedded' : ''}`}>
          <div className="login-card">
            <img src="https://theelefit.com/cdn/shop/files/freepik_br_3e6ca94d-018d-4329-8cd3-828c77c68075_1.svg?v=1737707946&width=700" alt="Elefit Logo"/>
            <div className="loading-spinner"></div>
            <p>Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`login-page ${isEmbedded ? 'login-embedded' : ''}`}>
      <div className={`login-container ${isEmbedded ? 'login-embedded' : ''}`}>
        <div className="login-card">
          <img src="https://theelefit.com/cdn/shop/files/freepik_br_3e6ca94d-018d-4329-8cd3-828c77c68075_1.svg?v=1737707946&width=700" alt="Elefit Logo"/>
          <h2 className="login-title">Welcome to EleFit</h2>
          <p className="login-subtitle">Track your fitness journey with voice commands</p>
          
          <button 
            className="google-sign-in-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          {error && <p className="login-error">{error}</p>}
          
          <div className="login-features">
            <h3 className="login-features-title">Features:</h3>
            <ul className="login-features-list">
              <li className="login-features-item">Log workouts and meals</li>
              <li className="login-features-item">Track your progress</li>
              <li className="login-features-item">Voice control with Alexa</li>
              <li className="login-features-item">AI-powered insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;