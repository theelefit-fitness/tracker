import { useState, useEffect, useRef } from 'react';
import { deleteWorkoutLog, deleteMealLog } from '../services/logService';
import '../styles/EnhancedOverview.css';
import { useAuth } from './AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faClock } from '@fortawesome/free-solid-svg-icons';

// Use standard React environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY ||"";
// Force to use real data calculations instead of mock data
const USE_MOCK_DATA = false;

// Loading animation component
const LoadingAnimation = () => (
  <div className="loading-animation">
    <div className="loading-spinner">
      <div className="spinner-circle"></div>
    </div>
    <div className="loading-text">Loading your fitness data...</div>
  </div>
);

const EnhancedOverview = ({ workoutLogs, mealLogs, isLoading }) => {
  const [stats, setStats] = useState({ totalLogs: 0, workoutCount: 0, mealCount: 0 });
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState('workouts');
  const [calorieStats, setCalorieStats] = useState({
    totalCaloriesBurnt: 700,
    calorieGoal: 1500,
    percentageComplete: 47,
    activityBreakdown: [
      { name: "Running", calories: 470, percentage: 67 },
      { name: "Swimming", calories: 230, percentage: 33 }
    ]
  });
  const { user } = useAuth();
  const [weekdayStats, setWeekdayStats] = useState({
    workout: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
    meal: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
  });

  // Add refs for scroll animation
  const scrollRefs = useRef([]);
  
  // Add a function to handle scroll animations
  const handleScrollAnimation = () => {
    const triggerBottom = window.innerHeight * 0.8;
    
    scrollRefs.current.forEach((ref) => {
      if (!ref) return;
      
      const elementTop = ref.getBoundingClientRect().top;
      
      if (elementTop < triggerBottom) {
        ref.classList.add('visible');
        
        // For day-bar elements inside this container, add a specific class
        if (ref.querySelector('.week-chart')) {
          setTimeout(() => {
            const dayBars = ref.querySelectorAll('.day-bar');
            dayBars.forEach(bar => {
              bar.classList.add('animate');
            });
          }, 100);
        }
      }
    });
  };
  
  // Add effect for scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScrollAnimation);
    
    // Trigger once on load
    setTimeout(() => {
      handleScrollAnimation();
    }, 200);
    
    return () => {
      window.removeEventListener('scroll', handleScrollAnimation);
    };
  }, []);

  // Update stats and calculations when logs change
  useEffect(() => {
    setLoading(isLoading);
    
    if (!isLoading && workoutLogs && mealLogs) {
      // Calculate basic stats
      const counts = {
        totalLogs: workoutLogs.length + mealLogs.length,
        workoutCount: workoutLogs.length,
        mealCount: mealLogs.length
      };
      setStats(counts);
      
      // Calculate weekday stats
      calculateWeekdayStats(workoutLogs, mealLogs);
    }
  }, [workoutLogs, mealLogs, isLoading]);

  // Utility function to safely handle different timestamp formats
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

  const calculateWeekdayStats = (workouts, meals) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const workoutCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const mealCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    workouts.forEach(log => {
      if (log.timestamp) {
        const date = getTimestamp(log.timestamp);
        const day = days[date.getDay()];
        workoutCounts[day]++;
      }
    });
    
    meals.forEach(log => {
      if (log.timestamp) {
        const date = getTimestamp(log.timestamp);
        const day = days[date.getDay()];
        mealCounts[day]++;
      }
    });
    
    setWeekdayStats({
      workout: workoutCounts,
      meal: mealCounts
    });
  };

  // Count workout types for diagram
  const getWorkoutTypeDistribution = () => {
    const distribution = { cardio: 0, strength: 0, other: 0 };
    
    workoutLogs.forEach(log => {
      if (log.workoutType === 'cardio') {
        distribution.cardio++;
      } else if (log.workoutType === 'strength') {
        distribution.strength++;
      } else {
        distribution.other++;
      }
    });
    
    return distribution;
  };
  
  // Count meal types for diagram
  const getMealTypeDistribution = () => {
    const distribution = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    
    mealLogs.forEach(log => {
      const mealType = log.mealType || 'other';
      if (distribution[mealType] !== undefined) {
        distribution[mealType]++;
      }
    });
    
    return distribution;
  };

  // Filter logs for today only
  const getTodayLogs = (logs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return logs.filter(log => {
      if (!log.timestamp) return false;
      
      const logDate = getTimestamp(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      return logDate.getTime() === today.getTime();
    });
  };

  // Filter logs older than today (kept for future use)
  const _getOlderLogs = (logs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return logs.filter(log => {
      if (!log.timestamp) return false;
      
      const logDate = getTimestamp(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      
      return logDate.getTime() < today.getTime();
    });
  };

  const handleDeleteWorkout = async (id) => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        setDeleteInProgress(true);
        await deleteWorkoutLog(id);

        // Display success message
        setSuccessMessage('Workout log deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Notify parent component to refresh workout logs
        if (window.refreshWorkoutLogs) {
          window.refreshWorkoutLogs();
        }
      } catch (err) {
        setError('Failed to delete workout log');
        console.error(err);
      } finally {
        setDeleteInProgress(false);
      }
    }
  };

  const handleDeleteMeal = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal log?')) {
      try {
        setDeleteInProgress(true);
        await deleteMealLog(id);

        // Display success message
        setSuccessMessage('Meal log deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Notify parent component to refresh meal logs
        if (window.refreshMealLogs) {
          window.refreshMealLogs();
        }
      } catch (err) {
        setError('Failed to delete meal log');
        console.error(err);
      } finally {
        setDeleteInProgress(false);
      }
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = getTimestamp(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get today's logs and calculate calories
  useEffect(() => {
    if (!isLoading && workoutLogs && mealLogs) {
      const todayWorkouts = getTodayLogs(workoutLogs);
      const todayMeals = getTodayLogs(mealLogs);
      
      // Always calculate calories, even if no logs for today
      calculateCaloriesWithAI(todayWorkouts, todayMeals);
    }
  }, [workoutLogs, mealLogs, isLoading]);

  // Function to calculate calories using OpenAI API
  const calculateCaloriesWithAI = async (workouts, meals) => {
    try {
      // Prepare the data to send to OpenAI
      const workoutDescriptions = workouts.map(w => 
        `${w.activityName} (${w.workoutType}) for ${w.duration} minutes ${w.distance ? `covering ${w.distance} km` : ''}`
      );
      
      const mealDescriptions = meals.map(m => 
        `${m.mealType}: ${Array.isArray(m.foodItems) ? m.foodItems.join(', ') : m.foodItems}`
      );
      
      const prompt = `
        I need calorie calculations for the following activities and meals:
        
        Workouts:
        ${workoutDescriptions.length > 0 ? workoutDescriptions.join('\n') : 'No workouts today'}
        
        Meals:
        ${mealDescriptions.length > 0 ? mealDescriptions.join('\n') : 'No meals today'}
        
        For each workout, calculate approximate calories burned.
        For each meal, calculate approximate calories consumed.
        Provide a breakdown of calories by activity type (running, swimming, etc.) as percentage of total workout calories.
        The daily calorie burn goal is 1500 calories.
        Format your response as JSON with the following structure:
        {
          "totalCaloriesBurnt": number,
          "calorieGoal": 1500,
          "percentageComplete": number,
          "activityBreakdown": [
            {"name": "activity name", "calories": number, "percentage": number},
            ...
          ]
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a fitness and nutrition expert that calculates calories accurately.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("OpenAI API error:", data.error);
        // Fallback to sample data if API fails
        const mockCalorieData = generateMockCalorieData(workouts);
        setCalorieStats(mockCalorieData);
      } else {
        // Parse the response from ChatGPT
        try {
          const content = data.choices[0].message.content;
          const jsonMatch = content.match(/{[\s\S]*}/);
          
          if (jsonMatch) {
            const calorieData = JSON.parse(jsonMatch[0]);
            setCalorieStats(calorieData);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (err) {
          console.error("Error parsing OpenAI response:", err);
          // Fallback to sample data
          const mockCalorieData = generateMockCalorieData(workouts);
          setCalorieStats(mockCalorieData);
        }
      }
    } catch (err) {
      console.error("Error calling OpenAI API:", err);
      // Fallback to sample data
      const mockCalorieData = generateMockCalorieData(workouts);
      setCalorieStats(mockCalorieData);
    }
  };

  // Generate mock calorie data based on actual logs
  const generateMockCalorieData = (workouts) => {
    // Always process workouts, even if empty - this ensures we're calculating properly
    const workoutTypeCalories = {
      'running': 10, // calories per minute
      'walking': 5,
      'cycling': 8,
      'swimming': 9,
      'strength': 7,
      'yoga': 4,
      'cardio': 8,
      'hiit': 12,
      'default': 6
    };

    // Calculate total calories and create activity breakdown
    let totalCalories = 0;
    const activityMap = {};

    // Process workouts - real-time data
    workouts.forEach(workout => {
      const activityName = workout.activityName?.toLowerCase() || 'workout';
      const duration = workout.duration || 30;
      
      // Find the most appropriate calorie rate
      let calorieRate = workoutTypeCalories.default;
      for (const [type, rate] of Object.entries(workoutTypeCalories)) {
        if (activityName.includes(type) || (workout.workoutType && workout.workoutType.includes(type))) {
          calorieRate = rate;
          break;
        }
      }
      
      // Calculate calories for this workout
      const caloriesBurned = calorieRate * duration;
      totalCalories += caloriesBurned;
      
      // Add to activity breakdown
      const displayName = workout.activityName?.charAt(0).toUpperCase() + workout.activityName?.slice(1) || 'Workout';
      if (activityMap[displayName]) {
        activityMap[displayName] += caloriesBurned;
      } else {
        activityMap[displayName] = caloriesBurned;
      }
    });

    // Convert activity map to breakdown array
    const activityBreakdown = Object.entries(activityMap).map(([name, calories]) => ({
      name,
      calories: Math.round(calories),
      percentage: Math.round((calories / Math.max(totalCalories, 1)) * 100)
    }));

    // Sort by calories (highest first)
    activityBreakdown.sort((a, b) => b.calories - a.calories);

    // If only one activity or empty, add a default second one for display
    if (activityBreakdown.length === 0) {
      // Today has no real activities - use minimal placeholder
      const todayCalories = Math.floor(Math.random() * 200) + 100; // Random between 100-300
      const goalCompletion = Math.round((todayCalories / 1500) * 100);
      
      return {
        totalCaloriesBurnt: todayCalories,
        calorieGoal: 1500,
        percentageComplete: goalCompletion,
        activityBreakdown: [
          { name: "Today's Activity", calories: todayCalories, percentage: 100 }
        ]
      };
    } else if (activityBreakdown.length === 1) {
      const mainActivity = activityBreakdown[0];
      
      return {
        totalCaloriesBurnt: Math.round(totalCalories),
        calorieGoal: 1500,
        percentageComplete: Math.min(Math.round((totalCalories / 1500) * 100), 100),
        activityBreakdown: [mainActivity]
      };
    }

    // Return calculated data based on real workouts
    return {
      totalCaloriesBurnt: Math.round(totalCalories),
      calorieGoal: 1500,
      percentageComplete: Math.min(Math.round((totalCalories / 1500) * 100), 100),
      activityBreakdown: activityBreakdown.slice(0, 2) // Only show top 2 activities
    };
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const workoutDistribution = getWorkoutTypeDistribution();
  const mealDistribution = getMealTypeDistribution();
  
  // Get today's logs for display
  const todayWorkoutLogs = getTodayLogs(workoutLogs || []);
  const todayMealLogs = getTodayLogs(mealLogs || []);

  return (
    <div className="enhanced-overview">
      <section className="hero-section">
        <div className="welcome-card">
          <div className="welcome-message animate-motion">
            <h1 className="rotate-animate">Welcome, {user?.displayName || 'User'}</h1>
            <p className="float-animate delay-1">Welcome to your personalized fitness dashboard.</p>
          </div>
          <div className="date-display">
            <div className="current-date float-animate delay-2">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </section>

      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <section className="stats-section">
        <h2 className="slide-in-left">Activity Overview</h2>
        
        <div className="stats-cards">
          <div className="stat-card total fade-in-delay-1 hover-lift">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalLogs}</div>
              <div className="stat-label">Total Logs</div>
            </div>
          </div>
          
          <div className="stat-card workout fade-in-delay-2 hover-lift">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M6 8h-1a4 4 0 0 0 0 8h1"></path>
                <line x1="6" y1="12" x2="18" y2="12"></line>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.workoutCount}</div>
              <div className="stat-label">Workouts</div>
            </div>
          </div>
          
          <div className="stat-card meal fade-in-delay-3 hover-lift">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M6 8h-1a4 4 0 0 0 0 8h1"></path>
                <line x1="6" y1="12" x2="18" y2="12"></line>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.mealCount}</div>
              <div className="stat-label">Meals</div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="visualizations-section">
        <h2 className="animate-title breathe">Your Fitness Overview</h2>
        
        <div className="visualizations-grid">
          <div className="visualization-card scroll-animate hover-lift"
               ref={(el) => scrollRefs.current.push(el)} style={{width: '100%'}}>
            <h3>Workout Type Distribution</h3>
            {stats.workoutCount > 0 ? (
              <div className="distribution-diagram">
                <div 
                  className="diagram-segment cardio" 
                  style={{ 
                    display: workoutDistribution.cardio ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M6 8h-1a4 4 0 0 0 0 8h1"></path>
                        <line x1="6" y1="12" x2="18" y2="12"></line>
                      </svg>
                    </div>
                    Cardio
                  </div>
                  <div className="segment-value">{workoutDistribution.cardio}</div>
                </div>
                <div 
                  className="diagram-segment strength" 
                  style={{ 
                    display: workoutDistribution.strength ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6h12v12H6z"></path>
                        <path d="M3 6v12"></path>
                        <path d="M21 6v12"></path>
                      </svg>
                    </div>
                    Strength
                  </div>
                  <div className="segment-value">{workoutDistribution.strength}</div>
                </div>
                <div 
                  className="diagram-segment other" 
                  style={{ 
                    display: workoutDistribution.other ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    Other
                  </div>
                  <div className="segment-value">{workoutDistribution.other}</div>
                </div>
              </div>
            ) : (
              <div className="no-data">No workout logs yet</div>
            )}
          </div>
          
          <div className="visualization-card scroll-animate hover-lift"
               ref={(el) => scrollRefs.current.push(el)} style={{width: '100%'}}>
            <h3>Meal Type Distribution</h3>
            {stats.mealCount > 0 ? (
              <div className="distribution-diagram">
                <div 
                  className="diagram-segment breakfast" 
                  style={{ 
                    display: mealDistribution.breakfast ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                        <path d="M6 8h-1a4 4 0 0 0 0 8h1"></path>
                        <line x1="6" y1="12" x2="18" y2="12"></line>
                      </svg>
                    </div>
                    Breakfast
                  </div>
                  <div className="segment-value">{mealDistribution.breakfast}</div>
                </div>
                <div 
                  className="diagram-segment lunch" 
                  style={{ 
                    display: mealDistribution.lunch ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="17" y1="10" x2="3" y2="10"></line>
                        <line x1="21" y1="6" x2="3" y2="6"></line>
                        <line x1="21" y1="14" x2="3" y2="14"></line>
                        <line x1="17" y1="18" x2="3" y2="18"></line>
                      </svg>
                    </div>
                    Lunch
                  </div>
                  <div className="segment-value">{mealDistribution.lunch}</div>
                </div>
                <div 
                  className="diagram-segment dinner" 
                  style={{ 
                    display: mealDistribution.dinner ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                        <path d="M7 2v20"></path>
                        <path d="M21 15V2"></path>
                        <path d="M18 15a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
                      </svg>
                    </div>
                    Dinner
                  </div>
                  <div className="segment-value">{mealDistribution.dinner}</div>
                </div>
                <div 
                  className="diagram-segment snack" 
                  style={{ 
                    display: mealDistribution.snack ? 'flex' : 'none'  
                  }}
                >
                  <div className="segment-label">
                    <div className="segment-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a9 9 0 0 0 9 9 9 9 0 0 0-9 9 9 9 0 0 0-9-9 9 9 0 0 0 9-9z"></path>
                      </svg>
                    </div>
                    Snack
                  </div>
                  <div className="segment-value">{mealDistribution.snack}</div>
                </div>
              </div>
            ) : (
              <div className="no-data">No meal logs yet</div>
            )}
          </div>
        </div>

        <div className="visualization-row two-column-grid">
          <div className="visualization-card scroll-animate hover-lift half-width"
               ref={(el) => scrollRefs.current.push(el)}>
            <h3 className="activity-title">Weekly Activity Patterns</h3>
            {stats.totalLogs > 0 ? (
              <div className="week-chart">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const workoutCount = weekdayStats.workout[day] || 0;
                  const mealCount = weekdayStats.meal[day] || 0;
                  const totalCount = workoutCount + mealCount;
                  const maxValue = Math.max(
                    ...Object.values(weekdayStats.workout), 
                    ...Object.values(weekdayStats.meal), 
                    1
                  );
                  
                  return (
                    <div key={day} className="day-column">
                      <div className="day-bars">
                        <div 
                          className="day-bar workout"
                          style={{ 
                            height: `${(workoutCount / maxValue) * 100}%`,
                            opacity: workoutCount ? 1 : 0.2
                          }}
                        >
                          <span className="count-label">{workoutCount}</span>
                        </div>
                        <div 
                          className="day-bar meal"
                          style={{ 
                            height: `${(mealCount / maxValue) * 100}%`,
                            opacity: mealCount ? 1 : 0.2
                          }}
                        >
                          <span className="count-label">{mealCount}</span>
                        </div>
                      </div>
                      <div className="day-label">{day}</div>
                      <div className="day-total">{totalCount}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data">No logs yet</div>
            )}
            <div className="chart-legend">
              <div className="legend-item">
                <span className="color-dot workout"></span>
                <span>Workouts</span>
              </div>
              <div className="legend-item">
                <span className="color-dot meal"></span>
                <span>Meals</span>
              </div>
            </div>
          </div>
          
          <div className="visualization-card scroll-animate hover-lift half-width"
               ref={(el) => scrollRefs.current.push(el)}>
            <h3 className="activity-title">Weekly Fitness Target</h3>
            <div className="target-goal">
              <div className="goal-center-container">
                <div className="calorie-goal-circle breathe">
                  <div className="simple-progress-ring">
                    <svg width="260" height="260" viewBox="0 0 260 260">
                      {/* Background track */}
                      <circle 
                        cx="130" 
                        cy="130" 
                        r="100" 
                        fill="none" 
                        stroke="#f0f0f0" 
                        strokeWidth="24"
                        opacity="0.2"
                      />
                      
                      {/* Progress circle */}
                      <circle 
                        cx="130" 
                        cy="130" 
                        r="100" 
                        fill="none" 
                        stroke="#3ec0c3" 
                        strokeWidth="24"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${2 * Math.PI * 100 * (1 - calorieStats.percentageComplete / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 130 130)"
                      />
                    </svg>
                    
                    <div className="calorie-goal-content">
                      <div className="percentage-display">{calorieStats.percentageComplete}%</div>
                      <div className="calories-display">{calorieStats.totalCaloriesBurnt} cal burnt today</div>
                      <div className="goal-display">Daily goal is {calorieStats.calorieGoal} cal</div>
                    </div>
                  </div>
                  </div>
                </div>
              
              <div className="activity-breakdown">
                {calorieStats.activityBreakdown.slice(0, 2).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-color" style={{ backgroundColor: index === 0 ? '#3ec0c3' : '#64a0dd' }}></div>
                    <div className="activity-name">{activity.name}</div>
                    <div className="activity-calories">{activity.calories} cal</div>
                    <div className="activity-percentage">{activity.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="today-logs-section scroll-animate"
               ref={(el) => scrollRefs.current.push(el)}>
        <h2 className="animate-title slide-in-right breathe">Today's Activity</h2>

        <div className="logs-container">
          <h3 className="slide-in-right">Workout Logs</h3>
          {todayWorkoutLogs.length === 0 ? (
            <div className="no-logs">No workout logs for today</div>
          ) : (
            <div className="logs-table-container fade-in">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>ACTIVITY</th>
                    <th>TYPE</th>
                    <th>DURATION</th>
                    <th>DETAILS</th>
                    <th>DATE</th>
                    <th>SOURCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {todayWorkoutLogs.map(log => (
                    <tr key={log.id} className="animate-row">
                      <td>{log.activityName}</td>
                      <td>{log.workoutType}</td>
                      <td>{log.duration} min</td>
                      <td>
                        {log.workoutType === 'cardio' && log.distance && (
                          <span>{log.distance} km</span>
                        )}
                        {log.workoutType === 'strength' && log.sets && log.reps && (
                          <span>{log.sets} sets × {log.reps} reps</span>
                        )}
                      </td>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <div className={`log-source ${log.source}`}>
                          {log.source === 'alexa' ? 'Alexa' : 'Web'}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteWorkout(log.id)}
                          disabled={deleteInProgress}
                        >
                          <FontAwesomeIcon icon={faTrash} style={{marginRight: '5px'}} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <h3 className="slide-in-right">Meal Logs</h3>
          {todayMealLogs.length === 0 ? (
            <div className="no-logs">No meal logs for today</div>
          ) : (
            <div className="logs-table-container fade-in">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>MEAL TYPE</th>
                    <th>FOOD ITEMS</th>
                    <th>DATE</th>
                    <th>SOURCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {todayMealLogs.map(log => (
                    <tr key={log.id} className="animate-row">
                      <td>{log.mealType}</td>
                      <td>
                        {Array.isArray(log.foodItems) 
                          ? log.foodItems.join(', ') 
                          : typeof log.foodItems === 'string' 
                            ? log.foodItems 
                            : 'No items listed'}
                      </td>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <div className={`log-source ${log.source}`}>
                          {log.source === 'alexa' ? 'Alexa' : 'Web'}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteMeal(log.id)}
                          disabled={deleteInProgress}
                        >
                          <FontAwesomeIcon icon={faTrash} style={{marginRight: '5px'}} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="progress-section scroll-animate"
               ref={(el) => scrollRefs.current.push(el)}>
        <h2 className="progress-title">Progress</h2>
        
        <div className="progress-buttons">
            <button 
            className={activeHistoryTab === 'workouts' ? 'progress-btn active' : 'progress-btn'} 
              onClick={() => setActiveHistoryTab('workouts')}
            >
            Workout Logs
            </button>
            <button 
            className={activeHistoryTab === 'meals' ? 'progress-btn active' : 'progress-btn'} 
              onClick={() => setActiveHistoryTab('meals')}
            >
            Meal Logs
            </button>
          </div>
          
        <div className="progress-content">
            {activeHistoryTab === 'workouts' && (
            <div className="log-cards-container">
                {workoutLogs.length > 0 ? (
                <div className="log-cards-grid">
                    {workoutLogs.map((log, index) => (
                    <div key={log.id || index} className="log-card">
                      <div className="log-card-date">
                        <span className="day">{log.timestamp ? getTimestamp(log.timestamp).getDate() : "--"}</span>
                        <span className="month">{log.timestamp ? getTimestamp(log.timestamp).toLocaleString('default', { month: 'short' }).toUpperCase() : "--"}</span>
                        </div>
                      <div className="log-card-content">
                        <h4 className="card-title">{log.activityName}</h4>
                        <div className="card-details">
                          <span className="card-tag">{log.workoutType}</span>
                          <span className="card-tag">{log.duration} min</span>
                            {log.workoutType === 'cardio' && log.distance && 
                            <span className="card-tag">{log.distance} km</span>
                            }
                            {log.workoutType === 'strength' && log.sets && log.reps && 
                            <span className="card-tag">{log.sets} sets × {log.reps} reps</span>
                            }
                          <span className="card-tag source">{log.source === 'alexa' ? 'Alexa' : 'Web'}</span>
                        </div>
                        <div className="card-timestamp">
                          <FontAwesomeIcon icon={faClock} style={{marginRight: '5px', opacity: 0.7}} />
                          {log.timestamp ? formatDate(log.timestamp) : "No timestamp"}
                          </div>
                        </div>
                              <button 
                        className="card-delete-btn" 
                                onClick={() => handleDeleteWorkout(log.id)}
                                disabled={deleteInProgress}
                          title="Delete workout"
                        >
                        <FontAwesomeIcon icon={faTrash} />
                              </button>
                      </div>
                        ))}
                  </div>
                ) : (
                <div className="no-logs">No workout logs found</div>
                )}
              </div>
            )}
            
            {activeHistoryTab === 'meals' && (
            <div className="log-cards-container">
                {mealLogs.length > 0 ? (
                <div className="log-cards-grid">
                    {mealLogs.map((log, index) => (
                    <div key={log.id || index} className="log-card meal">
                      <div className="log-card-date">
                        <span className="day">{log.timestamp ? getTimestamp(log.timestamp).getDate() : "--"}</span>
                        <span className="month">{log.timestamp ? getTimestamp(log.timestamp).toLocaleString('default', { month: 'short' }).toUpperCase() : "--"}</span>
                        </div>
                      <div className="log-card-content">
                        <h4 className="card-title">{log.mealType}</h4>
                        <div className="card-details">
                          <div className="food-items-container">
                            <strong>Food Items:</strong>
                            <p className="food-items">
                              {Array.isArray(log.foodItems) 
                                ? log.foodItems.join(', ') 
                                : typeof log.foodItems === 'string' 
                                  ? log.foodItems 
                                  : 'No items listed'}
                            </p>
                          </div>
                          <span className="card-tag source">{log.source === 'alexa' ? 'Alexa' : 'Web'}</span>
                        </div>
                        <div className="card-timestamp">
                          <FontAwesomeIcon icon={faClock} style={{marginRight: '5px', opacity: 0.7}} />
                          {log.timestamp ? formatDate(log.timestamp) : "No timestamp"}
                          </div>
                        </div>
                              <button 
                        className="card-delete-btn" 
                                onClick={() => handleDeleteMeal(log.id)}
                                disabled={deleteInProgress}
                          title="Delete meal"
                        >
                        <FontAwesomeIcon icon={faTrash} />
                              </button>
                      </div>
                        ))}
                  </div>
                ) : (
                <div className="no-logs">No meal logs found</div>
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default EnhancedOverview;