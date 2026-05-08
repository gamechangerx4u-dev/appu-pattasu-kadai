# Phase 2: Supabase Backend Integration & Admin CRUD

## Overview
This phase sets up Supabase (BaaS) for:
- Cloud database for products & categories
- Image storage via Supabase Storage
- Admin dashboard with protected routes
- Real-time product management

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In
- Go to [https://app.supabase.com](https://app.supabase.com)
- Sign in with GitHub or email

### 1.2 Create New Project
1. Click **"New Project"**
2. **Name**: `appu-crackers` (or your preference)
3. **Database Password**: Generate strong password (save securely)
4. **Region**: Choose closest to your users (e.g., Asia Pacific - Singapore)
5. Click **"Create New Project"** and wait 2-3 minutes

### 1.3 Get API Credentials
Once project is ready:
1. Go to **Settings → API** (left sidebar)
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Paste into `.env` file

```bash
# .env (at project root)
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

---

## Step 2: Create Database Tables

### 2.1 Create `categories` Table
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Paste:

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert existing categories
INSERT INTO categories (name) VALUES 
  ('Flower Pots'),
  ('Fountains'),
  ('Day Time'),
  ('Night Time'),
  ('Gift Boxes'),
  ('Sparklers');
```

4. Click **"Run"** (Ctrl+Enter)

### 2.2 Create `products` Table
Paste in a new query:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT, -- URL to image in Supabase Storage
  ourPrice DECIMAL(10, 2) NOT NULL,
  marketPrice DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert your existing products
INSERT INTO products (name, category, image, ourPrice, marketPrice) VALUES
  ('Peacock Silver – Shower Fountain', 'Fountains', 'https://www.sayeecrackers.com/wp-content/uploads/2023/11/4-peacock-silver-shower-fountain-1-piece-500x500.webp', 139, 150),
  ('Colour Koti – Ultra Big Flowerpot', 'Flower Pots', 'https://www.sayeecrackers.com/wp-content/uploads/2024/08/3colour-koti-10-pieces-700x700-1-500x500.webp', 193, 210);
  -- Add remaining products here...
```

5. Click **"Run"**

### 2.3 Set Row-Level Security (RLS)

**For public read access** (everyone can see products):

1. Go to **Authentication → Policies** (left sidebar)
2. Find `products` table → Click **"New Policy"**
3. Select **"Enable read access for all users"**
4. Click **"Review"** → **"Create Policy"**

Repeat for `categories` table.

---

## Step 3: Set Up Storage for Images

### 3.1 Create Storage Bucket
1. Go to **Storage** (left sidebar)
2. Click **"Create New Bucket"**
3. **Name**: `product-images`
4. **Privacy**: Public (so images load without auth)
5. Click **"Create Bucket"**

### 3.2 Upload Images
Later, we'll upload images via admin form. For now, this is ready.

---

## Step 4: Verify Frontend Connection

### 4.1 Test in Dev Server
The `.env` is already loaded. Run:

```bash
npm run dev
```

Open dev console (F12) → Check that **no errors** about Supabase appear.

### 4.2 Verify Data Loads
1. Go to `http://localhost:5173/`
2. If Supabase is connected, products load from database (not just local JSON)
3. If there's an error, check `.env` variables

---

## Step 5: Create Admin Route (Protected)

### 5.1 Create Admin Page
Create file: `src/pages/AdminPage.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../styles/AdminPage.css'; // We'll create this

const AdminPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const ADMIN_PASSWORD = 'admin123'; // ⚠️ TODO: Use Supabase Auth instead

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button onClick={handleLogin} style={{ padding: '0.5rem 1rem' }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Admin features coming in next commit */}
      <p>Admin CRUD features coming soon...</p>
    </div>
  );
};

export default AdminPage;
```

### 5.2 Add Route to App.jsx
Add this route (after checking for authentication):

```jsx
import AdminPage from './pages/AdminPage';

// Inside <Routes>:
<Route path="/admin" element={<AdminPage />} />
```

---

## Step 6: Deploy to Vercel (Hosting)

### 6.1 Prepare for Deployment
1. Ensure `.env` is in `.gitignore` (so secrets don't leak)
2. Commit code: `git add . && git commit -m "Phase 2: Supabase integration"`

### 6.2 Deploy to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Import Project"**
4. Select your GitHub repo
5. Click **"Import"**
6. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL=<your-url>`
   - `VITE_SUPABASE_ANON_KEY=<your-key>`
7. Click **"Deploy"**

Your live site is now at: `https://your-project.vercel.app`

---

## Checklist

- [ ] Supabase project created
- [ ] `.env` file populated with credentials
- [ ] `categories` table created with data
- [ ] `products` table created with data
- [ ] Storage bucket created for images
- [ ] RLS policies enabled for public read
- [ ] Dev server loads products from Supabase
- [ ] Admin route `/admin` protected
- [ ] `.env` added to `.gitignore`
- [ ] Deployed to Vercel
- [ ] Vercel env vars set
- [ ] Live site loads products correctly

---

## Troubleshooting

### Products don't load
- Check `.env` variables are correct
- Verify Supabase project is active
- Check browser console (F12) for CORS errors

### Can't connect to Supabase
- Open DevTools → Network tab
- Look for failed requests to `supabase.co`
- Verify RLS policies are set to "Enable read"

### Images won't display
- Ensure Storage bucket is **Public** (not private)
- Image URLs should start with: `https://<project-ref>.supabase.co/storage/v1/object/public/product-images/...`

---

## Next Steps (Phase 3)

1. **Admin CRUD**: Build forms to Create, Update, Delete products
2. **Image Upload**: Integrate Supabase Storage file upload
3. **Supabase Auth**: Replace password with email-based login
4. **Performance**: Add image optimization & lazy loading
5. **Tests**: Add automated tests for key flows
