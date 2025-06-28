import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getLocalToday, getLocalTomorrow } from '../../../../lib/dateUtils'

export async function POST() {
  try {
    // Get today's date
    const today = getLocalToday()
    const tomorrow = getLocalTomorrow()

    // Delete all meal plans for today (this doesn't affect historical meal records)
    await prisma.mealPlan.deleteMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'All meal plans reset successfully. Historical spending records remain intact.' 
    })
  } catch (error) {
    console.error('Error resetting meal plans:', error)
    return NextResponse.json(
      { error: 'Failed to reset meal plans' },
      { status: 500 }
    )
  }
} 