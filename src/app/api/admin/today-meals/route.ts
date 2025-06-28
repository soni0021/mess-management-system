import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getLocalToday, getLocalTomorrow } from '../../../../lib/dateUtils'

export async function GET() {
  try {
    // Get today's date
    const today = getLocalToday()
    const tomorrow = getLocalTomorrow()

    // Get all students
    const students = await prisma.student.findMany({
      select: { id: true }
    })

    // Get today's meals
    const todayMeals = await prisma.meal.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        mealRecords: {
          select: {
            studentId: true
          }
        }
      }
    })

    // Structure the response
    const result = {
      breakfast: students.map(student => ({
        studentId: student.id,
        marked: todayMeals
          .filter(meal => meal.type === 'BREAKFAST')
          .some(meal => meal.mealRecords.some(record => record.studentId === student.id))
      })),
      lunch: students.map(student => ({
        studentId: student.id,
        marked: todayMeals
          .filter(meal => meal.type === 'LUNCH')
          .some(meal => meal.mealRecords.some(record => record.studentId === student.id))
      })),
      dinner: students.map(student => ({
        studentId: student.id,
        marked: todayMeals
          .filter(meal => meal.type === 'DINNER')
          .some(meal => meal.mealRecords.some(record => record.studentId === student.id))
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching today meals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today meals' },
      { status: 500 }
    )
  }
} 