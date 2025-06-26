import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: {
        userId: session.user.id
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Create purchases and update stock
    const purchases = await prisma.$transaction(async (tx) => {
      const createdPurchases = []

      for (const item of items) {
        // Check if grocery exists and has enough stock
        const grocery = await tx.grocery.findUnique({
          where: { id: item.id }
        })

        if (!grocery || !grocery.available || grocery.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${grocery?.name || 'item'}`)
        }

        // Create purchase record
        const purchase = await tx.purchase.create({
          data: {
            studentId: student.id,
            groceryId: item.id,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            status: 'PENDING'
          }
        })

        // Update grocery stock
        await tx.grocery.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        createdPurchases.push(purchase)
      }

      return createdPurchases
    })

    return NextResponse.json({ success: true, purchases })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create purchase' },
      { status: 500 }
    )
  }
} 