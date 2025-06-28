import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    // Get current month start and end dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        },
        mealRecords: {
          include: {
            meal: true
          }
        },
        purchases: {
          include: {
            grocery: true
          }
        }
      }
    })

    const userSpending = students.map(student => {
      // Calculate all-time totals
      const allTimeMealSpent = student.mealRecords.reduce((sum, record) => sum + record.meal.price, 0)
      const allTimeGrocerySpent = student.purchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)

      // Calculate monthly totals
      const monthlyMealRecords = student.mealRecords.filter(record => {
        const mealDate = new Date(record.meal.date)
        return mealDate >= currentMonthStart && mealDate <= currentMonthEnd
      })
      const monthlyPurchases = student.purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.createdAt)
        return purchaseDate >= currentMonthStart && purchaseDate <= currentMonthEnd
      })

      const monthlyMealSpent = monthlyMealRecords.reduce((sum, record) => sum + record.meal.price, 0)
      const monthlyGrocerySpent = monthlyPurchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0)

      return {
        studentId: student.id,
        studentName: student.user.name,
        rollNo: student.rollNo,
        monthlyMealSpent,
        monthlyGrocerySpent,
        monthlyTotalSpent: monthlyMealSpent + monthlyGrocerySpent,
        allTimeMealSpent,
        allTimeGrocerySpent,
        allTimeTotalSpent: allTimeMealSpent + allTimeGrocerySpent
      }
    })

    return NextResponse.json(userSpending)
  } catch (error) {
    console.error('Error fetching user spending:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user spending' },
      { status: 500 }
    )
  }
} 