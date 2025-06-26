# Mess Management System Setup

This is a comprehensive mess management system built with Next.js, Prisma, PostgreSQL (Neon), and NextAuth.

## Features

### Student Dashboard
- View meal history and weekly meal tracking
- Browse and purchase groceries from the mess store
- Track purchase history and spending
- Real-time meal attendance tracking

### Admin Dashboard
- Manage students (add, edit, remove)
- Mark student meal attendance for breakfast, lunch, and dinner
- Manage grocery store inventory (add, edit, update stock)
- Track all purchases and sales
- View comprehensive analytics and statistics

## Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL database (or any PostgreSQL database)

## Setup Instructions

### 1. Database Setup

1. Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
2. Copy your connection string

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database - Replace with your Neon PostgreSQL connection string
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration and Seeding

```bash
# Push the schema to your database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database with initial data
npx prisma db seed
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Demo Credentials

After seeding, you can use these credentials:

**Admin:**
- Email: admin@example.com
- Password: password

**Student:**
- Email: student@example.com
- Password: password

## Database Schema

The system includes the following models:
- **User**: Authentication and basic user info
- **Student**: Student-specific information (roll number, hostel, room)
- **Admin**: Admin user profiles
- **Meal**: Daily meals (breakfast, lunch, dinner)
- **MealRecord**: Track which students ate which meals
- **Grocery**: Store inventory items
- **Purchase**: Track grocery purchases by students

## Key Features

### For Students:
1. **Dashboard**: View meal history, weekly tracking, and purchase summary
2. **Store**: Browse groceries, add to cart, and make purchases
3. **Meal Tracking**: See which meals they've had each day
4. **Purchase History**: Track all grocery purchases and spending

### For Admins:
1. **Student Management**: Add new students, view student details
2. **Meal Management**: Mark meal attendance for students
3. **Grocery Management**: Add/edit grocery items, manage stock
4. **Purchase Tracking**: View and manage all student purchases
5. **Analytics**: View comprehensive statistics and reports

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Date Handling**: date-fns

## API Endpoints

- `GET /api/groceries` - Fetch available groceries
- `GET /api/student/meals` - Fetch student's meal records
- `GET /api/student/purchases` - Fetch student's purchase history
- `POST /api/purchases` - Create new purchase
- `GET /api/admin/stats` - Fetch admin dashboard statistics

## Deployment

1. Deploy to Vercel or your preferred platform
2. Set environment variables in your deployment platform
3. Run database migrations if needed

## Troubleshooting

1. **Database Connection Issues**: Ensure your DATABASE_URL is correct and the database is accessible
2. **Authentication Issues**: Make sure NEXTAUTH_SECRET is set and unique
3. **Prisma Issues**: Try running `npx prisma generate` and `npx prisma db push`

## Future Enhancements

- Email notifications for purchases
- QR code scanning for meal attendance
- Mobile app support
- Payment gateway integration
- Meal planning and nutrition tracking
- Inventory alerts for low stock items 