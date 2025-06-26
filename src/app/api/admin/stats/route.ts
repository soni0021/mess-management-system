import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const [
      totalStudents,
      totalMeals,
      totalGroceries,
      totalPurchases,
      todayBreakfast,
      todayLunch,
      todayDinner
    ] = await Promise.all([
      prisma.student.count(),
      prisma.mealRecord.count(),
      prisma.grocery.count({ where: { available: true } }),
      prisma.purchase.count(),
      prisma.mealRecord.count({
        where: {
          meal: {
            type: 'BREAKFAST',
            date: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        }
      }),
      prisma.mealRecord.count({
        where: {
          meal: {
            type: 'LUNCH',
            date: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        }
      }),
      prisma.mealRecord.count({
        where: {
          meal: {
            type: 'DINNER',
            date: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        }
      })
    ])

    const stats = {
      totalStudents,
      totalMeals,
      totalGroceries,
      totalPurchases,
      todayMeals: {
        breakfast: todayBreakfast,
        lunch: todayLunch,
        dinner: todayDinner
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
} 