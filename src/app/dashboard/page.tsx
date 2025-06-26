'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '../../lib/session'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface MealRecord {
  id: string
  meal: {
    id: string
    name: string
    type: string
    date: string
    price: number
  }
  eatenAt: string
}

interface Purchase {
  id: string
  quantity: number
  totalPrice: number
  createdAt: string
  grocery: {
    name: string
    price: number
  }
}

interface DailyBreakdown {
  date: string
  meals: Array<{
    id: string
    name: string
    type: string
    price: number
    time: string
  }>
  purchases: Array<{
    id: string
    groceryName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    time: string
  }>
  totalMealSpent: number
  totalGrocerySpent: number
  totalSpent: number
  mealCount: number
  purchaseCount: number
}

interface DailyBreakdownData {
  monthlyTotals: {
    totalMealSpent: number
    totalGrocerySpent: number
    totalSpent: number
    totalMeals: number
    totalPurchases: number
    activeDays: number
  }
  dailyBreakdown: DailyBreakdown[]
  month: string
}

export default function StudentDashboard() {
  const { user, logout, loading: sessionLoading } = useSession()
  const router = useRouter()
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [dailyBreakdownData, setDailyBreakdownData] = useState<DailyBreakdownData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [mealResponse, purchaseResponse, dailyBreakdownResponse] = await Promise.all([
        fetch('/api/student/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id })
        }),
        fetch('/api/student/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id })
        }),
        fetch('/api/student/daily-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id })
        })
      ])

      if (mealResponse.ok) {
        const mealData = await mealResponse.json()
        setMealRecords(mealData)
      }
      
      if (purchaseResponse.ok) {
        const purchaseData = await purchaseResponse.json()
        setPurchases(purchaseData)
      }

      if (dailyBreakdownResponse.ok) {
        const dailyBreakdownData = await dailyBreakdownResponse.json()
        setDailyBreakdownData(dailyBreakdownData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (sessionLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role === 'ADMIN') {
      router.push('/admin')
      return
    }

    fetchData()
  }, [user, sessionLoading, router, fetchData])

  const getCurrentMonthMeals = () => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    
    return mealRecords.filter(record => {
      const mealDate = new Date(record.meal.date)
      return mealDate >= start && mealDate <= end
    })
  }

  const getCurrentMonthPurchases = () => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.createdAt)
      return purchaseDate >= start && purchaseDate <= end
    })
  }

  const getTotalMealSpent = () => {
    return getCurrentMonthMeals().reduce((sum, record) => sum + record.meal.price, 0)
  }

  const getTotalGrocerySpent = () => {
    return getCurrentMonthPurchases().reduce((sum, purchase) => sum + purchase.totalPrice, 0)
  }

  const getTotalSpent = () => {
    return getTotalMealSpent() + getTotalGrocerySpent()
  }

  // All-time totals
  const getAllTimeMealSpent = () => {
    return mealRecords.reduce((sum, record) => sum + record.meal.price, 0)
  }

  const getAllTimeGrocerySpent = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)
  }

  const getAllTimeSpent = () => {
    return getAllTimeMealSpent() + getAllTimeGrocerySpent()
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-900 font-semibold">Loading...</div>
      </div>
    )
  }

  const currentMonthMeals = getCurrentMonthMeals()
  const currentMonthPurchases = getCurrentMonthPurchases()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Meals</p>
                <p className="text-xl font-bold text-indigo-600">{currentMonthMeals.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Meal Expense</p>
                <p className="text-xl font-bold text-green-600">₹{getTotalMealSpent().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grocery Expense</p>
                <p className="text-xl font-bold text-yellow-600">₹{getTotalGrocerySpent().toFixed(2)}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-purple-600">₹{getTotalSpent().toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* All-Time Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Time</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Meals</p>
                <p className="text-xl font-bold text-indigo-600">{mealRecords.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Meal Expense</p>
                <p className="text-xl font-bold text-green-600">₹{getAllTimeMealSpent().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grocery Expense</p>
                <p className="text-xl font-bold text-yellow-600">₹{getAllTimeGrocerySpent().toFixed(2)}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-purple-600">₹{getAllTimeSpent().toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* This Month Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Grocery Purchases</span>
                <span className="text-sm font-medium">{currentMonthPurchases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg per Meal</span>
                <span className="text-sm font-medium">
                  ₹{currentMonthMeals.length > 0 ? (getTotalMealSpent() / currentMonthMeals.length).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Active</span>
                <span className="text-sm font-medium">
                  {new Set(currentMonthMeals.map(meal => 
                    new Date(meal.meal.date).toDateString()
                  )).size}
                </span>
              </div>
            </div>
          </div>

          {/* All-Time Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All-Time Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Purchases</span>
                <span className="text-sm font-medium">{purchases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg per Meal</span>
                <span className="text-sm font-medium">
                  ₹{mealRecords.length > 0 ? (getAllTimeMealSpent() / mealRecords.length).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Days</span>
                <span className="text-sm font-medium">
                  {new Set(mealRecords.map(meal => 
                    new Date(meal.meal.date).toDateString()
                  )).size}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Breakdown Toggle */}
        <div className="mb-8">
          <button
            onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 font-medium"
          >
            <span>{showDailyBreakdown ? 'Hide' : 'Show'} Daily Breakdown</span>
            <span className="text-sm opacity-75">({dailyBreakdownData?.month})</span>
          </button>
        </div>

        {/* Daily Breakdown Section */}
        {showDailyBreakdown && dailyBreakdownData && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Daily Breakdown - {dailyBreakdownData.month}</h2>
                <p className="text-sm text-gray-600 mt-1">Detailed day-wise meals and purchases</p>
              </div>
              
              {/* Monthly Summary */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{dailyBreakdownData.monthlyTotals.totalMeals}</p>
                    <p className="text-xs text-gray-600">Total Meals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">₹{dailyBreakdownData.monthlyTotals.totalMealSpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Meal Spending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{dailyBreakdownData.monthlyTotals.totalPurchases}</p>
                    <p className="text-xs text-gray-600">Purchases</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">₹{dailyBreakdownData.monthlyTotals.totalGrocerySpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Grocery Spending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{dailyBreakdownData.monthlyTotals.activeDays}</p>
                    <p className="text-xs text-gray-600">Active Days</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">₹{dailyBreakdownData.monthlyTotals.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Total Spending</p>
                  </div>
                </div>
              </div>

              {/* Daily Records */}
              <div className="p-6">
                {dailyBreakdownData.dailyBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activity this month</p>
                ) : (
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {dailyBreakdownData.dailyBreakdown.map((day) => (
                      <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                        {/* Day Header */}
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {format(new Date(day.date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                          </h3>
                          <div className="flex space-x-4 text-sm">
                            <span className="text-indigo-600 font-medium">{day.mealCount} meals</span>
                            <span className="text-orange-600 font-medium">{day.purchaseCount} purchases</span>
                            <span className="text-purple-600 font-bold">₹{day.totalSpent.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Meals */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Meals (₹{day.totalMealSpent.toFixed(2)})</h4>
                            {day.meals.length === 0 ? (
                              <p className="text-gray-400 text-sm">No meals</p>
                            ) : (
                              <div className="space-y-2">
                                {day.meals.map((meal) => (
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
                            <h4 className="font-medium text-gray-900 mb-2">Groceries (₹{day.totalGrocerySpent.toFixed(2)})</h4>
                            {day.purchases.length === 0 ? (
                              <p className="text-gray-400 text-sm">No purchases</p>
                            ) : (
                              <div className="space-y-2">
                                {day.purchases.map((purchase) => (
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meal History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">This Month&apos;s Meals</h2>
            </div>
            <div className="p-6">
              {currentMonthMeals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No meals this month</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {currentMonthMeals.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div>
                        <h3 className="font-semibold text-gray-900">{record.meal.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{record.meal.type.toLowerCase()}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(record.meal.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{record.meal.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">This Month&apos;s Grocery Purchases</h2>
              <p className="text-sm text-gray-500 mt-1">Purchases added by admin</p>
            </div>
            <div className="p-6">
              {currentMonthPurchases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No grocery purchases this month</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {currentMonthPurchases.map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div>
                        <h3 className="font-semibold text-gray-900">{purchase.grocery.name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {purchase.quantity}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(purchase.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{purchase.totalPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">₹{purchase.grocery.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 