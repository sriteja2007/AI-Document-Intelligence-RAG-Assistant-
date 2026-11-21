"use client";

import React from "react";
import { Citation } from "@/lib/mock-data";

interface CitationChipProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
  isActive?: boolean;
}

export function CitationChip({ citation, onClick, isActive }: CitationChipProps) {
  // Shorten document name if too long
  const shortDocName =
    citation.documentName.length > 18
      ? citation.documentName.slice(0, 15) + "…"
      : citation.documentName;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(citation);
      }}
      className={`citation-chip inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 mx-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-purple-500/30 text-purple-200 border-purple-400 ring-2 ring-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          : "bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-400/50"
      }`}
      title={`Click to view source in ${citation.documentName} (Page ${citation.pageNumber})`}
    >
      <span className="font-bold text-purple-200 font-mono text-[10px] px-1 rounded bg-purple-500/30">
        [{citation.citationIndex}]
      </span>
      <span className="truncate max-w-[140px] text-zinc-200">
        {shortDocName}
      </span>
      <span className="text-zinc-400">&bull;</span>
      <span className="font-mono text-purple-300">p.{citation.pageNumber}</span>
    </button>
  );
}
