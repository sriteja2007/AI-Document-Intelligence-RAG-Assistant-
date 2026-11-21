# AI Document Intelligence (RAG Assistant)

An intelligent document assistant where users can upload PDFs, ask questions, and receive AI-generated answers with accurate source citations.

## Tech Stack
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui) in `/frontend`
- **Backend**: FastAPI (Python) in `/backend`
- **Database & Storage**: Supabase (PostgreSQL, Auth, Storage, pgvector)
- **AI**: Google Gemini API (Embeddings and LLM responses)

---

## How to Run the Project

### 1. Windows (One-Click)
- **Start Backend**: Double-click `start-backend.bat`
  - Runs on `http://localhost:8000`
  - API Health Check: `http://localhost:8000/health`
  - Interactive API Docs: `http://localhost:8000/docs`
- **Start Frontend**: Double-click `start-frontend.bat`
  - Runs on `http://localhost:3000`

### 2. Mac / Linux (One-Click)
Make scripts executable and run:
```bash
chmod +x start-backend.sh start-frontend.sh
./start-backend.sh
./start-frontend.sh
```

---

## Environment Variables Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and fill in:
- `SUPABASE_URL`: Your Supabase Project URL
- `SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role secret key
- `SUPABASE_JWT_SECRET`: Supabase JWT secret
- `GEMINI_API_KEY`: Google Gemini API Key

### Frontend (`frontend/.env.local`)
Copy `frontend/.env.local.example` to `frontend/.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `NEXT_PUBLIC_API_URL`: Backend URL (defaults to `http://localhost:8000`)
