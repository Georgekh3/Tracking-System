# Atelier Inventory & Item Tracking System

A full-stack inventory and handover tracking app for an Atelier. It uses Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, custom email/password authentication, role-based access control, and Supabase Storage item image uploads.

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL 16+
- Docker Desktop is recommended for the included database setup. If Docker is not installed, use any PostgreSQL server and set `DATABASE_URL`.

## Setup

```bash
npm install
```

Create `.env` in the project root before running Prisma:

```env
DATABASE_URL="postgresql://atelier:atelier_password@localhost:5432/atelier_inventory?schema=public"
DIRECT_URL="postgresql://atelier:atelier_password@localhost:5432/atelier_inventory?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_STORAGE_BUCKET="item-photos"
SUPABASE_STORAGE_PUBLIC="false"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-or-secret-key"
BOOTSTRAP_ADMIN_NAME="Your Name"
BOOTSTRAP_ADMIN_EMAIL="your-admin-email@example.com"
BOOTSTRAP_ADMIN_PASSWORD="choose-a-real-password"
```

If you use Docker:

```bash
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

If you do not use Docker, create a PostgreSQL database yourself, update `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Supabase Database

For Supabase hosting, use the ORM connection strings from Supabase:

```env
DATABASE_URL="postgresql://postgres.xzeueivjzkotlyvgcqei:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xzeueivjzkotlyvgcqei:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

Do not run `npx prisma init`; Prisma is already configured in this project. After updating the URLs, run `npm run prisma:generate` and `npm run prisma:seed` to create the bootstrap admin.

For an existing hosted database, apply checked-in migrations with:

```bash
npm run prisma:deploy
```

## First Login

Use the bootstrap admin credentials you set in `.env`. The seed script does not create sample users, sample items, or sample transactions.

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run db:studio
```

## Uploads

Item photos are stored in Supabase Storage. The app stores only the object path in PostgreSQL, then serves photos through an authenticated app route. Keep `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` server-only and never expose it in client code.

## Data Storage

Application data is saved in PostgreSQL through Prisma. With the included Docker setup, the database is stored in the Docker volume named `atelier-postgres-data`, so it survives normal container restarts.

For production, use Supabase Postgres or another managed PostgreSQL database, and Supabase Storage or another object storage provider for item photos.
