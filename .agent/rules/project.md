# Project Rules: AI Document Intelligence

## Project Overview
**AI Document Intelligence** — a RAG (Retrieval-Augmented Generation) assistant where users upload PDFs and ask questions, and the AI answers with source citations.

## Tech Stack
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui) in the `/frontend` folder
- **Backend**: FastAPI (Python) in the `/backend` folder
- **Auth, Database, and File Storage**: Supabase
- **Vector Search**: pgvector inside Supabase
- **AI Embeddings and Answers**: Gemini API

## Permanent Rules
1. **Never hardcode secrets or API keys**: Always read them from `.env` files and provide `.env.example` files with empty values.
2. **Strict Type Safety**: Use Python type hints and Pydantic models in the backend. Use strict TypeScript in the frontend.
3. **Modularity**: Keep files small with one responsibility per file.
4. **User Communication**: The user has zero coding knowledge. After every task, provide:
   - (a) A plain-English summary of what changed.
   - (b) Exactly what the user must do manually, if anything.
   - (c) How to run and test it, with copy-paste commands.
5. **Autonomous Code Maintenance**: Never ask the user to edit code by hand. If something needs fixing, fix it directly.
6. **Self-Verification**: Run and test your own work before declaring it done, and fix any errors found.
7. **Phased Development**: Do not build features outside the current phase.
8. All UI must follow .agent/rules/design.md.
