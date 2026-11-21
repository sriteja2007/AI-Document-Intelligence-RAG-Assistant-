"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Send,
  Sparkles,
  FileText,
  Menu,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessageItem } from "@/components/chat/chat-message-item";
import { SourcePanel } from "@/components/chat/source-panel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  MOCK_CONVERSATIONS,
  MOCK_CHAT_MESSAGES,
  MOCK_DOCUMENTS,
  ChatMessage,
  Citation,
} from "@/lib/mock-data";

function ChatConversationContent() {
  const params = useParams();
  const conversationId = (params?.conversationId as string) || "conv-1";

  // Data state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string>("all");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Layout UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize messages based on active conversation
  useEffect(() => {
    if (conversationId === "new") {
      setMessages([]);
    } else {
      setMessages(MOCK_CHAT_MESSAGES);
    }
    setActiveCitation(null);
  }, [conversationId]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Handle fake streamed response
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    // Simulate AI thinking then streaming
    setIsStreaming(true);

    const sampleStreamResponse =
      "Based on the indexed documents, consolidated quarterly net revenue reached **$142.8 million** for Q3 2026, representing a **19.4% year-over-year expansion** [1].\n\nRecurring software subscriptions (ARR) contributed **$108.2 million** with a retention benchmark of **121%** across enterprise segments [2]. All data points are strictly grounded in the uploaded reports.";

    const sampleCitations: Citation[] = [
      {
        id: `cit-${Date.now()}-1`,
        citationIndex: 1,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 4,
        excerpt:
          "Consolidated quarterly net revenue totaled $142.8M for the three months ended September 30, 2026, an expansion of 19.4% compared to $119.6M in Q3 2025.",
        relevanceScore: 0.96,
      },
      {
        id: `cit-${Date.now()}-2`,
        citationIndex: 2,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 7,
        excerpt:
          "Annual Recurring Revenue (ARR) closed at $108.2M, driven by rapid cloud tier expansions and an enterprise net retention rate of 121%.",
        relevanceScore: 0.94,
      },
    ];

    const words = sampleStreamResponse.split(" ");
    let currentWordIndex = 0;

    const assistantMsgId = `msg-reply-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      conversationId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    const interval = setInterval(() => {
      currentWordIndex++;
      const partialText = words.slice(0, currentWordIndex).join(" ");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: partialText } : m
        )
      );

      if (currentWordIndex >= words.length) {
        clearInterval(interval);
        setIsStreaming(false);
        // Attach citations upon completion
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, citations: sampleCitations } : m
          )
        );
      }
    }, 35);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What was the total net revenue and ARR expansion reported in Q3 2026?",
    "How does the multi-agent coordinator persist snapshot states across vector memory?",
    "What are the cryptographic key rotation rules specified in the SOC2 compliance audit?",
  ];

  return (
    <PageLayout
      variant="app"
      user={{
        name: "Alex Mercer",
        email: "alex.mercer@enterprise.io",
      }}
    >
      <div className="flex-1 flex h-[calc(100dvh-4rem)] overflow-hidden relative">
        {/* DESKTOP LEFT SIDEBAR */}
        <div className="hidden md:flex h-full flex-shrink-0">
          <ChatSidebar
            conversations={MOCK_CONVERSATIONS}
            activeId={conversationId}
            onNewChat={() => {
              setMessages([]);
            }}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* MOBILE SLIDE-OUT DRAWER */}
        <div className="md:hidden">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent
              side="left"
              className="p-0 border-r border-zinc-200 dark:border-white/10 w-72 bg-white dark:bg-[#0d0a17]"
            >
              <ChatSidebar
                conversations={MOCK_CONVERSATIONS}
                activeId={conversationId}
                onSelectConversation={() => setMobileSidebarOpen(false)}
                onNewChat={() => {
                  setMessages([]);
                  setMobileSidebarOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-zinc-50/50 dark:bg-black/20">
          {/* Chat Header Bar */}
          <div className="h-14 flex-shrink-0 px-4 sm:px-6 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-white/80 dark:bg-[#0d0a17]/80 backdrop-blur-md select-none z-10">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Trigger */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  {conversationId === "new"
                    ? "New Grounded Chat"
                    : MOCK_CONVERSATIONS.find((c) => c.id === conversationId)?.title ||
                      "DocuMind Assistant"}
                </span>
              </div>
            </div>

            {/* Document Filter Context Badge in Header */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 hidden sm:inline" />
              <span className="hidden sm:inline">Scope:</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                {selectedDocument === "all"
                  ? "All Documents"
                  : MOCK_DOCUMENTS.find((d) => d.id === selectedDocument)?.name ||
                    "Selected Document"}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {messages.length === 0 ? (
              /* Friendly Empty State with 3 Suggested Questions */
              <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 py-12">
                <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)]">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    What would you like to know from your documents?
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Ask natural language questions. Every answer will cite exact
                    page numbers and verified text excerpts.
                  </p>
                </div>

                {/* 3 Suggested Questions */}
                <div className="w-full space-y-2.5 pt-2 text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                    Suggested Inquiries:
                  </div>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left p-3.5 rounded-2xl glass-card hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 hover:border-purple-500/40 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-between group active:scale-[0.99] bg-white dark:bg-white/5"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Bubbles */
              <>
                {messages.map((msg, i) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    onCitationClick={(cit) => setActiveCitation(cit)}
                    activeCitationId={activeCitation?.id}
                    isStreaming={isStreaming && i === messages.length - 1}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* MESSAGE INPUT AT THE BOTTOM (Pinned Composer) */}
          <div className="p-4 sm:p-5 flex-shrink-0 border-t border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#0d0a17]/90 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto space-y-2.5">
              {/* Document Filter Dropdown near input */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium hidden sm:inline">
                    Query Context:
                  </span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      className="h-7 pl-2.5 pr-7 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/15 text-zinc-900 dark:text-zinc-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/40 cursor-pointer appearance-none"
                    >
                      <option value="all" className="bg-white dark:bg-[#120e24] text-zinc-900 dark:text-white">
                        All documents (6 indexed)
                      </option>
                      {MOCK_DOCUMENTS.map((doc) => (
                        <option
                          key={doc.id}
                          value={doc.id}
                          className="bg-white dark:bg-[#120e24] text-zinc-900 dark:text-white"
                        >
                          {doc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 hidden sm:block">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-mono">Shift+Enter</kbd> for new line
                </div>
              </div>

              {/* Textarea Input + Conic-Gradient Send Button */}
              <div className="relative rounded-2xl glass-card border border-zinc-300 dark:border-white/15 p-2 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-lg flex items-end gap-2 bg-white dark:bg-black/40">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none resize-none px-3 py-1.5 max-h-32"
                />

                {/* Send Button with Conic-Gradient Animation Style */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isStreaming}
                  className="relative p-[1px] overflow-hidden rounded-xl group transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                  aria-label="Send message"
                >
                  <span className="absolute inset-[-200%] animate-border-rotate bg-[conic-gradient(from_0deg,#ea580c_0%,#f59e0b_25%,#fbbf24_50%,#f97316_75%,#ea580c_100%)] opacity-85 group-hover:opacity-100 transition-opacity" />
                  <span className="relative px-3.5 py-2 rounded-[11px] bg-zinc-950 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm">
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Send</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT-SIDE SOURCE CITATION INSPECTION PANEL */}
        {activeCitation && (
          <SourcePanel
            citation={activeCitation}
            onClose={() => setActiveCitation(null)}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default function ChatConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen app-bg flex items-center justify-center text-zinc-400">
          Loading conversation...
        </div>
      }
    >
      <ChatConversationContent />
    </Suspense>
  );
}
