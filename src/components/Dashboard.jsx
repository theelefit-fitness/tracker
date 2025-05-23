import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import WorkoutForm from './workout/WorkoutForm'
import MealForm from './meal/MealForm'
import ProgressView from './ProgressView'
import EnhancedOverview from './EnhancedOverview'
import { useAuth } from './AuthProvider'
import { getWorkoutLogs, getMealLogs, logOut } from '../services/firebase'
import { db, auth } from '../services/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import '../styles/Dashboard.css'

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('stats')
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [mealLogs, setMealLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user } = useAuth()
  
  // Set up global refresh functions for child components
  useEffect(() => {
    window.refreshWorkoutLogs = () => {
      console.log('Refreshing workout logs from global handler');
      getWorkoutLogs().then(logs => setWorkoutLogs(logs));
    };
    
    window.refreshMealLogs = () => {
      console.log('Refreshing meal logs from global handler');
      getMealLogs().then(logs => setMealLogs(logs));
    };
    
    return () => {
      // Clean up global functions when component unmounts
      delete window.refreshWorkoutLogs;
      delete window.refreshMealLogs;
    };
  }, []);
  
  // Set up real-time data subscription with Firestore
  useEffect(() => {
    if (user && user.email) {
      setLogsLoading(true);
      
      const userEmail = user.email;
      const userDocRef = doc(db, "users", userEmail);
      
      // Create a real-time listener for the user document
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Process workout logs
          if (data.workoutLogs) {
            const sortedWorkoutLogs = [...data.workoutLogs].sort((a, b) => {
              // Safely handle different timestamp formats
              const getTimestamp = (timestamp) => {
                if (!timestamp) return new Date(0);
                if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                  return timestamp.toDate();
                }
                if (timestamp instanceof Date) {
                  return timestamp;
                }
                return new Date(timestamp);
              };
              
              const dateA = getTimestamp(a.timestamp);
              const dateB = getTimestamp(b.timestamp);
              return dateB - dateA;
            });
            setWorkoutLogs(sortedWorkoutLogs);
          }
          
          // Process meal logs
          if (data.mealLogs) {
            const sortedMealLogs = [...data.mealLogs].sort((a, b) => {
              // Safely handle different timestamp formats
              const getTimestamp = (timestamp) => {
                if (!timestamp) return new Date(0);
                if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                  return timestamp.toDate();
                }
                if (timestamp instanceof Date) {
                  return timestamp;
                }
                return new Date(timestamp);
              };
              
              const dateA = getTimestamp(a.timestamp);
              const dateB = getTimestamp(b.timestamp);
              return dateB - dateA;
            });
            setMealLogs(sortedMealLogs);
          }
        } else {
          // Reset logs if user document doesn't exist
          setWorkoutLogs([]);
          setMealLogs([]);
        }
        
        setLogsLoading(false);
      }, (error) => {
        console.error("Error getting real-time updates:", error);
        setLogsLoading(false);
      });
      
      // Clean up the subscription when component unmounts or user changes
      return () => unsubscribe();
    } else {
      setWorkoutLogs([]);
      setMealLogs([]);
      setLogsLoading(false);
    }
  }, [user]);
  
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logOut()
      // Reset logs on logout
      setWorkoutLogs([])
      setMealLogs([])
      // Redirect will be handled by AuthProvider
    } catch (error) {
      console.error('Error logging out:', error)
      setLoggingOut(false)
    }
  }

  const refreshAllLogs = () => {
    setLogsLoading(true);
    Promise.all([
      getWorkoutLogs(),
      getMealLogs()
    ]).then(([workouts, meals]) => {
      setWorkoutLogs(workouts);
      setMealLogs(meals);
      setLogsLoading(false);
    }).catch(error => {
      console.error('Error refreshing logs:', error);
      setLogsLoading(false);
    });
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        
        
        <div className="dashboard-actions">
        
         
          <button 
            className="logout-button" 
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
      
      <div className="dashboard-nav">
        <button 
          className={activeSection === 'stats' ? 'active' : ''} 
          onClick={() => setActiveSection('stats')}
        >
          Overview
        </button>
        <button 
          className={activeSection === 'workout' ? 'active' : ''} 
          onClick={() => setActiveSection('workout')}
        >
          Log Workout
        </button>
        <button 
          className={activeSection === 'meal' ? 'active' : ''} 
          onClick={() => setActiveSection('meal')}
        >
          Log Meal
        </button>
        
      </div>
      
      <div className="dashboard-content">
        {activeSection === 'stats' && (
          <EnhancedOverview 
            workoutLogs={workoutLogs} 
            mealLogs={mealLogs} 
            isLoading={logsLoading} 
          />
        )}
        {activeSection === 'workout' && (
          <WorkoutForm onWorkoutLogged={() => {
            // Refresh workout logs after new entry
            getWorkoutLogs().then(logs => setWorkoutLogs(logs));
          }} />
        )}
        {activeSection === 'meal' && (
          <MealForm onMealLogged={() => {
            // Refresh meal logs after new entry
            getMealLogs().then(logs => setMealLogs(logs));
          }} />
        )}
        {activeSection === 'progress' && (
          <ProgressView 
            workoutLogs={workoutLogs} 
            mealLogs={mealLogs} 
            isLoading={logsLoading} 
          />
        )}
      </div>
      
     
    </div>
  )
}

export default Dashboard 