import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { studentId, groceryId, quantity } = await request.json()

    if (!studentId || !groceryId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Student ID, grocery ID, and valid quantity are required' },
        { status: 400 }
      )
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get grocery item
    const grocery = await prisma.grocery.findUnique({
      where: { id: groceryId }
    })

    if (!grocery) {
      return NextResponse.json(
        { error: 'Grocery item not found' },
        { status: 404 }
      )
    }

    const totalPrice = grocery.price * quantity

    // Create purchase record (no stock reduction since admin is manually adding)
    const purchase = await prisma.purchase.create({
      data: {
        studentId: student.id,
        groceryId: grocery.id,
        quantity,
        totalPrice,
        status: 'CONFIRMED'
      },
      include: {
        grocery: {
          select: {
            name: true,
            price: true
          }
        },
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

    return NextResponse.json({ 
      success: true, 
      purchase,
      message: `Purchase of ${quantity} ${grocery.name}(s) added to ${purchase.student.user.name}'s account` 
    })
  } catch (error) {
    console.error('Error adding purchase:', error)
    return NextResponse.json(
      { error: 'Failed to add purchase' },
      { status: 500 }
    )
  }
} 