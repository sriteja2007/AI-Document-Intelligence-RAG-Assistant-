"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { ConversationItem } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  conversations: ConversationItem[];
  activeId?: string;
  onSelectConversation?: (id: string) => void;
  onNewChat: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  isCollapsed = false,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [convList, setConvList] = useState<ConversationItem[]>(conversations);

  // Group conversations by Today, Yesterday, Previous 7 days
  const filtered = convList.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayConvs = filtered.filter((c) =>
    c.lastMessageAt.includes("ago") || c.lastMessageAt.includes("minute") || c.lastMessageAt.includes("hour")
  );
  const yesterdayConvs = filtered.filter((c) =>
    c.lastMessageAt.toLowerCase().includes("yesterday")
  );
  const olderConvs = filtered.filter(
    (c) => !todayConvs.includes(c) && !yesterdayConvs.includes(c)
  );

  const handleRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditedTitle(currentTitle);
  };

  const saveRename = (id: string) => {
    if (editedTitle.trim()) {
      setConvList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editedTitle.trim() } : c))
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setConvList((prev) => prev.filter((c) => c.id !== id));
  };

  const renderConversationGroup = (title: string, items: ConversationItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 py-1">
          {title}
        </div>
        {items.map((conv) => {
          const isActive = conv.id === activeId;
          const isEditing = editingId === conv.id;

          return (
            <div
              key={conv.id}
              className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                isActive
                  ? "bg-purple-600/15 dark:bg-purple-600/20 text-purple-900 dark:text-white border border-purple-500/30"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white border border-transparent"
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5 w-full">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(conv.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="h-7 text-xs bg-white dark:bg-black/60 border-purple-500/50 py-0 text-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={() => saveRename(conv.id)}
                    className="text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white font-bold"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <Link
                  href={`/chat/${conv.id}`}
                  onClick={() => onSelectConversation?.(conv.id)}
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <MessageSquare
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? "text-purple-600 dark:text-purple-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  <span className="truncate font-medium">{conv.title}</span>
                </Link>
              )}

              {/* Action Dropdown Menu */}
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-opacity"
                        aria-label="Conversation options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent
                    className="glass-panel w-36 border-zinc-200 dark:border-white/10 text-xs bg-white/95 dark:bg-[#120e24]/95 text-zinc-900 dark:text-white"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={() => handleRename(conv.id, conv.title)}
                      className="cursor-pointer gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(conv.id)}
                      className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 glass-panel border-r border-zinc-200 dark:border-white/10 flex flex-col items-center py-4 space-y-4 bg-white/80 dark:bg-[#0d0a17]/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNewChat}
          className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all shadow-md shadow-purple-950/40"
          title="New chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 sm:w-80 glass-panel border-r border-zinc-200 dark:border-white/10 flex flex-col h-full bg-white/90 dark:bg-[#0d0a17]/80 backdrop-blur-xl transition-all select-none">
      {/* Top Header: New Chat Button + Collapse Toggle */}
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={onNewChat}
            className="flex-1 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors hidden md:flex"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs rounded-lg bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-purple-500/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Conversations Feed */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            No conversations match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <>
            {renderConversationGroup("Today", todayConvs)}
            {renderConversationGroup("Yesterday", yesterdayConvs)}
            {renderConversationGroup("Previous 7 days", olderConvs)}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-200 dark:border-white/10 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          RAG Chat Engine
        </span>
        <span className="text-[10px] font-mono text-zinc-400">Gemini 2.5</span>
      </div>
    </aside>
  );
}
