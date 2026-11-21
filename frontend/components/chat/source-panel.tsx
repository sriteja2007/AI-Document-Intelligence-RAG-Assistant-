"use client";

import React from "react";
import { X, FileText, BookmarkCheck, ExternalLink, Sparkles } from "lucide-react";
import { Citation } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SourcePanelProps {
  citation: Citation | null;
  onClose: () => void;
}

export function SourcePanel({ citation, onClose }: SourcePanelProps) {
  if (!citation) return null;

  return (
    <aside className="w-full md:w-80 lg:w-96 glass-panel border-l border-zinc-200 dark:border-white/10 flex flex-col h-full bg-white/95 dark:bg-[#0d0a1a]/95 backdrop-blur-2xl shadow-2xl z-30 transition-all text-zinc-900 dark:text-white">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
            [{citation.citationIndex}]
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
            Source Grounding
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Close source panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* Document Metadata Card */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                  {citation.documentName}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  Document ID: {citation.documentId}
                </div>
              </div>
            </div>

            <Badge
              variant="outline"
              className="bg-purple-500/15 text-purple-700 dark:text-purple-200 border-purple-500/30 text-xs font-mono"
            >
              Page {citation.pageNumber}
            </Badge>
          </div>

          {citation.relevanceScore && (
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-white/10 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                Confidence match:
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {Math.round(citation.relevanceScore * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Highlighted Excerpt Section */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Verified Document Excerpt
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-black/60 border border-purple-200 dark:border-purple-500/20 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-2 relative shadow-inner">
            <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400/80 uppercase">
              Chunk context from page {citation.pageNumber}:
            </div>
            <p className="border-l-2 border-purple-500 pl-3 italic text-zinc-800 dark:text-zinc-200">
              &ldquo;
              <mark className="bg-purple-500/20 dark:bg-purple-500/30 text-purple-900 dark:text-purple-100 px-1 py-0.5 rounded border border-purple-400/40 not-italic font-medium">
                {citation.excerpt}
              </mark>
              &rdquo;
            </p>
          </div>
        </div>

        {/* Info callout */}
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <span className="font-semibold text-purple-700 dark:text-purple-300 block mb-0.5">
            Grounded Attribution:
          </span>
          The AI model retrieved this exact paragraph chunk from Supabase
          pgvector to compose the highlighted statement.
        </div>
      </div>

      {/* Panel Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            alert(`Opening original PDF viewer at page ${citation.pageNumber}...`);
          }}
          className="w-full rounded-xl border-zinc-300 dark:border-white/15 bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-white text-xs h-9"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          Jump to Page {citation.pageNumber} in Document Viewer
        </Button>
      </div>
    </aside>
  );
}
