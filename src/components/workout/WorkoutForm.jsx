import { useState } from 'react'
import '../../styles/Forms.css'
import { logWorkout } from '../../services/logService'

const WorkoutForm = () => {
  const [workoutType, setWorkoutType] = useState('cardio')
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const workoutData = {
        workoutType,
        activityName,
        duration: parseInt(duration),
        timestamp: new Date(date),
        source: 'web'
      }
      
      if (workoutType === 'cardio' && distance) {
        workoutData.distance = parseFloat(distance)
      } else if (workoutType === 'strength') {
        workoutData.sets = parseInt(sets)
        workoutData.reps = parseInt(reps)
      }
      
      // Store in Firestore
      await logWorkout(workoutData)
      
      console.log('Workout logged successfully')
      setSuccess(true)
      
      // Reset form
      setActivityName('')
      setDuration('')
      setDistance('')
      setSets('')
      setReps('')
    } catch (error) {
      setError('Failed to log workout: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>Log Your Workout</h2>
      
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Workout logged successfully!</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Workout Type</label>
          <select 
            value={workoutType} 
            onChange={(e) => setWorkoutType(e.target.value)}
            required
          >
            <option value="cardio">Cardio</option>
            <option value="strength">Strength Training</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Activity Name</label>
          <input 
            type="text" 
            value={activityName} 
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="e.g., Running, Squats"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Duration (minutes)</label>
          <input 
            type="number" 
            value={duration} 
            onChange={(e) => setDuration(e.target.value)}
            required
            min="1"
          />
        </div>
        
        {workoutType === 'cardio' && (
          <div className="form-group">
            <label>Distance (km)</label>
            <input 
              type="number" 
              step="0.01" 
              value={distance} 
              onChange={(e) => setDistance(e.target.value)}
              min="0"
            />
          </div>
        )}
        
        {workoutType === 'strength' && (
          <>
            <div className="form-group">
              <label>Sets</label>
              <input 
                type="number" 
                value={sets} 
                onChange={(e) => setSets(e.target.value)}
                required={workoutType === 'strength'}
                min="1"
              />
            </div>
            
            <div className="form-group">
              <label>Reps</label>
              <input 
                type="number" 
                value={reps} 
                onChange={(e) => setReps(e.target.value)}
                required={workoutType === 'strength'}
                min="1"
              />
            </div>
          </>
        )}
        
        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Logging...' : 'Log Workout'}
        </button>
      </form>
    </div>
  )
}

export default WorkoutForm 