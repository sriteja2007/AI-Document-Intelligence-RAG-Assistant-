"use client";

import React, { useState } from "react";
import { Copy, Check, Sparkles, Triangle } from "lucide-react";
import { ChatMessage, Citation } from "@/lib/mock-data";
import { CitationChip } from "./citation-chip";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCitationClick: (citation: Citation) => void;
  activeCitationId?: string;
  isStreaming?: boolean;
}

export function ChatMessageItem({
  message,
  onCitationClick,
  activeCitationId,
  isStreaming = false,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Formats text content:
   * - Splits into paragraphs and list items
   * - Replaces **bold** with <strong>
   * - Replaces [1], [2] with interactive CitationChip components
   */
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const rawContent = isBullet ? line.trim().slice(2) : line;
      const parts = rawContent.split(/(\[\d+\]|\*\*.*?\*\*)/g);

      const parsedLine = parts.map((part, partIdx) => {
        // Citation match: [1]
        const citationMatch = part.match(/^\[(\d+)\]$/);
        if (citationMatch && message.citations) {
          const indexNum = parseInt(citationMatch[1], 10);
          const matchedCitation = message.citations.find(
            (c) => c.citationIndex === indexNum
          );

          if (matchedCitation) {
            return (
              <CitationChip
                key={partIdx}
                citation={matchedCitation}
                onClick={onCitationClick}
                isActive={matchedCitation.id === activeCitationId}
              />
            );
          }
          return (
            <span key={partIdx} className="font-mono text-purple-600 dark:text-purple-400">
              [{indexNum}]
            </span>
          );
        }

        // Bold match: **text**
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={partIdx} className="font-bold text-zinc-950 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <span key={partIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-zinc-800 dark:text-zinc-200 my-1">
            {parsedLine}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="leading-relaxed text-zinc-800 dark:text-zinc-200 my-1">
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex items-start gap-3 sm:gap-4 group ${
        isAssistant ? "justify-start" : "justify-end"
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]">
          <Triangle className="w-3.5 h-3.5 fill-current rotate-90" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[88%] sm:max-w-2xl rounded-2xl p-4 sm:p-5 text-sm shadow-sm transition-all ${
          isAssistant
            ? "glass-panel border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-[#120e24]/70 text-zinc-900 dark:text-zinc-100"
            : "bg-purple-600 text-white rounded-tr-sm shadow-purple-950/20"
        }`}
      >
        {/* Assistant Header Actions (Copy Button) */}
        {isAssistant && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              DocuMind Grounded Answer
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
              title="Copy message"
              aria-label="Copy answer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-1">
          {renderFormattedText(message.content)}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-200 dark:bg-white/10 border border-zinc-300 dark:border-white/15 flex items-center justify-center text-zinc-800 dark:text-white font-semibold text-xs">
          AM
        </div>
      )}
    </div>
  );
}
