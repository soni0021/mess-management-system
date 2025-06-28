# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (recommended: Neon, Supabase, or Railway)
3. Git repository with your code

## Step-by-Step Deployment

### 1. Prepare Your Database
Set up a PostgreSQL database using one of these providers:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **PlanetScale**: https://planetscale.com

### 2. Environment Variables
You'll need these environment variables in Vercel:

```
DATABASE_URL=postgresql://username:password@hostname:port/database?schema=public
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters
NEXTAUTH_URL=https://your-app.vercel.app
```

### 3. Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Redeploy with environment variables
vercel --prod
```

#### Option B: Deploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate a secure secret (32+ characters)
   - `NEXTAUTH_URL`: Your Vercel app URL (e.g., https://your-app.vercel.app)
5. Click "Deploy"

### 4. Initialize Database
After deployment, run database migrations:

```bash
# Push the schema to your database
npx prisma db push

# Seed the database with initial data
npx prisma db seed
```

Or run these commands in Vercel's function terminal.

### 5. Access Your Application
- Admin login: admin@example.com / password
- Student login: student@example.com / password

## Environment Variables Details

### DATABASE_URL
Your PostgreSQL connection string. Example formats:
- Neon: `postgresql://username:password@hostname/database?sslmode=require`
- Supabase: `postgresql://postgres:password@hostname:5432/postgres`
- Railway: `postgresql://postgres:password@hostname:port/railway`

### NEXTAUTH_SECRET
A random string used to encrypt JWT tokens. Generate one with:
```bash
openssl rand -base64 32
```

### NEXTAUTH_URL
Your application's URL:
- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check that DATABASE_URL is accessible from Vercel
- Verify Prisma schema is valid

### Database Issues
- Make sure your database allows connections from Vercel's IP ranges
- Check that the database URL includes SSL parameters if required
- Verify database credentials are correct

### Common Issues
1. **Prisma Client not found**: Make sure `postinstall` script runs `prisma generate`
2. **Database connection failed**: Check DATABASE_URL format and accessibility
3. **NextAuth errors**: Verify NEXTAUTH_SECRET and NEXTAUTH_URL are set correctly

## Post-Deployment
1. Test all functionality (login, meal management, grocery purchases)
2. Set up monitoring and error tracking
3. Configure custom domain if needed
4. Set up database backups 