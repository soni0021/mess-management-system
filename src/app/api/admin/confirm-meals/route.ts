import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getLocalToday, getLocalTomorrow } from '../../../../lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    // Get today's date
    const today = getLocalToday()
    const tomorrow = getLocalTomorrow()

    // Get all meal plans for today
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        planned: true
      }
    })

    const mealPrices = {
      BREAKFAST: 30,
      LUNCH: 50,
      DINNER: 45
    }

    // Process each meal plan
    for (const plan of mealPlans) {
      try {
        // Check if meal already exists for today and type
        let meal = await prisma.meal.findFirst({
          where: {
            type: plan.mealType,
            date: {
              gte: today,
              lt: tomorrow
            }
          }
        })

        if (!meal) {
          // Create new meal for today
          meal = await prisma.meal.create({
            data: {
              name: `${plan.mealType.toLowerCase().charAt(0).toUpperCase() + plan.mealType.toLowerCase().slice(1)}`,
              type: plan.mealType,
              date: today,
              price: mealPrices[plan.mealType as keyof typeof mealPrices]
            }
          })
        }

        // Check if student already has this meal record
        const existingRecord = await prisma.mealRecord.findFirst({
          where: {
            studentId: plan.studentId,
            mealId: meal.id
          }
        })

        if (!existingRecord) {
          // Create meal record (this adds to spending)
          await prisma.mealRecord.create({
            data: {
              studentId: plan.studentId,
              mealId: meal.id,
              marked: true
            }
          })
        }
      } catch (error) {
        console.error(`Error processing meal plan for student ${plan.studentId}:`, error)
        // Continue with other plans even if one fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Confirmed ${mealPlans.length} meal plans and added them to spending records.` 
    })
  } catch (error) {
    console.error('Error confirming meals:', error)
    return NextResponse.json(
      { error: 'Failed to confirm meals' },
      { status: 500 }
    )
  }
} 