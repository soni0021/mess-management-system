import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const groceries = await prisma.grocery.findMany({
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

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, stock, category } = await request.json()

    const grocery = await prisma.grocery.create({
      data: {
        name,
        description,
        price,
        stock,
        category
      }
    })

    return NextResponse.json(grocery)
  } catch (error) {
    console.error('Error creating grocery:', error)
    return NextResponse.json(
      { error: 'Failed to create grocery' },
      { status: 500 }
    )
  }
} 