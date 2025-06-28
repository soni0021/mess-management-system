import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getLocalToday, getLocalTomorrow } from '../../../../lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const { studentId, mealType, planned } = await request.json()

    if (!studentId || !mealType || planned === undefined) {
      return NextResponse.json(
        { error: 'Student ID, meal type, and planned status are required' },
        { status: 400 }
      )
    }

    // Get today's date
    const today = getLocalToday()

    if (planned) {
      // Add to meal plan - first check if it exists
      const existingPlan = await prisma.mealPlan.findFirst({
        where: {
          studentId,
          mealType,
          date: today
        }
      })

      if (existingPlan) {
        // Update existing plan
        const mealPlan = await prisma.mealPlan.update({
          where: { id: existingPlan.id },
          data: { planned: true }
        })
        return NextResponse.json({ success: true, mealPlan })
      } else {
        // Create new plan
        const mealPlan = await prisma.mealPlan.create({
          data: {
            studentId,
            mealType,
            date: today,
            planned: true
          }
        })
        return NextResponse.json({ success: true, mealPlan })
      }
    } else {
      // Remove from meal plan
      try {
        await prisma.mealPlan.deleteMany({
          where: {
            studentId,
            mealType,
            date: today
          }
        })
        return NextResponse.json({ success: true, message: 'Meal plan removed' })
      } catch {
        // If record doesn't exist, that's okay
        return NextResponse.json({ success: true, message: 'Meal plan already removed' })
      }
    }
  } catch (error) {
    console.error('Error updating meal plan:', error)
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    )
  }
}

// Get today's meal plans
export async function GET() {
  try {
    const today = getLocalToday()
    const tomorrow = getLocalTomorrow()

    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        planned: true
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Group by meal type
    const groupedPlans = {
      breakfast: mealPlans.filter(plan => plan.mealType === 'BREAKFAST').map(plan => ({
        studentId: plan.studentId,
        marked: true
      })),
      lunch: mealPlans.filter(plan => plan.mealType === 'LUNCH').map(plan => ({
        studentId: plan.studentId,
        marked: true
      })),
      dinner: mealPlans.filter(plan => plan.mealType === 'DINNER').map(plan => ({
        studentId: plan.studentId,
        marked: true
      }))
    }

    return NextResponse.json(groupedPlans)
  } catch (error) {
    console.error('Error fetching meal plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    )
  }
} 