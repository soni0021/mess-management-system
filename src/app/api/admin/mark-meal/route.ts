import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getLocalToday, getLocalTomorrow } from '../../../../lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const { studentId, mealType, marked } = await request.json()

    if (!studentId || !mealType || marked === undefined) {
      return NextResponse.json(
        { error: 'Student ID, meal type, and marked status are required' },
        { status: 400 }
      )
    }

    // Get today's date
    const today = getLocalToday()
    const tomorrow = getLocalTomorrow()

    // Check if meal already exists for today
    const existingMeal = await prisma.meal.findFirst({
      where: {
        type: mealType,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    let meal = existingMeal
    if (!meal) {
      // Create new meal for today
      const mealPrices = {
        BREAKFAST: 30,
        LUNCH: 50,
        DINNER: 45
      }

      meal = await prisma.meal.create({
        data: {
          name: `${mealType.toLowerCase().charAt(0).toUpperCase() + mealType.toLowerCase().slice(1)}`,
          type: mealType,
          date: today,
          price: mealPrices[mealType as keyof typeof mealPrices]
        }
      })
    }

    // Check if student already has this meal marked
    const existingRecord = await prisma.mealRecord.findFirst({
      where: {
        studentId,
        mealId: meal.id
      }
    })

    if (marked) {
      // Mark the meal
      if (existingRecord) {
        return NextResponse.json(
          { error: 'Meal already marked for this student today' },
          { status: 400 }
        )
      }

      // Create meal record
      const mealRecord = await prisma.mealRecord.create({
        data: {
          studentId,
          mealId: meal.id
        }
      })

      return NextResponse.json({ success: true, mealRecord })
    } else {
      // Unmark the meal
      if (!existingRecord) {
        return NextResponse.json(
          { error: 'Meal is not marked for this student today' },
          { status: 400 }
        )
      }

      // Delete meal record
      await prisma.mealRecord.delete({
        where: { id: existingRecord.id }
      })

      return NextResponse.json({ success: true, message: 'Meal unmarked' })
    }
  } catch (error) {
    console.error('Error marking meal:', error)
    return NextResponse.json(
      { error: 'Failed to mark meal' },
      { status: 500 }
    )
  }
} 