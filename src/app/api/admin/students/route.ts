import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcryptjs from 'bcryptjs'

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        rollNo: 'asc'
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, rollNo, hostel, room, phone } = await request.json()

    // Check if email or roll number already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const existingStudent = await prisma.student.findUnique({
      where: { rollNo }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Roll number already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'STUDENT'
        }
      })

      const student = await tx.student.create({
        data: {
          userId: user.id,
          rollNo,
          hostel,
          room,
          phone
        }
      })

      return { user, student }
    })

    return NextResponse.json({ 
      success: true, 
      student: {
        ...result.student,
        user: {
          name: result.user.name,
          email: result.user.email
        }
      }
    })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
} 