# Appu Pattasu Kadai - Supabase Setup Instructions

## 📋 Overview
This document contains step-by-step instructions to set up the Supabase backend for the Appu Pattasu Kadai (Crackers) e-commerce platform. Please follow all steps carefully.

**Estimated Time**: 15-20 minutes

---

## ✅ Prerequisites
- A Supabase account (free tier is sufficient)
- Access to the `.env` file in the project (located at `/Crackers/.env`)
- Admin access to the GitHub/email used for Supabase login

---

## 📌 Step 1: Create a Supabase Project

### 1.1 Sign Up / Log In to Supabase
1. Go to **[https://app.supabase.com](https://app.supabase.com)**
2. Sign in with:
   - **GitHub** (recommended), OR
   - **Email** (create account if needed)

### 1.2 Create a New Project
1. Click **"New Project"** button (top right or home screen)
2. Fill in the project details:
   - **Project Name**: `appu-crackers` (or your preference)
   - **Database Password**: Generate a **strong password** and save it securely (you'll need it)
   - **Region**: Select the closest region to your users
     - **Recommended**: Asia Pacific - Singapore (for India-based users)
     - **Alternative**: Asia Pacific - Tokyo
3. Click **"Create New Project"** button
4. **Wait 2-3 minutes** for the project to initialize (you'll see a loading spinner)

### 1.3 Get API Credentials
Once the project is ready:
1. In the left sidebar, click **Settings** (gear icon)
2. Go to **API** tab
3. You'll see:
   - **Project URL** (under "Project API keys" section)
   - **anon public** key (under "Project API keys" section)

**Copy these two values**—you'll need them in Step 4.

---

## 🗄️ Step 2: Create Database Tables

### 2.1 Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **"New Query"** button

### 2.2 Create `categories` Table
Copy and paste this SQL query into the editor:

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO categories (name) VALUES 
  ('Flower Pots'),
  ('Fountains'),
  ('Day Time'),
  ('Night Time'),
  ('Gift Boxes'),
  ('Sparklers');
```

Click **"Run"** button (or press `Ctrl+Enter`)

**Expected**: You'll see a success message. The `categories` table is now created with initial data.

### 2.3 Create `products` Table
1. Click **"New Query"** button (create another query)
2. Copy and paste this SQL query:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  ourPrice DECIMAL(10, 2) NOT NULL,
  marketPrice DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, category, image, ourPrice, marketPrice) VALUES
  ('Peacock Silver – Shower Fountain', 'Fountains', 'https://www.sayeecrackers.com/wp-content/uploads/2023/11/4-peacock-silver-shower-fountain-1-piece-500x500.webp', 139, 150),
  ('Colour Koti – Ultra Big Flowerpot', 'Flower Pots', 'https://www.sayeecrackers.com/wp-content/uploads/2024/08/3colour-koti-10-pieces-700x700-1-500x500.webp', 193, 210),
  ('Magic Wand – Day Time Cracker', 'Day Time', 'https://example.com/magic-wand.jpg', 45, 60),
  ('Bomb Burst – Night Time Cracker', 'Night Time', 'https://example.com/bomb-burst.jpg', 89, 120),
  ('Premium Gift Box – Silver', 'Gift Boxes', 'https://example.com/gift-box-silver.jpg', 250, 350),
  ('Silver Sparkler – 50 Pieces', 'Sparklers', 'https://example.com/sparkler-silver.jpg', 199, 280);
```

Click **"Run"** button.

**Expected**: You'll see a success message. The `products` table is now created with sample data.

---

## 🔒 Step 3: Set Row-Level Security (RLS) Policies

Row-Level Security allows public read access while protecting write operations.

### 3.1 Enable RLS on `products` Table
1. In the left sidebar, click **Authentication** → **Policies**
2. Find the **`products`** table in the list
3. Click **"New Policy"** button
4. Select **"Enable read access for all users"**
5. Click **"Review"** → **"Create Policy"**

### 3.2 Enable RLS on `categories` Table
1. Still in **Authentication** → **Policies**
2. Find the **`categories`** table
3. Click **"New Policy"** button
4. Select **"Enable read access for all users"**
5. Click **"Review"** → **"Create Policy"**

**Expected**: Both tables now allow public read access. Writes are restricted (protected).

---

## 🖼️ Step 4: Create Storage Bucket for Images (Optional - Phase 2.5)

This is optional for now but needed when you implement image uploads in the admin panel.

1. In the left sidebar, click **Storage**
2. Click **"Create a new bucket"** button
3. **Bucket name**: `product-images`
4. **Privacy**: Select **"Public"** (so images load without authentication)
5. Click **"Create bucket"**

---

## 🔑 Step 5: Update Environment Variables

Now you need to add the Supabase credentials to your project's `.env` file.

### 5.1 Open the `.env` File
1. Navigate to `/Users/vaaheesan/GameChanger/appu-pattasu-kadai/Crackers/`
2. Open the file named `.env` (create it if it doesn't exist)

**Note**: If `.env` doesn't exist, copy from `.env.example`:
```bash
cp .env.example .env
```

### 5.2 Add Supabase Credentials
Add these lines to your `.env` file (replace with your actual values from Step 1.3):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Password (temporary - for Phase 2.5 authentication)
VITE_ADMIN_PASSWORD=admin123
```

### 5.3 Where to Find Your Credentials
- **VITE_SUPABASE_URL**: From Supabase Dashboard → Settings → API → "Project URL"
- **VITE_SUPABASE_ANON_KEY**: From Supabase Dashboard → Settings → API → "anon public" key

**⚠️ Important**: Do NOT commit `.env` to Git. It's already in `.gitignore`.

---

## ✅ Step 6: Verify the Setup

### 6.1 Test the Connection
1. In your terminal, navigate to the project:
   ```bash
   cd /Users/vaaheesan/GameChanger/appu-pattasu-kadai/Crackers
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open the app in your browser: **http://localhost:5173**

4. Visit the **Admin Page** at **http://localhost:5173/admin**
   - Enter password: `admin123`
   - You should see "Admin Dashboard" with "Current Products: 6" (the sample data we inserted)

### 6.2 Check Supabase Dashboard
1. Go back to **[https://app.supabase.com](https://app.supabase.com)**
2. Navigate to **SQL Editor** → **Tables**
3. Verify both tables exist:
   - ✅ `categories` (6 rows)
   - ✅ `products` (6 rows)

---

## 🎯 What's Next?

Once this setup is complete, the team can:

1. **View products from Supabase** — Products now load from the cloud database
2. **Implement Admin CRUD** — Add/Edit/Delete products in the admin panel
3. **Upload images to Supabase Storage** — Store product images in the cloud
4. **Deploy to Vercel** — Push the app live with backend support

---

## 🆘 Troubleshooting

### Issue: "Invalid API Key" error
- **Solution**: Double-check that you copied the credentials correctly from Supabase Settings → API
- Ensure there are no extra spaces or typos in the `.env` file

### Issue: Admin page shows no products
- **Solution**: 
  1. Verify `.env` file has the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  2. Refresh the page (`Cmd+R`)
  3. Check browser console (F12) for error messages

### Issue: Table creation failed
- **Solution**: 
  1. Verify the SQL syntax is correct (copy-paste exactly from above)
  2. Run each query separately
  3. Check Supabase dashboard for error messages

### Issue: Can't find API credentials
- **Solution**: 
  1. Make sure your Supabase project is fully initialized (wait 2-3 minutes)
  2. Go to Settings (gear icon) → API tab
  3. Look for "Project API keys" section with URL and anon key

---

## 📞 Support

If you encounter issues, check:
1. **Supabase Status**: https://status.supabase.com
2. **Supabase Docs**: https://supabase.com/docs
3. **Project README**: `/Crackers/README.md`
4. **Architecture Doc**: `/Crackers/ARCHITECTURE.md`

---

**Setup completed successfully!** ✨ The Supabase backend is now ready for development.
