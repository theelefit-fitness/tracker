import { createContext, useState, useEffect, useContext } from 'react';
import { onAuthChange, getCurrentUser, auth } from '../services/firebase';

// Create auth context
export const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Check auth state immediately
    const checkAuthState = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log('AuthProvider: User already logged in:', currentUser.email);
        setUser(currentUser);
        setLoading(false);
      } else {
        console.log('AuthProvider: No user currently logged in');
      }
    };
    
    // Run initial check
    checkAuthState();
    
    // Set up auth state listener for changes
    const unsubscribe = onAuthChange((currentUser) => {
      console.log('AuthProvider: Auth state changed', currentUser ? `User: ${currentUser.email}` : 'No user');
      
      if (currentUser) {
        console.log('AuthProvider: User authenticated:', currentUser.email);
        setUser(currentUser);
      } else {
        console.log('AuthProvider: User signed out or not authenticated');
        setUser(null);
      }
      
      setLoading(false);
    });
    
    // Force auth state refresh
    auth.onAuthStateChanged(() => {
      console.log('AuthProvider: Forced auth state refresh');
    });
    
    // Cleanup subscription
    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);
  
  // Log current state for debugging
  console.log('AuthProvider state:', { user: user?.email || 'none', loading });
  
  const value = { user, loading };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 