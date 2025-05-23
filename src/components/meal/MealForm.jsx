import { useState } from 'react'
import '../../styles/Forms.css'
import { logMeal } from '../../services/logService'

const MealForm = () => {
  const [mealType, setMealType] = useState('breakfast')
  const [foodItems, setFoodItems] = useState('')
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
      const mealData = {
        mealType,
        foodItems: foodItems.split(',').map(item => item.trim()).filter(item => item),
        timestamp: new Date(date),
        source: 'web'
      }
      
      // Store in Firestore
      await logMeal(mealData)
      
      console.log('Meal logged successfully')
      setSuccess(true)
      
      // Reset form
      setFoodItems('')
    } catch (error) {
      setError('Failed to log meal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>Log Your Meal</h2>
      
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Meal logged successfully!</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Meal Type</label>
          <select 
            value={mealType} 
            onChange={(e) => setMealType(e.target.value)}
            required
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Food Items</label>
          <textarea 
            value={foodItems} 
            onChange={(e) => setFoodItems(e.target.value)}
            placeholder="Enter food items separated by commas (e.g., Eggs, Toast, Orange Juice)"
            required
          />
          <small>Separate multiple items with commas</small>
        </div>
        
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
          {loading ? 'Logging...' : 'Log Meal'}
        </button>
      </form>
    </div>
  )
}

export default MealForm 