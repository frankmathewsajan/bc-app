# 🔐 Supabase Authentication Setup

## Quick Start

### 1. Get Supabase Credentials
Go to your Supabase project dashboard:
- URL: `https://app.supabase.com`
- Navigate to: **Settings** → **API**
- Copy your:
  - **Project URL** (e.g., `https://xxxxx.supabase.co`)
  - **Anon Public Key** (starts with `eyJ...`)

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Then add your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Enable Email Authentication in Supabase

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure **Redirect URLs**:
   - Add `beingcosmic://login-success` to the allowed redirect URLs
   - For web testing, also add `http://localhost:8081/login-success`
4. Configure email templates (optional)
5. Set **Site URL** to your app URL

### 4. Test Authentication

Run your app:
```bash
npm start
```

Try creating an account - you should receive a verification email!

## Features Implemented

✅ **Login** - Email/password authentication  
✅ **Signup** - User registration with email verification  
✅ **Email Verification Success Page** - Beautiful UI with animations  
✅ **Deep Linking** - Redirects to app after email verification  
✅ **AsyncStorage** - Session persistence (stay logged in)  
✅ **Error Handling** - User-friendly error messages  
✅ **3D Background** - Enhanced with bigger, faster-moving planets

## Email Verification Flow

1. User signs up → Email sent with verification link
2. User clicks link in email → Opens app via deep link (`beingcosmic://login-success`)
3. App shows success page with animations
4. User can continue to app or return to login

**Deep Link Scheme:** `beingcosmic://`  
**Success Route:** `/login-success`  

## Database Schema (Optional)

To store user profiles, create a `profiles` table:

```sql
-- Run this in Supabase SQL Editor
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

## Troubleshooting

**"Invalid API key" error?**
- Double-check your `.env` file has the correct URL and key
- Make sure you're using `EXPO_PUBLIC_` prefix
- Restart the dev server after changing `.env`

**Email not sending?**
- Check Supabase email settings
- For development, check the Supabase Auth logs
- Email verification is automatic in production

**Session not persisting?**
- AsyncStorage is configured automatically
- Check that `@react-native-async-storage/async-storage` is installed

## Next Steps

🔹 Add password reset functionality  
🔹 Add social login (Google, Apple)  
🔹 Add user profile management  
🔹 Add protected routes  
🔹 Add session refresh logic  

---

**Need help?** Share your Supabase credentials and I'll help you configure everything!
