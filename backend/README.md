# DentiCloud Backend

Multi-tenant Dental Management System API built with NestJS, PostgreSQL, and Prisma.

## Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose
- npm or yarn

## Quick Start

### 1. Start Database Services

```bash
# From project root
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (default values work for local development).

### 4. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed Database

```bash
npm run prisma:seed
```

This creates test users:
- **Admin**: admin@dentista.com / Admin123!
- **Dentist**: dentist@dentista.com / Dentist123!
- **Patient**: patient@dentista.com / Patient123!

### 6. Start Development Server

```bash
npm run start:dev
```

API will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

## Testing Endpoints with curl

### Register New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newdentist@example.com",
    "name": "Dr. Jane Smith",
    "password": "Password123!",
    "phone": "+1234567890",
    "role": "DENTIST",
    "licenseNumber": "DDS-67890",
    "npiNumber": "0987654321",
    "specialization": "Orthodontics"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dentist@dentista.com",
    "password": "Dentist123!"
  }'
```

Save the `accessToken` from the response.

### Get Current User Profile

```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Get All Patients

```bash
curl -X GET http://localhost:3000/patients \
  -H "Authorization: Bearer $TOKEN"
```

### Get Patient by ID

```bash
curl -X GET http://localhost:3000/patients/{patient_id} \
  -H "Authorization: Bearer $TOKEN"
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # Users module
│   ├── patients/          # Patients module
│   ├── prisma/            # Prisma service
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
├── .env                   # Environment variables
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with test data
- `npm test` - Run tests

## Database Management

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens at http://localhost:5555

### Create New Migration

```bash
npx prisma migrate dev --name migration_name
```

### Reset Database

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run seed script

## Test Credentials

### Super Admin
- Email: admin@dentista.com
- Password: Admin123!

### Dentist
- Email: dentist@dentista.com
- Password: Dentist123!

### Patient
- Email: patient@dentista.com
- Password: Patient123!
