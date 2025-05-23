import React, { useState, useEffect } from 'react';
import '../styles/LogExample.css';
import axios from 'axios';

const LogExample = () => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [mealLogs, setMealLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Stats for visualization
  const [stats, setStats] = useState({
    totalLogs: 0,
    workouts: 0,
    meals: 0,
    workoutsByDay: {},
    mealsByType: {}
  });

  useEffect(() => {
    fetchLogs();
    
    // Set interval to update logs every 30 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch workout logs
      const workoutResponse = await axios.get('http://localhost:5000/api/workout-logs');
      setWorkoutLogs(workoutResponse.data.logs || []);
      
      // Fetch meal logs
      const mealResponse = await axios.get('http://localhost:5000/api/meal-logs');
      setMealLogs(mealResponse.data.logs || []);
      
      // Update statistics
      updateStatistics(workoutResponse.data.logs || [], mealResponse.data.logs || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logs:', err);
      
      setLoading(false);
    }
  };

  const updateStatistics = (workoutData, mealData) => {
    // Count types
    const workoutCount = workoutData.length;
    const mealCount = mealData.length;
    
    // For workout daily stats
    const workoutsByDay = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    };
    
    // For meal type stats
    const mealsByType = {
      'breakfast': 0,
      'lunch': 0,
      'dinner': 0,
      'snack': 0
    };
    
    // Process workout logs
    workoutData.forEach(log => {
      // Get day of week for the workout
      const date = new Date(log.timestamp);
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      workoutsByDay[dayOfWeek]++;
    });
    
    // Process meal logs
    mealData.forEach(log => {
      // Count by meal type
      if (log.meal_type) {
        const mealType = log.meal_type.toLowerCase();
        if (mealsByType.hasOwnProperty(mealType)) {
          mealsByType[mealType]++;
        }
      }
    });
    
    setStats({
      totalLogs: workoutCount + mealCount,
      workouts: workoutCount,
      meals: mealCount,
      workoutsByDay,
      mealsByType
    });
  };
  
  const renderWorkoutChart = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const maxValue = Math.max(...Object.values(stats.workoutsByDay), 1);
    
    return (
      <div className="chart-container">
        <h4>Workouts Over Last 7 Days</h4>
        <div className="bar-chart">
          {days.map(day => (
            <div key={day} className="bar-column">
              <div 
                className="bar" 
                style={{ 
                  height: `${(stats.workoutsByDay[day] / maxValue) * 100}%`,
                  backgroundColor: day === 'Saturday' || day === 'Sunday' ? 'var(--accent)' : 'var(--primary)'
                }}
              >
                <span className="bar-value">{stats.workoutsByDay[day]}</span>
              </div>
              <span className="bar-label">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderMealChart = () => {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const maxValue = Math.max(...Object.values(stats.mealsByType), 1);
    
    // Colors for meal types
    const mealColors = {
      'breakfast': 'var(--primary-light)',
      'lunch': 'var(--primary)',
      'dinner': 'var(--accent)',
      'snack': 'var(--success)'
    };
    
    return (
      <div className="chart-container">
        <h4>Meals by Type</h4>
        <div className="horizontal-bar-chart">
          {mealTypes.map(type => (
            <div key={type} className="horizontal-bar-row">
              <div className="horizontal-bar-label">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              <div className="horizontal-bar-container">
                <div 
                  className="horizontal-bar" 
                  style={{ 
                    width: `${(stats.mealsByType[type] / maxValue) * 100}%`,
                    backgroundColor: mealColors[type]
                  }}
                >
                  <span className="horizontal-bar-value">{stats.mealsByType[type]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Capitalize first letter of string
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get all logs combined and sorted by date
  const getAllLogs = () => {
    const workouts = workoutLogs.map(log => ({
      ...log,
      type: 'workout',
      display_date: formatDate(log.timestamp)
    }));
    
    const meals = mealLogs.map(log => ({
      ...log,
      type: 'meal',
      display_date: formatDate(log.timestamp)
    }));
    
    // Combine and sort by timestamp (newest first)
    const combined = [...workouts, ...meals].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return combined;
  };

  return (
    <div className="log-example">
      <h2>Activity Dashboard</h2>
      
      {/* Stats Section */}
      <div className="stats-section">
        <h3>Activity Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalLogs}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.workouts}</div>
            <div className="stat-label">Workouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.meals}</div>
            <div className="stat-label">Meals</div>
          </div>
        </div>
      </div>
      
      {/* Data Visualization */}
      <div className="charts-container">
        {renderWorkoutChart()}
        {renderMealChart()}
      </div>

      {error && <div className="error">{error}</div>}
      
      {/* Logs Section */}
      <div className="logs-section">
        <h3>Activity Logs</h3>
        
        <div className="tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Logs
          </button>
          <button 
            className={activeTab === 'workouts' ? 'active' : ''} 
            onClick={() => setActiveTab('workouts')}
          >
            Workouts
          </button>
          <button 
            className={activeTab === 'meals' ? 'active' : ''} 
            onClick={() => setActiveTab('meals')}
          >
            Meals
          </button>
        </div>
        
        {loading ? (
          <div className="loading">Loading activity logs...</div>
        ) : (
          <div className="logs-container">
            {activeTab === 'all' && (
              <div className="logs-list">
                {getAllLogs().map((log, index) => (
                  <div key={index} className="log-card">
                    <div className="log-header">
                      {log.type === 'workout' ? (
                        <span className="activity-name">{log.activity_name}</span>
                      ) : (
                        <span className="meal-type">{capitalize(log.meal_type || 'Meal')}</span>
                      )}
                      <span className="log-source">{log.source === 'alexa' ? '🔊 Voice' : '💻 Web'}</span>
                    </div>
                    <div className="log-details">
                      {log.type === 'workout' ? (
                        <>
                          <p><strong>Type:</strong> {capitalize(log.workout_type || 'Exercise')}</p>
                          <p><strong>Duration:</strong> {log.duration} minutes</p>
                          {log.distance && <p><strong>Distance:</strong> {log.distance} km</p>}
                          {log.sets && <p><strong>Sets:</strong> {log.sets}</p>}
                          {log.reps && <p><strong>Reps:</strong> {log.reps}</p>}
                        </>
                      ) : (
                        <>
                          <p><strong>Food Items:</strong></p>
                          {log.food_items && log.food_items.length > 0 ? (
                            <ul className="food-items-list">
                              {log.food_items.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>No food items recorded</p>
                          )}
                        </>
                      )}
                      <p className="log-date">{log.display_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'workouts' && (
              <div className="logs-list">
                {workoutLogs.map((log, index) => (
                  <div key={index} className="log-card">
                    <div className="log-header">
                      <span className="activity-name">{log.activity_name}</span>
                      <span className="log-source">{log.source === 'alexa' ? '🔊 Voice' : '💻 Web'}</span>
                    </div>
                    <div className="log-details">
                      <p><strong>Type:</strong> {capitalize(log.workout_type || 'Exercise')}</p>
                      <p><strong>Duration:</strong> {log.duration} minutes</p>
                      {log.distance && <p><strong>Distance:</strong> {log.distance} km</p>}
                      {log.sets && <p><strong>Sets:</strong> {log.sets}</p>}
                      {log.reps && <p><strong>Reps:</strong> {log.reps}</p>}
                      <p className="log-date">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'meals' && (
              <div className="logs-list">
                {mealLogs.map((log, index) => (
                  <div key={index} className="log-card">
                    <div className="log-header">
                      <span className="meal-type">{capitalize(log.meal_type || 'Meal')}</span>
                      <span className="log-source">{log.source === 'alexa' ? '🔊 Voice' : '💻 Web'}</span>
                    </div>
                    <div className="log-details">
                      <p><strong>Food Items:</strong></p>
                      {log.food_items && log.food_items.length > 0 ? (
                        <ul className="food-items-list">
                          {log.food_items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No food items recorded</p>
                      )}
                      <p className="log-date">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogExample; 