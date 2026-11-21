# Supabase Setup Guide: AI Document Intelligence (DocuMind)

This guide provides simple, step-by-step, click-by-click instructions to set up your Supabase database and file storage. **You do not need any coding knowledge to follow these steps.**

---

## What We Are Setting Up
1. **Database Tables & Vector Engine**: Creates tables for your documents, text chunks, conversations, and messages, plus AI vector similarity search (`pgvector`).
2. **Row-Level Security (RLS)**: Automatically ensures each user can only see, upload, and chat with their own private documents.
3. **Storage Bucket**: A private cloud folder named `documents` to securely store uploaded PDF, Word, and text files.

---

## Step 1: Open Your Supabase Project

1. Open your web browser and go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Log in with your Supabase account.
3. Click on your project (or click **"New Project"**, give it a name like `documind-rag`, set a database password, select your region, and wait about 1-2 minutes for it to finish setting up).

---

## Step 2: Run the Database Setup Script in SQL Editor

1. Look at the **left sidebar** in your Supabase dashboard.
2. Click on the **SQL Editor** icon (it looks like a small terminal with `>_` or SQL icon).
3. Click the green **"New query"** button near the top left (or select **"+ New"**).
4. Open the file [supabase/schema.sql](file:///h:/Projects/AI%20Document%20Intelligence%20(RAG%20Assistant)/supabase/schema.sql) in your project folder, or copy all of its text.
5. Paste the entire SQL script into the large code box in Supabase.
6. Click the green **"Run"** button in the bottom right corner (or press `Ctrl` + `Enter` on Windows).
7. Look at the bottom output pane:
   - You should see a green checkmark with the message: **`Success. No rows returned`**.
   *(Note: This script is safe to run multiple times without causing duplicate errors).*

---

## Step 3: Create the File Storage Bucket

1. In the **left sidebar**, click on the **Storage** icon (it looks like a storage container/bucket).
2. Click the **"New bucket"** button (or **"Create a new bucket"**).
3. In the pop-up window:
   - **Bucket name**: Type exactly `documents` (all lowercase, no spaces).
   - **Public bucket**: Leave this **OFF** (unchecked). Your documents must remain **Private** so that only authorized users can access their own files.
   - *(Optional)* File upload size limit: You can leave this blank or enter `50MB`.
   - *(Optional)* Allowed MIME types: You can leave this blank to accept all supported document types.
4. Click **"Save bucket"** (or **"Create bucket"**).
5. You will now see the `documents` bucket listed on the Storage page.

---

## Step 4: Enable Storage Security Policies

To allow logged-in users to safely upload, view, and delete their own files in the `documents` bucket:

1. Go back to the **SQL Editor** (`>_` icon on the left sidebar).
2. Click **"New query"**.
3. Copy and paste the following snippet:

```sql
-- Allow authenticated users to upload files into the documents bucket
create policy "Authenticated users can upload documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents' and auth.uid() = owner);

-- Allow authenticated users to view/download their own uploaded documents
create policy "Authenticated users can view own documents"
on storage.objects for select
to authenticated
using (bucket_id = 'documents' and auth.uid() = owner);

-- Allow authenticated users to delete their own uploaded documents
create policy "Authenticated users can delete own documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents' and auth.uid() = owner);
```

4. Click **"Run"**. You will see: **`Success. No rows returned`**.

---

## Step 5: Copy Your Supabase Keys to Your Environment Files

To connect your frontend and backend to Supabase:

1. In the **left sidebar**, click on the **Project Settings** icon (the gear `⚙` icon at the bottom of the menu).
2. Under "Configuration", click on **"API"** (or **"Data API"**).
3. You will see several values on this page:
   - **Project URL**: Copy this URL (e.g., `https://abcdefghijklm.supabase.co`).
   - **Project API Keys**:
     - **`anon` `public`**: Click "Reveal" or "Copy".
     - **`service_role` `secret`**: Click "Reveal" or "Copy" *(keep this secret; never share it publicly)*.
   - **JWT Secret**: Scroll down to the **"JWT Settings"** section and copy your **JWT Secret**.

4. Open your local project files in your code editor and fill in the values:

### File 1: `backend/.env`
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### File 2: `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Step 6: Quick Verification Checklist

You can verify that everything is configured correctly in under 60 seconds:

- [ ] **Tables Created**: Click **Table Editor** on the left menu. You should see four tables: `documents`, `chunks`, `conversations`, and `messages`.
- [ ] **Row Level Security (RLS) Active**: Next to each table name in the Table Editor, you should see an **"RLS"** badge indicating security is enabled.
- [ ] **Vector Extension Enabled**: Click **Database** -> **Extensions** on the left menu. Search for `vector` and confirm the toggle is green/enabled.
- [ ] **Storage Bucket Created**: Click **Storage** on the left menu. Confirm the `documents` bucket exists and is marked **Private**.
