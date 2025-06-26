'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '../../lib/session'
import { Users, Utensils, Package, Plus, Trash2, Edit, Check, ShoppingCart } from 'lucide-react'

interface Student {
  id: string
  rollNo: string
  hostel: string
  room: string
  phone: string
  user: {
    name: string
    email: string
  }
}

interface Grocery {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
}

interface UserSpending {
  studentId: string
  studentName: string
  rollNo: string
  monthlyMealSpent: number
  monthlyGrocerySpent: number
  monthlyTotalSpent: number
  allTimeMealSpent: number
  allTimeGrocerySpent: number
  allTimeTotalSpent: number
}

interface TodayMeals {
  breakfast: { studentId: string; marked: boolean }[]
  lunch: { studentId: string; marked: boolean }[]
  dinner: { studentId: string; marked: boolean }[]
}

export default function AdminDashboard() {
  const { user, logout, loading: sessionLoading } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('meals')
  const [students, setStudents] = useState<Student[]>([])
  const [groceries, setGroceries] = useState<Grocery[]>([])
  const [userSpending, setUserSpending] = useState<UserSpending[]>([])
  const [todayMeals, setTodayMeals] = useState<TodayMeals>({
    breakfast: [],
    lunch: [],
    dinner: []
  })
  const [loading, setLoading] = useState(true)

  // Form states
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddGrocery, setShowAddGrocery] = useState(false)
  const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null)
  
  // Daily tracking states
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [studentDailyData, setStudentDailyData] = useState<any>(null)
  const [loadingDailyData, setLoadingDailyData] = useState(false)

  useEffect(() => {
    if (sessionLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchData()
  }, [user, sessionLoading, router])

  const fetchData = async () => {
    try {
      const [studentsRes, groceriesRes, spendingRes, mealPlansRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/groceries'),
        fetch('/api/admin/user-spending'),
        fetch('/api/admin/meal-plan')
      ])

      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (groceriesRes.ok) setGroceries(await groceriesRes.json())
      if (spendingRes.ok) setUserSpending(await spendingRes.json())
      if (mealPlansRes.ok) {
        const mealPlansData = await mealPlansRes.json()
        setTodayMeals(mealPlansData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMeal = async (studentId: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER', marked: boolean) => {
    try {
      const response = await fetch('/api/admin/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, mealType, planned: marked })
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update meal plan')
      }
    } catch (error) {
      alert('Error updating meal plan')
    }
  }

  const deleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStudents(students.filter(s => s.id !== studentId))
        alert('Student deleted successfully!')
      } else {
        alert('Failed to delete student')
      }
    } catch (error) {
      alert('Error deleting student')
    }
  }

  const deleteGrocery = async (groceryId: string) => {
    if (!confirm('Are you sure you want to delete this grocery item?')) return

    try {
      const response = await fetch(`/api/admin/groceries/${groceryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGroceries(groceries.filter(g => g.id !== groceryId))
        alert('Grocery deleted successfully!')
      } else {
        alert('Failed to delete grocery')
      }
    } catch (error) {
      alert('Error deleting grocery')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isStudentMealMarked = (studentId: string, mealType: string) => {
    const mealKey = mealType.toLowerCase() as keyof TodayMeals
    return todayMeals[mealKey]?.some(m => m.studentId === studentId && m.marked) || false
  }

  const resetAllMeals = async () => {
    if (!confirm('Are you sure you want to reset all meal plans? This will clear today\'s meal planning but will NOT affect historical spending records.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/reset-meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        fetchData() // Refresh data
        alert(data.message || 'All meal plans reset successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to reset meal plans')
      }
    } catch (error) {
      alert('Error resetting meal plans')
    }
  }

  const confirmMeals = async () => {
    if (!confirm('Are you sure you want to confirm all meal plans? This will convert planned meals to actual consumption records and add them to student spending.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/confirm-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        fetchData() // Refresh data
        alert(data.message || 'All meals confirmed and added to spending!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to confirm meals')
      }
    } catch (error) {
      alert('Error confirming meals')
    }
  }

  const fetchStudentDailyData = async (studentId: string) => {
    if (!studentId) return

    setLoadingDailyData(true)
    try {
      const response = await fetch('/api/admin/student-daily-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })

      if (response.ok) {
        const data = await response.json()
        setStudentDailyData(data)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to fetch student data')
      }
    } catch (error) {
      alert('Error fetching student data')
    } finally {
      setLoadingDailyData(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-900 font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'meals', name: 'Meal Management', icon: Utensils },
              { id: 'groceries', name: 'Grocery Management', icon: Package },
              { id: 'purchases', name: 'Add User Purchases', icon: ShoppingCart },
              { id: 'spending', name: 'User Spending', icon: Users },
              { id: 'daily-tracking', name: 'Daily Tracking', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-500 hover:text-gray-700 bg-white border border-gray-200'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Meal Management Tab */}
        {activeTab === 'meals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Meal Management</h2>
              <div className="flex space-x-3">
                <button
                  onClick={confirmMeals}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <span>Confirm Meals & Add to Spending</span>
                </button>
                <button
                  onClick={resetAllMeals}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <span>Reset All Plans</span>
                </button>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No students found. Add some students to start managing meals.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Meal Planning</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    ✅ Check meals to plan for today → 🟢 Click "Confirm Meals" to add to spending → 🔄 Use "Reset" to clear planning for tomorrow
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs">
                    <span className="text-green-600">• Planning: Free (no spending)</span>
                    <span className="text-blue-600">• Confirmed: Added to spending records</span>
                    <span className="text-red-600">• Reset: Clears planning only</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Breakfast
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lunch
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dinner
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{student.user.name}</div>
                              <div className="text-sm text-gray-500">Roll: {student.rollNo}</div>
                              <div className="text-sm text-gray-500">{student.hostel} - {student.room}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isStudentMealMarked(student.id, 'BREAKFAST')}
                              onChange={(e) => markMeal(student.id, 'BREAKFAST', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isStudentMealMarked(student.id, 'LUNCH')}
                              onChange={(e) => markMeal(student.id, 'LUNCH', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isStudentMealMarked(student.id, 'DINNER')}
                              onChange={(e) => markMeal(student.id, 'DINNER', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grocery Management Tab */}
        {activeTab === 'groceries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Grocery Inventory Management</h2>
              <button
                onClick={() => setShowAddGrocery(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Grocery Item</span>
              </button>
            </div>

            {groceries.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No grocery items found. Add items to manage inventory.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groceries.map((grocery) => (
                  <div key={grocery.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{grocery.name}</h3>
                        <p className="text-sm text-gray-600">{grocery.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Category: {grocery.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingGrocery(grocery)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteGrocery(grocery.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">₹{grocery.price}</span>
                      <span className={`text-sm ${grocery.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Stock: {grocery.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
                  )}

        {/* Add User Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Grocery Purchase for User</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Grocery Purchase</h3>
              <AddPurchaseForm 
                students={students}
                groceries={groceries}
                onSuccess={fetchData}
              />
            </div>
          </div>
        )}

        {/* User Spending Tab */}
        {activeTab === 'spending' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">User Spending Overview</h2>
            
            {userSpending.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No spending data available.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Student Info
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          This Month
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          All Time
                        </th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meals
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groceries
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meals
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groceries
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userSpending.map((spending) => (
                        <tr key={spending.studentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{spending.studentName}</div>
                              <div className="text-sm text-gray-500">Roll: {spending.rollNo}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            ₹{spending.monthlyMealSpent.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            ₹{spending.monthlyGrocerySpent.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600 border-r border-gray-200">
                            ₹{spending.monthlyTotalSpent.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            ₹{spending.allTimeMealSpent.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            ₹{spending.allTimeGrocerySpent.toFixed(2)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-indigo-600">
                            ₹{spending.allTimeTotalSpent.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200">
                          Total All Students:
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">
                          ₹{userSpending.reduce((sum, s) => sum + s.monthlyMealSpent, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">
                          ₹{userSpending.reduce((sum, s) => sum + s.monthlyGrocerySpent, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-blue-600 border-r border-gray-200">
                          ₹{userSpending.reduce((sum, s) => sum + s.monthlyTotalSpent, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">
                          ₹{userSpending.reduce((sum, s) => sum + s.allTimeMealSpent, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">
                          ₹{userSpending.reduce((sum, s) => sum + s.allTimeGrocerySpent, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-4 text-center text-sm font-semibold text-indigo-600">
                          ₹{userSpending.reduce((sum, s) => sum + s.allTimeTotalSpent, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daily Tracking Tab */}
        {activeTab === 'daily-tracking' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Daily Student Tracking</h2>
            
            {/* Student Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user.name} - {student.rollNo} ({student.hostel}-{student.room})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchStudentDailyData(selectedStudent)}
                  disabled={!selectedStudent || loadingDailyData}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingDailyData ? 'Loading...' : 'View Details'}
                </button>
              </div>
            </div>

            {/* Student Daily Data */}
            {studentDailyData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {studentDailyData.student.name} - Daily Breakdown ({studentDailyData.month})
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Roll: {studentDailyData.student.rollNo} | Room: {studentDailyData.student.hostel}-{studentDailyData.student.room}
                  </p>
                </div>

                {/* Monthly Summary */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">{studentDailyData.monthlyTotals.totalMeals}</p>
                      <p className="text-xs text-gray-600">Total Meals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">₹{studentDailyData.monthlyTotals.totalMealSpent.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Meal Spending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{studentDailyData.monthlyTotals.totalPurchases}</p>
                      <p className="text-xs text-gray-600">Purchases</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">₹{studentDailyData.monthlyTotals.totalGrocerySpent.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Grocery Spending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{studentDailyData.monthlyTotals.activeDays}</p>
                      <p className="text-xs text-gray-600">Active Days</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">₹{studentDailyData.monthlyTotals.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Total Spending</p>
                    </div>
                  </div>
                </div>

                {/* Daily Records */}
                <div className="p-6">
                  {studentDailyData.dailyBreakdown.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No activity this month</p>
                  ) : (
                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {studentDailyData.dailyBreakdown.map((day: any) => (
                        <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                          {/* Day Header */}
                          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </h4>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-indigo-600 font-medium">{day.mealCount} meals</span>
                              <span className="text-orange-600 font-medium">{day.purchaseCount} purchases</span>
                              <span className="text-purple-600 font-bold">₹{day.totalSpent.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Meals */}
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Meals (₹{day.totalMealSpent.toFixed(2)})</h5>
                              {day.meals.length === 0 ? (
                                <p className="text-gray-400 text-sm">No meals</p>
                              ) : (
                                <div className="space-y-2">
                                  {day.meals.map((meal: any) => (
                                    <div key={meal.id} className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                                      <div>
                                        <p className="font-medium text-green-900">{meal.name}</p>
                                        <p className="text-xs text-green-600 capitalize">{meal.type.toLowerCase()}</p>
                                      </div>
                                      <p className="font-semibold text-green-700">₹{meal.price.toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Purchases */}
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Groceries (₹{day.totalGrocerySpent.toFixed(2)})</h5>
                              {day.purchases.length === 0 ? (
                                <p className="text-gray-400 text-sm">No purchases</p>
                              ) : (
                                <div className="space-y-2">
                                  {day.purchases.map((purchase: any) => (
                                    <div key={purchase.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-200">
                                      <div>
                                        <p className="font-medium text-yellow-900">{purchase.groceryName}</p>
                                        <p className="text-xs text-yellow-600">Qty: {purchase.quantity} × ₹{purchase.unitPrice}</p>
                                      </div>
                                      <p className="font-semibold text-yellow-700">₹{purchase.totalPrice.toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        <AddStudentModal 
          isOpen={showAddStudent}
          onClose={() => setShowAddStudent(false)}
          onSuccess={() => {
            setShowAddStudent(false)
            fetchData()
          }}
        />

        {/* Add Grocery Modal */}
        <AddGroceryModal 
          isOpen={showAddGrocery}
          onClose={() => setShowAddGrocery(false)}
          onSuccess={() => {
            setShowAddGrocery(false)
            fetchData()
          }}
        />

        {/* Edit Grocery Modal */}
        <EditGroceryModal 
          grocery={editingGrocery}
          onClose={() => setEditingGrocery(null)}
          onSuccess={() => {
            setEditingGrocery(null)
            fetchData()
          }}
        />
      </div>
    </div>
  )
}

function AddStudentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    hostel: '',
    room: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Student added successfully!')
        setFormData({
          name: '',
          email: '',
          password: '',
          rollNo: '',
          hostel: '',
          room: '',
          phone: ''
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add student')
      }
    } catch (error) {
      alert('Error adding student')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
              type="text"
              value={formData.rollNo}
              onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
            <input
              type="text"
              value={formData.hostel}
              onChange={(e) => setFormData({...formData, hostel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddGroceryModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      })

      if (response.ok) {
        alert('Grocery item added successfully!')
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          category: ''
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add grocery item')
      }
    } catch (error) {
      alert('Error adding grocery item')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Grocery Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditGroceryModal({ grocery, onClose, onSuccess }: { grocery: Grocery | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  })

  useEffect(() => {
    if (grocery) {
      setFormData({
        name: grocery.name,
        description: grocery.description || '',
        price: grocery.price.toString(),
        stock: grocery.stock.toString(),
        category: grocery.category || ''
      })
    }
  }, [grocery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grocery) return
    
    try {
      const response = await fetch(`/api/admin/groceries/${grocery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      })

      if (response.ok) {
        alert('Grocery item updated successfully!')
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update grocery item')
      }
    } catch (error) {
      alert('Error updating grocery item')
    }
  }

  if (!grocery) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Grocery Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddPurchaseForm({ students, groceries, onSuccess }: { 
  students: Student[], 
  groceries: Grocery[], 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    studentId: '',
    groceryId: '',
    quantity: '1'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.studentId || !formData.groceryId || !formData.quantity) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/add-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          groceryId: formData.groceryId,
          quantity: parseInt(formData.quantity)
        })
      })

      if (response.ok) {
        alert('Purchase added successfully!')
        setFormData({
          studentId: '',
          groceryId: '',
          quantity: '1'
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to add purchase')
      }
    } catch (error) {
      alert('Error adding purchase')
    } finally {
      setLoading(false)
    }
  }

  const selectedGrocery = groceries.find(g => g.id === formData.groceryId)
  const totalPrice = selectedGrocery ? selectedGrocery.price * parseInt(formData.quantity || '1') : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({...formData, studentId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.user.name} ({student.rollNo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Grocery Item</label>
          <select
            value={formData.groceryId}
            onChange={(e) => setFormData({...formData, groceryId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Choose an item...</option>
            {groceries.map((grocery) => (
              <option key={grocery.id} value={grocery.id}>
                {grocery.name} - ₹{grocery.price} (Stock: {grocery.stock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            max={selectedGrocery?.stock || 999}
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {selectedGrocery && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedGrocery.name} × {formData.quantity}
            </span>
            <span className="text-lg font-semibold text-indigo-600">
              Total: ₹{totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Purchase'}
        </button>
      </div>
    </form>
  )
} 