import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const groceries = await prisma.grocery.findMany({
      where: {
        available: true,
        stock: {
          gt: 0
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(groceries)
  } catch (error) {
    console.error('Error fetching groceries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groceries' },
      { status: 500 }
    )
  }
} 