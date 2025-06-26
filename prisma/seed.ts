import { PrismaClient } from '../src/generated/prisma'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Hash passwords
  const hashedPassword = await bcryptjs.hash('password', 10)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  })

  // Create admin profile
  await prisma.admin.create({
    data: {
      userId: adminUser.id
    }
  })

  // Create student user
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'STUDENT'
    }
  })

  // Create student profile
  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      rollNo: 'STU001',
      hostel: 'A Block',
      room: '101',
      phone: '9876543210'
    }
  })

  // Create another student
  const studentUser2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'STUDENT'
    }
  })

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      rollNo: 'STU002',
      hostel: 'B Block',
      room: '202',
      phone: '9876543211'
    }
  })

  // Create meals for today
  const today = new Date()
  const breakfast = await prisma.meal.create({
    data: {
      name: 'Breakfast',
      type: 'BREAKFAST',
      description: 'Bread, Butter, Jam, Tea/Coffee',
      price: 25.0,
      date: today,
      available: true
    }
  })

  const lunch = await prisma.meal.create({
    data: {
      name: 'Lunch',
      type: 'LUNCH',
      description: 'Rice, Dal, Vegetable, Roti, Pickle',
      price: 45.0,
      date: today,
      available: true
    }
  })

  const dinner = await prisma.meal.create({
    data: {
      name: 'Dinner',
      type: 'DINNER',
      description: 'Rice, Dal, Vegetable, Roti, Sweet',
      price: 40.0,
      date: today,
      available: true
    }
  })

  // Create some meal records
  await prisma.mealRecord.create({
    data: {
      studentId: student.id,
      mealId: breakfast.id,
      marked: true
    }
  })

  await prisma.mealRecord.create({
    data: {
      studentId: student.id,
      mealId: lunch.id,
      marked: true
    }
  })

  // Create groceries
  const groceries = [
    {
      name: 'Instant Noodles',
      description: 'Maggi 2 minute noodles',
      price: 15.0,
      stock: 50,
      category: 'Snacks',
      available: true
    },
    {
      name: 'Biscuits',
      description: 'Parle-G biscuits pack',
      price: 20.0,
      stock: 30,
      category: 'Snacks',
      available: true
    },
    {
      name: 'Tea Bags',
      description: 'Lipton tea bags (25 count)',
      price: 45.0,
      stock: 20,
      category: 'Beverages',
      available: true
    },
    {
      name: 'Coffee',
      description: 'Nescafe instant coffee',
      price: 35.0,
      stock: 25,
      category: 'Beverages',
      available: true
    },
    {
      name: 'Chips',
      description: 'Lays potato chips',
      price: 25.0,
      stock: 40,
      category: 'Snacks',
      available: true
    },
    {
      name: 'Chocolate',
      description: 'Dairy Milk chocolate',
      price: 30.0,
      stock: 35,
      category: 'Snacks',
      available: true
    },
    {
      name: 'Energy Drink',
      description: 'Red Bull energy drink',
      price: 125.0,
      stock: 15,
      category: 'Beverages',
      available: true
    },
    {
      name: 'Soap',
      description: 'Dove beauty soap',
      price: 45.0,
      stock: 20,
      category: 'Personal Care',
      available: true
    },
    {
      name: 'Shampoo',
      description: 'Head & Shoulders shampoo sachet',
      price: 15.0,
      stock: 60,
      category: 'Personal Care',
      available: true
    },
    {
      name: 'Toothpaste',
      description: 'Colgate toothpaste',
      price: 65.0,
      stock: 25,
      category: 'Personal Care',
      available: true
    }
  ]

  for (const grocery of groceries) {
    await prisma.grocery.create({
      data: grocery
    })
  }

  // Create some sample purchases
  const grocery1 = await prisma.grocery.findFirst({
    where: { name: 'Instant Noodles' }
  })

  const grocery2 = await prisma.grocery.findFirst({
    where: { name: 'Biscuits' }
  })

  if (grocery1 && grocery2) {
    await prisma.purchase.create({
      data: {
        studentId: student.id,
        groceryId: grocery1.id,
        quantity: 2,
        totalPrice: 30.0,
        status: 'DELIVERED'
      }
    })

    await prisma.purchase.create({
      data: {
        studentId: student.id,
        groceryId: grocery2.id,
        quantity: 1,
        totalPrice: 20.0,
        status: 'CONFIRMED'
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 