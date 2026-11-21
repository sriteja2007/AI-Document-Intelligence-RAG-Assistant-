"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  UploadCloud,
  MessageSquareText,
  BookmarkCheck,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  SplitSquareVertical,
  CheckCircle2,
  FileText,
  HelpCircle,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { GradientButton } from "@/components/gradient-button";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <PageLayout variant="landing">
      {/* 1. HERO SECTION */}
      <section
        id="home"
        className="min-h-[calc(100vh-4rem)] flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Pill Tag with glowing purple live dot */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold glass-pill border-purple-500/30 text-purple-200 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
              </span>
              <span>RAG Engine Now Live</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-md leading-[1.08]">
                Ask your documents anything.
              </h1>
              <p className="text-lg sm:text-xl text-zinc-200 max-w-xl font-normal leading-relaxed drop-shadow-sm">
                Upload your PDFs and get instant answers with exact page citations.
                Powered by AI, grounded only in your documents.
              </p>
            </div>

            {/* CTA Buttons: Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/signup" className="w-full sm:w-auto">
                <GradientButton size="lg" className="w-full sm:w-auto">
                  Upload & Ask
                </GradientButton>
              </Link>

              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="h-12 px-7 rounded-2xl glass-pill hover:bg-white/10 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] border-white/20 backdrop-blur-xl shadow-lg w-full sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current text-zinc-300" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats Row: Stack on mobile, horizontal row with thin divider on desktop */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12">
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  128,450+
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-400 mt-0.5">
                  Documents Indexed
                </div>
              </div>

              <div className="hidden sm:block h-10 w-[1px] bg-white/15" />

              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  1,420,000+
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-400 mt-0.5">
                  Questions Answered
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Citation Grounding Preview Card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <GlassCard variant="glow" className="space-y-5 border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-black/60">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    Live Grounding Engine
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[11px]"
                >
                  Grounded Citation
                </Badge>
              </div>

              {/* Sample User Question */}
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Question
                </div>
                <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-200 font-medium">
                  &ldquo;What were our gross margins and ARR expansion in Q3?&rdquo;
                </p>
              </div>

              {/* AI Answer with Citation Chips */}
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-black/50 border border-purple-200 dark:border-purple-500/20 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  DocuMind Synthesized Answer
                </div>
                <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  Annual Recurring Revenue reached <strong>$108.2M</strong> with
                  a net retention of 121%{" "}
                  <span
                    className="citation-chip cursor-pointer"
                    title="Source: Q3_Fiscal_Performance.pdf, Page 7"
                  >
                    [1] p.7
                  </span>
                  , while North American gross margins expanded to <strong>24.3%</strong>{" "}
                  <span
                    className="citation-chip cursor-pointer"
                    title="Source: Q3_Fiscal_Performance.pdf, Page 4"
                  >
                    [2] p.4
                  </span>
                  .
                </p>
              </div>

              {/* Verified Sources Pill List */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Referenced Sources (Supabase pgvector)
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-300">
                    <span className="truncate flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Q3_Fiscal_Performance.pdf (Page 7)
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      94% match
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-300">
                    <span className="truncate flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Q3_Fiscal_Performance.pdf (Page 4)
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      96% match
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-200/50 dark:border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold glass-pill border-purple-500/30 text-purple-700 dark:text-purple-200 uppercase tracking-widest">
            Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            How DocuMind Works
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed">
            Three streamlined steps to turn dense corporate documents, research
            papers, and contracts into instant answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <GlassCard variant="glow" className="space-y-4 flex flex-col justify-between border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-lg">
                <UploadCloud className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase font-semibold text-purple-600 dark:text-purple-400 tracking-wider">
                  Step 01
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Upload PDFs</h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                  Drag and drop your PDFs. Documents are securely parsed with
                  PyMuPDF, chunked, and vectorized via Supabase pgvector.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Automatic schema isolation
            </div>
          </GlassCard>

          {/* Step 2 */}
          <GlassCard variant="glow" className="space-y-4 flex flex-col justify-between border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-300 font-bold text-lg">
                <MessageSquareText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase font-semibold text-amber-600 dark:text-amber-400 tracking-wider">
                  Step 02
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Ask Anything</h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                  Ask natural language questions across one file or entire document
                  collections. Query multiple topics simultaneously.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Gemini conversational reasoning
            </div>
          </GlassCard>

          {/* Step 3 */}
          <GlassCard variant="glow" className="space-y-4 flex flex-col justify-between border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold text-lg">
                <BookmarkCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  Step 03
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Get Cited Answers</h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                  Receive answers backed by clickable source citations with exact
                  page numbers and original excerpt verification.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              100% grounded against hallucinations
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 3. FEATURES SECTION (6 Glass Cards) */}
      <section
        id="features"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 border-t border-zinc-200/50 dark:border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold glass-pill border-purple-500/30 text-purple-700 dark:text-purple-200 uppercase tracking-widest">
            Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Designed for Absolute Accuracy
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed">
            Enterprise document intelligence built from the ground up for strict
            grounding and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <BookmarkCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Precise Page Citations</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Every sentence the model delivers is linked to specific page numbers
              and extracted text chips, preventing hallucinated answers.
            </p>
          </GlassCard>

          {/* Feature 2 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">pgvector Semantic Search</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              High-performance vector similarity search directly inside Supabase
              PostgreSQL for low-latency context retrieval.
            </p>
          </GlassCard>

          {/* Feature 3 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Gemini API Intelligence</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Leverages cutting-edge Google Gemini models for deep multi-page
              comprehension, synthesis, and accurate reasoning.
            </p>
          </GlassCard>

          {/* Feature 4 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Enterprise Privacy &amp; RLS</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Documents and vector embeddings are secured with Supabase Row-Level
              Security (RLS). Your data is never shared across tenants.
            </p>
          </GlassCard>

          {/* Feature 5 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Real-Time Ingestion</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Background parsing with live status badges (processing, ready,
              failed). Indexed files are immediately available for query.
            </p>
          </GlassCard>

          {/* Feature 6 */}
          <GlassCard variant="glow" className="space-y-3 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
              <SplitSquareVertical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Side-by-Side Verification</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Clicking any citation navigates straight to the document viewer,
              highlighting the exact excerpt on the original page.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section
        id="faq"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 pb-28 border-t border-zinc-200/50 dark:border-white/10"
      >
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold glass-pill border-purple-500/30 text-purple-700 dark:text-purple-200 uppercase tracking-widest">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed">
            Everything you need to know about DocuMind&apos;s architecture and safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <GlassCard className="space-y-2.5 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              How does DocuMind prevent hallucinations?
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              DocuMind forces the model to answer exclusively from chunks
              retrieved via vector search. Every fact must be attributed to an
              exact source page and excerpt.
            </p>
          </GlassCard>

          <GlassCard className="space-y-2.5 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              What file formats are supported?
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Currently PDF documents (including scanned documents, financial
              statements, and research whitepapers) are natively supported, with
              Word (.docx) support integrated in the backend.
            </p>
          </GlassCard>

          <GlassCard className="space-y-2.5 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Is my document data private?
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Yes. All files are stored in your private Supabase storage bucket
              with Row-Level Security. Embeddings and answers are processed via
              private API calls and never used to train global models.
            </p>
          </GlassCard>

          <GlassCard className="space-y-2.5 border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-black/60">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-base">
              <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              How fast does document indexing take?
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              Standard 50-page reports are parsed, chunked, and vectorized in
              under 8 seconds, allowing immediate interactive Q&amp;A.
            </p>
          </GlassCard>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center">
          <GlassCard variant="glow" className="max-w-2xl mx-auto text-center p-8 sm:p-10 space-y-6 border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-black/60">
            <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Ready to interrogate your documents?
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-lg mx-auto">
              Get started with DocuMind today. Upload your PDFs and receive
              truth-grounded answers in seconds.
            </p>
            <div className="flex justify-center">
              <Link href="/signup">
                <GradientButton size="lg">
                  Get Started Free
                </GradientButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 5. WATCH DEMO DIALOG (Placeholder modal) */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="glass-panel border border-zinc-200 dark:border-white/15 bg-white/95 dark:bg-[#120e22]/95 text-zinc-900 dark:text-white max-w-lg p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold glass-pill border-purple-500/30 text-purple-700 dark:text-purple-200 w-fit">
              <Play className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-current" />
              Interactive Demo
            </div>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
              DocuMind Walkthrough
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-300 text-sm">
              Watch how DocuMind indexes PDFs and grounds conversational AI
              answers with verifiable source citations.
            </DialogDescription>
          </DialogHeader>

          {/* Video Placeholder Container */}
          <div className="mt-4 aspect-video rounded-xl bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white shadow-[0_0_20px_#a855f7] group-hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-current text-purple-600 dark:text-purple-200 ml-0.5" />
            </div>
            <div className="mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Full product demo video coming soon
            </div>
            <div className="text-[10px] text-zinc-500">
              Resolution: 1080p &bull; Runtime: 2m 15s
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
            <Button
              variant="ghost"
              onClick={() => setDemoOpen(false)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              Close
            </Button>
            <Link href="/signup" onClick={() => setDemoOpen(false)}>
              <Button size="sm" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs px-4">
                Try Interactive Demo
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
