import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentMonthRange, toLocalDateString } from '../../../../lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current month start and end dates
    const { start: currentMonthStart, end: currentMonthEnd } = getCurrentMonthRange()

    // Find the student
    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get meal records for current month
    const mealRecords = await prisma.mealRecord.findMany({
      where: {
        studentId: student.id,
        meal: {
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      },
      include: {
        meal: true
      },
      orderBy: {
        meal: {
          date: 'desc'
        }
      }
    })

    // Get purchase records for current month
    const purchases = await prisma.purchase.findMany({
      where: {
        studentId: student.id,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      include: {
        grocery: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group by date
    const dailyBreakdown = new Map()

    // Process meal records
    mealRecords.forEach(record => {
      const dateStr = toLocalDateString(record.meal.date)
      
      if (!dailyBreakdown.has(dateStr)) {
        dailyBreakdown.set(dateStr, {
          date: dateStr,
          meals: [],
          purchases: [],
          totalMealSpent: 0,
          totalGrocerySpent: 0,
          totalSpent: 0,
          mealCount: 0,
          purchaseCount: 0
        })
      }

      const dayData = dailyBreakdown.get(dateStr)
      dayData.meals.push({
        id: record.id,
        name: record.meal.name,
        type: record.meal.type,
        price: record.meal.price,
        time: record.eatenAt
      })
      dayData.totalMealSpent += record.meal.price
      dayData.mealCount += 1
      dayData.totalSpent = dayData.totalMealSpent + dayData.totalGrocerySpent
    })

    // Process purchase records
    purchases.forEach(purchase => {
      const dateStr = toLocalDateString(purchase.createdAt)
      
      if (!dailyBreakdown.has(dateStr)) {
        dailyBreakdown.set(dateStr, {
          date: dateStr,
          meals: [],
          purchases: [],
          totalMealSpent: 0,
          totalGrocerySpent: 0,
          totalSpent: 0,
          mealCount: 0,
          purchaseCount: 0
        })
      }

      const dayData = dailyBreakdown.get(dateStr)
      dayData.purchases.push({
        id: purchase.id,
        groceryName: purchase.grocery.name,
        quantity: purchase.quantity,
        unitPrice: purchase.grocery.price,
        totalPrice: purchase.totalPrice,
        time: purchase.createdAt
      })
      dayData.totalGrocerySpent += purchase.totalPrice
      dayData.purchaseCount += 1
      dayData.totalSpent = dayData.totalMealSpent + dayData.totalGrocerySpent
    })

    // Convert to array and sort by date (newest first)
    const dailyData = Array.from(dailyBreakdown.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Calculate monthly totals
    const monthlyTotals = {
      totalMealSpent: dailyData.reduce((sum, day) => sum + day.totalMealSpent, 0),
      totalGrocerySpent: dailyData.reduce((sum, day) => sum + day.totalGrocerySpent, 0),
      totalSpent: dailyData.reduce((sum, day) => sum + day.totalSpent, 0),
      totalMeals: dailyData.reduce((sum, day) => sum + day.mealCount, 0),
      totalPurchases: dailyData.reduce((sum, day) => sum + day.purchaseCount, 0),
      activeDays: dailyData.length
    }

    return NextResponse.json({
      monthlyTotals,
      dailyBreakdown: dailyData,
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })
  } catch (error) {
    console.error('Error fetching daily breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily breakdown' },
      { status: 500 }
    )
  }
} 