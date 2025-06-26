import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const mealRecords = await prisma.mealRecord.findMany({
      where: {
        studentId: student.id
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

    return NextResponse.json(mealRecords)
  } catch (error) {
    console.error('Error fetching meals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    )
  }
} 