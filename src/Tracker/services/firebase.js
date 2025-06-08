// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc, getDoc } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoeULX-f1uO88OzO_9O9Ey76MILE1RtOc",
  authDomain: "theelefit-3f6c6.firebaseapp.com",
  databaseURL: "https://theelefit-3f6c6-default-rtdb.firebaseio.com",
  projectId: "theelefit-3f6c6",
  storageBucket: "theelefit-3f6c6.firebasestorage.app",
  messagingSenderId: "167064143640",
  appId: "1:167064143640:web:6ed9cee67b60442f76406d",
  measurementId: "G-X8PYEB9LG9"
};

// Initialize Firebase with error handling
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization error:', error);
  // Create fallback objects if Firebase fails to initialize
  app = {
    name: 'elefit-fallback',
    options: firebaseConfig
  };
  
  // Minimal Firestore fallback
  db = {
    collection: () => ({
      add: () => Promise.reject(new Error('Firestore unavailable')),
      get: () => Promise.reject(new Error('Firestore unavailable'))
    }),
    doc: () => ({
      set: () => Promise.reject(new Error('Firestore unavailable')),
      get: () => Promise.reject(new Error('Firestore unavailable'))
    })
  };
  
  // Minimal Auth fallback
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    },
    signInWithPopup: () => Promise.reject(new Error('Authentication unavailable')),
    signInWithRedirect: () => Promise.reject(new Error('Authentication unavailable')),
    signOut: () => Promise.resolve(),
    getRedirectResult: () => Promise.resolve({ user: null })
  };
}

// Log storage functions using user email as document ID
export const storeLog = async (logData, logType) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("User not authenticated or email not available");
    }

    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    
    // Check if user document exists
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with empty arrays for logs
      await setDoc(userDocRef, {
        workoutLogs: [],
        mealLogs: []
      });
    }
    
    // Prepare log entry with timestamp and source
    const logEntry = {
      ...logData,
      timestamp: new Date(),
      source: logData.source || 'manual',
      id: Date.now().toString() // Generate a unique ID
    };

    // Update the appropriate logs array using arrayUnion
    const updatedData = {};
    updatedData[`${logType}Logs`] = [...(userDoc.exists() ? (userDoc.data()[`${logType}Logs`] || []) : []), logEntry];
    
    await setDoc(userDocRef, updatedData, { merge: true });
    
    console.log(`${logType} log stored for user: ${userEmail}`);
    return logEntry.id;
  } catch (error) {
    console.error(`Error storing ${logType} log: `, error);
    throw error;
  }
};

export const storeWorkoutLog = async (workoutData) => {
  return storeLog({
    ...workoutData,
    type: 'workout'
  }, 'workout');
};

export const storeMealLog = async (mealData) => {
  return storeLog({
    ...mealData,
    type: 'meal'
  }, 'meal');
};

export const getLogs = async (logType, maxResults = 50) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("User not authenticated or email not available");
    }

    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const logs = userDoc.data()[`${logType}Logs`] || [];
    
    // Sort by timestamp descending and limit results
    return logs
      .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : a.timestamp.toDate();
        const dateB = b.timestamp instanceof Date ? b.timestamp : b.timestamp.toDate();
        return dateB - dateA;
      })
      .slice(0, maxResults);
  } catch (error) {
    console.error(`Error getting ${logType} logs: `, error);
    throw error;
  }
};

export const getWorkoutLogs = async (maxResults = 50) => {
  return getLogs('workout', maxResults);
};

export const getMealLogs = async (maxResults = 50) => {
  return getLogs('meal', maxResults);
};

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    console.log('Firebase: Starting Google sign-in process');
    const provider = new GoogleAuthProvider();
    
    // Force account selection dialog
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Try popup method first - it's more reliable in development environments
    try {
      console.log('Firebase: Attempting sign in with popup');
      const result = await signInWithPopup(auth, provider);
      console.log('Firebase: Popup sign-in successful');
      return result.user;
    } catch (popupError) {
      console.warn('Firebase: Popup sign-in failed, error:', popupError);
      
      // If popup fails (which can happen due to popup blockers), try redirect
      console.log('Firebase: Falling back to redirect method');
      await signInWithRedirect(auth, provider);
      console.log('Firebase: Redirect initiated, page will reload');
      return null; // User will be returned by getRedirectResult after redirect
    }
  } catch (error) {
    console.error("Firebase: Error signing in with Google:", error);
    throw error;
  }
};

export const getAuthRedirectResult = async () => {
  try {
    console.log('Firebase: Checking for redirect result');
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Firebase: Redirect result found, user authenticated');
      return result.user;
    }
    console.log('Firebase: No redirect result found');
    return null;
  } catch (error) {
    console.error("Firebase: Error getting redirect result:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { app, db, auth }; 