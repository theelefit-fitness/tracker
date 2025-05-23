import { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/ProgressView.css'

const ProgressView = () => {
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [mealLogs, setMealLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('workouts')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Fetch workout logs
        const workoutResponse = await axios.get('http://localhost:5000/api/workout-logs')
        setWorkoutLogs(workoutResponse.data.logs || [])
        
        // Fetch meal logs
        const mealResponse = await axios.get('http://localhost:5000/api/meal-logs')
        setMealLogs(mealResponse.data.logs || [])
        
      } catch (error) {
        setError('Failed to fetch logs: ' + error.message)
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [])
  
  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // Capitalize first letter of string
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="progress-view">
      <h2>Your Fitness Progress</h2>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="tabs">
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
        <div className="loading">Loading logs...</div>
      ) : (
        <div className="logs-container">
          {activeTab === 'workouts' && (
            <>
              <h3>Your Workout Logs</h3>
              {workoutLogs.length === 0 ? (
                <p className="no-logs">No workout logs found. Start by logging a workout!</p>
              ) : (
                <div className="logs-list">
                  {workoutLogs.map((log) => (
                    <div key={log.id} className="log-card">
                      <div className="log-header">
                        <span className="activity-name">{log.activity_name}</span>
                        <span className="log-source">{log.source === 'alexa' ? '🔊 Voice' : '💻 Web'}</span>
                      </div>
                      <div className="log-details">
                        <p><strong>Type:</strong> {capitalize(log.workout_type)}</p>
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
            </>
          )}
          
          {activeTab === 'meals' && (
            <>
              <h3>Your Meal Logs</h3>
              {mealLogs.length === 0 ? (
                <p className="no-logs">No meal logs found. Start by logging a meal!</p>
              ) : (
                <div className="logs-list">
                  {mealLogs.map((log) => (
                    <div key={log.id} className="log-card">
                      <div className="log-header">
                        <span className="meal-type">{capitalize(log.meal_type)}</span>
                        <span className="log-source">{log.source === 'alexa' ? '🔊 Voice' : '💻 Web'}</span>
                      </div>
                      <div className="log-details">
                        <p><strong>Food Items:</strong></p>
                        <ul className="food-items-list">
                          {log.food_items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                        <p className="log-date">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgressView 