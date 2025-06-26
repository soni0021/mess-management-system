import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, price, stock, category } = await request.json()

    const grocery = await prisma.grocery.update({
      where: { id },
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
    console.error('Error updating grocery:', error)
    return NextResponse.json(
      { error: 'Failed to update grocery' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.grocery.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting grocery:', error)
    return NextResponse.json(
      { error: 'Failed to delete grocery' },
      { status: 500 }
    )
  }
} 