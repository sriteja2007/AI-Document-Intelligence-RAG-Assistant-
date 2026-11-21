import React from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6">
      <main className="max-w-2xl w-full text-center space-y-8 bg-white dark:bg-zinc-900 p-10 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Skeleton Setup Complete
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            RAG Assistant
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            AI-powered document intelligence. Upload PDFs, ask questions, and
            receive answers backed by precise source citations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Frontend
            </div>
            <div className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
              Next.js 16 + Tailwind
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Backend
            </div>
            <div className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
              FastAPI (Python)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Database & AI
            </div>
            <div className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
              Supabase + Gemini
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="w-full sm:w-auto">
            Ready for Next Phase
          </Button>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View API Documentation
            </Button>
          </a>
        </div>
      </main>

      <footer className="mt-8 text-xs text-zinc-500">
        AI Document Intelligence &bull; Project Skeleton Initialized
      </footer>
    </div>
  );
}
