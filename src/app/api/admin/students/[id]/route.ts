import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params

    // Delete student and associated user in transaction
    await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId }
      })

      if (!student) {
        throw new Error('Student not found')
      }

      // Delete student first (due to foreign key constraint)
      await tx.student.delete({
        where: { id: studentId }
      })

      // Then delete user
      await tx.user.delete({
        where: { id: student.userId }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
} 