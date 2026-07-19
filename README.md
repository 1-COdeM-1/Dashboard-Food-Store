# Store Admin Dashboard

Premium e-commerce admin dashboard built with React 19, TypeScript, Vite, Tailwind CSS v4, and Supabase.

## Features

- Email/password admin login (Supabase Auth)
- Full Products CRUD with image upload to Storage
- Dark / light theme
- English / Arabic with full RTL support
- Overview analytics, settings, and responsive layout

## Setup

1. Copy `.env.example` to `.env` and set your Supabase credentials:

```env
VITE_SUPABASE_URL=https://irfovbxdujtccvztsfyb.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
```

2. Install and run:

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start development server
- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Storage bucket

Product images use the Supabase Storage bucket `products IMAGES` (matching the existing project bucket name).

If image uploads fail with a 400 / RLS error, run `supabase/storage-policies.sql` in the Supabase SQL Editor so authenticated admins can upload, update, and delete objects in that bucket.
