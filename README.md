# BIS Client Portal — Absolute Veritas

A private web portal for collecting BIS/FMCS certification form data from clients.

## Project Structure

```
bis-portal/
├── client/          # React + Vite frontend
└── server/          # Node.js + Express backend
```

---

## Setup — Step by Step

### 1. Database (Supabase — Free)

1. Go to https://supabase.com → Create new project
2. Copy the **Connection String** from Settings → Database → Connection string → URI
3. It looks like: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

### 2. Email (Brevo — Free)

1. Go to https://brevo.com → Sign up with `it01@absoluteveritas.com`
2. Go to Settings → API Keys → Create API Key
3. Copy the API key

### 3. Server Setup

```bash
cd server

# Copy and fill environment variables
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://..."       # from Supabase
JWT_SECRET="any-long-random-string"   # e.g. openssl rand -hex 32
PORT=5000
CLIENT_URL="http://localhost:5173"
BREVO_API_KEY="xkeysib-..."           # from Brevo
ADMIN_EMAIL="it01@absoluteveritas.com"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=5
NODE_ENV="development"
```

```bash
# Install dependencies
npm install

# Push database schema
npx prisma generate
npx prisma db push

# Create admin account (run once)
node scripts/createAdmin.js

# Start server
npm run dev
```

### 4. Client Setup

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

---

## Create Admin Account

Run this once after database setup:

```bash
cd server
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('YOUR_ADMIN_PASSWORD', 12);
  await prisma.user.create({ data: { username: 'admin', email: 'it01@absoluteveritas.com', passwordHash: hash, role: 'ADMIN' } });
  console.log('Admin created!');
  await prisma.\$disconnect();
}
main();
"
```

Admin logs in at `/login` with email: `it01@absoluteveritas.com`

---

## Usage

### Admin
1. Login at `yourdomain.com/login` with your email + password
2. Click **New Account** to create a client
3. Set username (e.g. `clientname_2025`) and password
4. Share the URL + username + password with client

### Client
1. Go to `yourdomain.com/login`
2. Enter username + password given by admin
3. Fill form tab by tab — progress saves automatically
4. Upload documents in the relevant fields
5. Submit on the Declaration tab

---

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist folder to Vercel
# Set VITE_API_URL env var if needed
```

### Backend → Railway
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Point to `/server` folder
3. Add all `.env` variables in Railway dashboard
4. Railway auto-deploys on push

### Update CLIENT_URL in server .env to your Vercel URL

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite, Tailwind CSS |
| Routing | React Router v6 |
| Form | React state + auto-save |
| File Upload | react-dropzone + Multer |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) via Prisma |
| Auth | JWT |
| Email | Brevo API |
| Excel Export | ExcelJS |
| File Storage | Local disk (upgrade to S3/R2 for production) |
