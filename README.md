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

Set `DATABASE_URL` in `.env.local` (project root, same folder as `package.json`).

Drizzle CLI (`npm run db:push`, `db:seed`, etc.) reads `.env.local` automatically via `drizzle.config.ts`. If you still see a missing `url` error, check that the line is not empty and quotes are balanced:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

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
| `/settings/general` | Display currency (IDR / USD / THB) via Google Finance rates |
| `/settings/categories` | Category CRUD |
| `/settings/budget` | Monthly budget limits & status |

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Add the same environment variables as `.env.local`.
3. Set production Google redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`
4. Set `AUTH_URL` to your production URL.

## Google Sheets MCP (Cursor)

This repo includes [google-mcp](https://github.com/we2go/google-mcp) so Cursor can read your budget spreadsheet.

**Already in the repo**

- `.cursor/mcp.json` — MCP server + your spreadsheet ID
- `.google-sheet-mcp.json.example` — local config template

**One-time setup (you must do this — OAuth opens in your browser)**

```bash
cp .google-sheet-mcp.json.example .google-sheet-mcp.json
npm run google-mcp:init
```

Use OAuth (`--auth oauth` is the default in the script above). When prompted, paste your sheet URL or confirm spreadsheet ID `1CaqA6vOHV3gKwR9gitbYj6l-fZAcB9ue4s5PvgtAWBQ`.

Then:

```bash
npm run google-mcp:test
npm run google-mcp:list
```

Restart **Cursor** → **Settings → MCP** → ensure `google-mcp` is enabled and authenticated.

**Service account instead of OAuth:** run `npx google-mcp init` (no `--auth oauth`), download JSON from Google Cloud, save as `google-credentials.json`, share the sheet with the service account email as Editor.

Do not commit `.google-sheet-mcp.json` or credential JSON files (they are gitignored).

## Import cashflow CSV (local)

For the Evaluation Center–style export (columns: Expense, Category, Value in THB, Month, optional **IDR in column F**):

1. Add to `.env.local`:

   ```env
   IMPORT_SECRET="some-long-random-string"
   ```

2. Start the app: `npm run dev`

3. Dry run (validates rows, no DB writes):

   ```bash
   IMPORT_SECRET=your-secret DRY_RUN=1 npm run import:cashflow -- path/to/file.csv
   ```

4. Import:

   ```bash
   IMPORT_SECRET=your-secret npm run import:cashflow -- path/to/file.csv
   ```

Rules:

- If **column F (IDR)** is filled → amount stored as **IDR**.
- Otherwise **column D** is stored as **THB** (European decimals like `445,5`).
- Month labels like `August 2025` or `Agustus 2026` → transaction date **1st of that month**.
- Unknown expense categories (e.g. `Gym`) are **created automatically**.
- Endpoint: `POST /api/import/cashflow` with header `x-import-secret` (disabled in production unless `ALLOW_LOCAL_IMPORT=true`).

### Import investment log CSV (local)

Columns: Date, Name, Transaction Type, Currency, Lot Amount, **Transaction Value**, …, Category, **Platform**, Details.

```bash
IMPORT_SECRET=your-secret DRY_RUN=1 npm run import:investment-log -- path/to/investment-log.csv
IMPORT_SECRET=your-secret npm run import:investment-log -- path/to/investment-log.csv
```

Mapping:

- **Deposit** / **Return** (dividends, bond coupons) → portfolio `deposit` (idle cash).
- **Cash Out** → `draw`.
- **Buy** / **Sell** → trades with lots from **Lot Amount** and amount from **Transaction Value** in **Currency**.
- Category: Stocks → `stock`, P2P → `p2p`, Bond(s) → `obligasi`, Bitcoin → `crypto`.
- Unknown platforms (e.g. **Binance**) are created automatically.

Endpoint: `POST /api/import/investment-log` with header `x-import-secret`.

## Next steps

- Import CSV from your Google Sheet (or use `import:cashflow` above)
- Add transaction create/edit forms
- Charts on the dashboard (Recharts)
- Match category names to your spreadsheet tabs
