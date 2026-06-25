# Finance Tracker — Setup Guide

Personal income & expense tracker built with Next.js 15, Supabase, and TypeScript.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is enough)
- A [Vercel](https://vercel.com) account (optional, for deployment)

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Project URL** and **Anon Key** from:
   - Settings → API → Project URL
   - Settings → API → Project API keys → `anon public`
3. Go to **SQL Editor** and run the full contents of `supabase/migration.sql`
4. Done — RLS policies are included in the migration.

---

## Step 2 — Local Development

```bash
# Clone or unzip the project
cd finance-tracker

# Install dependencies
npm install

# Create your env file
cp .env.local.example .env.local

# Fill in your Supabase credentials in .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 3 — Create Your Account

1. Go to `/signup` and create your account
2. Check your email and click the confirmation link
3. Sign in at `/login`

---

## Step 4 — Seed Your Categories

After signing in, get your User ID from:
**Supabase Dashboard → Authentication → Users → copy your UUID**

Then go to **SQL Editor** and run the seed block at the bottom of `supabase/migration.sql`:
- Uncomment the `insert into public.categories` block
- Replace `<YOUR_USER_ID>` with your UUID
- Run it

All 22 default categories will appear in your dropdowns immediately.

---

## Step 5 — Deploy to Vercel (optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect via GitHub:
# 1. Push to GitHub
# 2. Import at vercel.com
# 3. Add env vars in Vercel dashboard:
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Recommended First-Use Flow

| Step | Action                  |
|------|-------------------------|
| 1    | Create account + seed categories |
| 2    | Go to **Budgets** → set budgets for current month |
| 3    | Go to **Transactions** → add your first transactions |
| 4    | Go to **Dashboard** → see your overview |

---

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── (auth)/        # Login + Signup (no sidebar)
│   └── (app)/         # Dashboard, Transactions, Categories, Budgets
├── components/         # UI components
│   ├── ui/            # Button, Modal, ConfirmDialog
│   ├── layout/        # Sidebar
│   ├── dashboard/     # MonthSelector, BudgetSummaryTable
│   ├── transactions/  # TransactionTableClient, TransactionFilters
│   ├── categories/    # CategoriesClient
│   └── budgets/       # BudgetsClient
├── data/              # Server-side DB access (categories, transactions, budgets, summary)
├── lib/               # Supabase clients + utils (currency, date)
└── types/             # TypeScript types
```

---

## Formula Reference

These match your Excel exactly:

| Value | Formula |
|---|---|
| Total Income | Sum of all Income transactions for selected month |
| Total Expense | Sum of all Expense transactions for selected month |
| Total Remaining | Total Income − Total Expense |
| Total Allocated Budget | Sum of all category budgets for selected month |
| Buffer | Total Income − Total Allocated Budget |
| Spent (per category) | Sum of Expense transactions for that category in selected month |
| Remaining (per category) | Allocated Budget − Spent |
| Used % | (Spent ÷ Allocated Budget) × 100 |
