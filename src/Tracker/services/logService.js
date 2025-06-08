import { collection, addDoc, getDocs, query, orderBy, limit, where, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, getCurrentUser } from './firebase';
import { apiPost, apiGet } from './apiService';

/**
 * Get the currently logged in user or throw an error
 * @returns {Object} - Current user object
 */
const getAuthenticatedUser = () => {
  const user = getCurrentUser();
  if (!user || !user.email) {
    throw new Error("User not authenticated or email not available");
  }
  return user;
};

/**
 * Log a workout to Firestore
 * @param {Object} workoutData - Workout data to log
 * @returns {Promise<string>} - Document ID of the created log
 */
export const logWorkout = async (workoutData) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    
    // First, log to the backend API
    try {
      await apiPost('/api/log-workout', {
        workoutType: workoutData.workoutType,
        activityName: workoutData.activityName,
        duration: workoutData.duration,
        distance: workoutData.distance,
        sets: workoutData.sets,
        reps: workoutData.reps,
        timestamp: workoutData.timestamp instanceof Date 
          ? workoutData.timestamp.toISOString().split('T')[0]
          : workoutData.timestamp,
        source: workoutData.source || 'web'
      });
    } catch (apiError) {
      console.warn("API logging failed, falling back to Firestore only:", apiError);
    }
    
    // Then also log directly to Firestore for redundancy
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
    
    // Prepare log entry with timestamp and ID
    const logEntry = {
      ...workoutData,
      timestamp: new Date(),
      type: 'workout',
      id: Date.now().toString() // Generate a unique ID
    };

    // Update the workout logs array
    const updatedData = {};
    updatedData.workoutLogs = [...(userDoc.exists() ? (userDoc.data().workoutLogs || []) : []), logEntry];
    
    await setDoc(userDocRef, updatedData, { merge: true });
    
    console.log(`Workout log stored for user: ${userEmail}`);
    return logEntry.id;
  } catch (error) {
    console.error("Error logging workout: ", error);
    throw error;
  }
};

/**
 * Log a meal to Firestore
 * @param {Object} mealData - Meal data to log
 * @returns {Promise<string>} - Document ID of the created log
 */
export const logMeal = async (mealData) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    
    // First, log to the backend API
    try {
      await apiPost('/api/log-meal', {
        mealType: mealData.mealType,
        foodItems: mealData.foodItems,
        timestamp: mealData.timestamp instanceof Date 
          ? mealData.timestamp.toISOString().split('T')[0] 
          : mealData.timestamp,
        source: mealData.source || 'web'
      });
    } catch (apiError) {
      console.warn("API logging failed, falling back to Firestore only:", apiError);
    }
    
    // Then also log directly to Firestore for redundancy
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
    
    // Prepare log entry with timestamp and ID
    const logEntry = {
      ...mealData,
      timestamp: new Date(),
      type: 'meal',
      id: Date.now().toString() // Generate a unique ID
    };

    // Update the meal logs array
    const updatedData = {};
    updatedData.mealLogs = [...(userDoc.exists() ? (userDoc.data().mealLogs || []) : []), logEntry];
    
    await setDoc(userDocRef, updatedData, { merge: true });
    
    console.log(`Meal log stored for user: ${userEmail}`);
    return logEntry.id;
  } catch (error) {
    console.error("Error logging meal: ", error);
    throw error;
  }
};

/**
 * Get workout logs
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of workout log documents
 */
export const getWorkoutLogs = async (limitCount = 50) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const logs = userDoc.data().workoutLogs || [];
    
    // Sort by timestamp descending and limit results
    return logs
      .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : a.timestamp.toDate();
        const dateB = b.timestamp instanceof Date ? b.timestamp : b.timestamp.toDate();
        return dateB - dateA;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error getting workout logs: ", error);
    throw error;
  }
};

/**
 * Get meal logs
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of meal log documents
 */
export const getMealLogs = async (limitCount = 50) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const logs = userDoc.data().mealLogs || [];
    
    // Sort by timestamp descending and limit results
    return logs
      .sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : a.timestamp.toDate();
        const dateB = b.timestamp instanceof Date ? b.timestamp : b.timestamp.toDate();
        return dateB - dateA;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error getting meal logs: ", error);
    throw error;
  }
};

/**
 * Get counts of logs in Firestore
 * @returns {Promise<Object>} - Counts of different log types
 */
export const getLogCounts = async () => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return {
        totalLogs: 0,
        workoutCount: 0,
        mealCount: 0
      };
    }
    
    const userData = userDoc.data();
    const workoutCount = userData.workoutLogs?.length || 0;
    const mealCount = userData.mealLogs?.length || 0;
    
    return {
      totalLogs: workoutCount + mealCount,
      workoutCount,
      mealCount
    };
  } catch (error) {
    console.error("Error getting log counts: ", error);
    throw error;
  }
};

/**
 * Delete a workout log from Firestore
 * @param {string} logId - Document ID of the log to delete
 * @returns {Promise<void>}
 */
export const deleteWorkoutLog = async (logId) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }
    
    const userData = userDoc.data();
    const workoutLogs = userData.workoutLogs || [];
    
    // Filter out the log to delete
    const updatedLogs = workoutLogs.filter(log => log.id !== logId);
    
    // Update the user document with the filtered logs
    await setDoc(userDocRef, { workoutLogs: updatedLogs }, { merge: true });
    
    console.log("Workout log deleted successfully");
  } catch (error) {
    console.error("Error deleting workout log: ", error);
    throw error;
  }
};

/**
 * Delete a meal log from Firestore
 * @param {string} logId - Document ID of the log to delete
 * @returns {Promise<void>}
 */
export const deleteMealLog = async (logId) => {
  try {
    const user = getAuthenticatedUser();
    const userEmail = user.email;
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }
    
    const userData = userDoc.data();
    const mealLogs = userData.mealLogs || [];
    
    // Filter out the log to delete
    const updatedLogs = mealLogs.filter(log => log.id !== logId);
    
    // Update the user document with the filtered logs
    await setDoc(userDocRef, { mealLogs: updatedLogs }, { merge: true });
    
    console.log("Meal log deleted successfully");
  } catch (error) {
    console.error("Error deleting meal log: ", error);
    throw error;
  }
};

export default {
  logWorkout,
  logMeal,
  getWorkoutLogs,
  getMealLogs,
  getLogCounts,
  deleteWorkoutLog,
  deleteMealLog
}; 