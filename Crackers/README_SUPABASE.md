Supabase integration

This project includes a Supabase client scaffold at `src/lib/supabaseClient.js`.

Setup

1. Create a Supabase project at https://app.supabase.com
2. Create tables:
   - `products` with columns matching fields in `src/data/db.json` (id, name, category, image, ourPrice, marketPrice, etc.)
   - `categories` with a `name` column (text)
3. Create a storage bucket (e.g., `product-images`) and upload product images. Store image URLs in the `products.image` field.
4. In your frontend project, set environment variables in a `.env` file at the repo root:

VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>

5. Install new dependencies and start dev server:

```bash
npm install
npm run dev
```

Notes

- The app will fall back to `src/data/db.json` when Supabase env vars are not provided.
- For production, use environment vars available in your host (Vercel/Netlify) and keep the anon key secure.
