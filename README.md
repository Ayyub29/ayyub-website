# Ayyub Finance

Personal finance web app (Next.js + Neon Postgres + Drizzle + Auth.js), structured like a spreadsheet budget: **accounts**, **categories**, **transactions**, and **monthly budgets**.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **PostgreSQL** on [Neon](https://neon.com/) (free tier)
- **Drizzle ORM**
- **Auth.js (NextAuth v5)** with Google sign-in
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** (added for upcoming dashboard charts)

## Quick start

### 1. Clone and install

```bash
npm install
```

### 2. Neon database

1. Create a project at [neon.com](https://neon.com/).
2. Copy the **pooled** connection string.
3. Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local`.

### 3. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` (`openssl rand -base64 32`).
4. Optional: set `AUTH_ALLOWED_EMAIL` to your Gmail so only you can sign in.

### 4. Database schema and sample data

```bash
npm run db:push
npm run db:seed
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → **Dashboard**.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Apply schema to Neon (dev-friendly) |
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:seed` | Insert starter accounts, categories, transactions |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## App routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/login` | Google sign-in |
| `/dashboard` | Monthly summary + recent activity |
| `/transactions` | Transaction ledger |
| `/accounts` | Account list |
| `/categories` | Income/expense categories |
| `/budget` | Planned vs actual (current month) |

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Add the same environment variables as `.env.local`.
3. Set production Google redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`
4. Set `AUTH_URL` to your production URL.

## Next steps

- Import CSV from your Google Sheet
- Add transaction create/edit forms
- Charts on the dashboard (Recharts)
- Match category names to your spreadsheet tabs
