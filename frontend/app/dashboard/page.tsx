"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Search,
  Trash2,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getDocuments,
  deleteDocument,
  uploadDocument,
  DocumentItem,
  ApiError,
} from "@/lib/api";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type === "pdf") {
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  }
  if (type === "docx" || type === "doc") {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
        <FileSpreadsheet className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
      <FileCode className="w-5 h-5" />
    </div>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Drag and drop / Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog state
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch documents from real backend
  const fetchDocs = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        return; // Redirect handled by api helper
      }
      const message =
        err instanceof Error ? err.message : "Failed to load documents.";
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDocs(true);
  }, [fetchDocs]);

  // Polling: while any document has status 'processing', refresh list every 3s
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getDocuments();
        setDocuments(updated);
      } catch (err) {
        console.error("Auto-refresh polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  // Handle uploading a batch of files sequentially
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

      // Client-side validation: extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(
          `"${file.name}" has an unsupported format. Only PDF, DOCX, and TXT files are accepted.`
        );
        continue;
      }

      // Client-side validation: empty file
      if (file.size === 0) {
        toast.error(`"${file.name}" is empty and cannot be uploaded.`);
        continue;
      }

      // Client-side validation: size limit (20 MB)
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 20 MB file size limit.`);
        continue;
      }

      // Perform real upload with XMLHttpRequest progress tracking
      setIsUploading(true);
      setUploadFileName(file.name);
      setUploadProgress(0);

      try {
        const newDoc = await uploadDocument(file, (percent) => {
          setUploadProgress(percent);
        });

        // Add to state immediately
        setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
        toast.success(`"${file.name}" uploaded successfully!`);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : `Failed to upload "${file.name}".`;
        toast.error(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName("");
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  // Handle real document deletion
  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDocument(docToDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      toast.success(`Document "${docToDelete.name}" deleted.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete document.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDocToDelete(null);
    }
  };

  // Filter & Sort Logic
  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "pages") {
        return (b.page_count || 0) - (a.page_count || 0);
      }
      if (sortBy === "size") {
        return b.file_size - a.file_size;
      }
      return 0;
    });

  return (
    <PageLayout variant="app">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Document Repository
              </h1>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 text-xs px-2.5 py-0.5"
              >
                {documents.length} Total
              </Badge>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Upload, index, and query PDFs and docs with vector-grounded citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing || isLoading}
              onClick={() => {
                setIsRefreshing(true);
                fetchDocs(false);
              }}
              className="rounded-xl border-zinc-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 text-xs"
              title="Refresh documents list"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              Refresh List
            </Button>
          </div>
        </div>

        {/* 1. DRAG AND DROP UPLOAD AREA */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all backdrop-blur-xl ${
            isDragging
              ? "border-purple-500 bg-purple-500/10 scale-[1.01]"
              : "border-zinc-300 dark:border-white/15 hover:border-purple-500/40 bg-white/70 dark:bg-black/40 hover:bg-white/90 dark:hover:bg-black/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="max-w-md mx-auto space-y-4 py-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="truncate max-w-[240px] font-semibold text-zinc-900 dark:text-white">
                  Uploading {uploadFileName}
                </span>
                <span className="text-purple-600 dark:text-purple-300 font-mono font-bold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Storing in private cloud storage and registering metadata...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-[0_0_20px_-3px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  Drop your PDF, DOCX, or TXT documents here, or{" "}
                  <span className="text-purple-600 dark:text-purple-400 underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Supports multiple PDF, Microsoft Word (.docx), and plain text (.txt) files up to 20 MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. CONTROLS: SEARCH, FILTER TABS, AND SORT DROPDOWN */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search documents by name or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-9 rounded-xl bg-white dark:bg-white/5 border-zinc-200 dark:border-white/15 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-purple-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Status Filter Pills + Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "ready", label: "Ready" },
                { key: "processing", label: "Processing" },
                { key: "failed", label: "Failed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === tab.key
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/15 text-zinc-800 dark:text-zinc-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500/40 cursor-pointer"
              >
                <option
                  value="newest"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Newest first
                </option>
                <option
                  value="oldest"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Oldest first
                </option>
                <option
                  value="name-asc"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Name (A-Z)
                </option>
                <option
                  value="name-desc"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Name (Z-A)
                </option>
                <option
                  value="size"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Largest size
                </option>
                <option
                  value="pages"
                  className="bg-white dark:bg-[#120e22] text-zinc-900 dark:text-white"
                >
                  Most Pages
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DOCUMENT CARDS GRID / SKELETONS / EMPTY STATE */}
        {isLoading ? (
          /* Skeleton Loaders */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard
                key={i}
                className="p-6 space-y-4 border-zinc-200 dark:border-white/10"
              >
                <div className="flex items-start justify-between">
                  <Skeleton className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/10" />
                  <Skeleton className="w-20 h-5 rounded-full bg-zinc-200 dark:bg-white/10" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-zinc-200 dark:bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-200 dark:bg-white/10" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
                  <Skeleton className="h-3 w-1/3 bg-zinc-200 dark:bg-white/10" />
                  <Skeleton className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-white/10" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* Empty State */
          <GlassCard className="p-12 text-center space-y-4 max-w-lg mx-auto border-dashed border-zinc-300 dark:border-white/15">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                No documents found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No files match your active filters or search terms."
                  : "You haven't uploaded any documents yet."}
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  fileInputRef.current?.click();
                }}
                className="rounded-xl border-zinc-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Upload New Document
              </Button>
            </div>
          </GlassCard>
        ) : (
          /* Real Documents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const isReady = doc.status === "ready";
              const isProcessing = doc.status === "processing";
              const isFailed = doc.status === "failed";

              return (
                <GlassCard
                  key={doc.id}
                  variant={isReady ? "glow" : "default"}
                  className="p-6 flex flex-col justify-between space-y-5 transition-all border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                >
                  <div className="space-y-4">
                    {/* Top Row: File Icon + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      {getFileIcon(doc.file_type || doc.name)}

                      {/* Status Badges following design.md */}
                      {isReady && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Ready
                        </span>
                      )}

                      {isProcessing && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 animate-pulse">
                          <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          Processing
                        </span>
                      )}

                      {isFailed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Failed
                        </span>
                      )}
                    </div>

                    {/* Document Title & File Name */}
                    <div className="space-y-1">
                      <h3
                        className="text-base font-bold text-zinc-900 dark:text-white tracking-tight line-clamp-1"
                        title={doc.name}
                      >
                        {doc.name}
                      </h3>
                      <p
                        className="text-xs text-zinc-500 dark:text-zinc-400 font-mono uppercase"
                      >
                        {doc.file_type} document
                      </p>
                    </div>

                    {/* Metadata Row: Size, Date, Pages */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                      <span>{formatBytes(doc.file_size)}</span>
                      <span>&bull;</span>
                      <span>{doc.page_count} pages</span>
                      <span>&bull;</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>

                    {/* Error Box for Failed Documents */}
                    {isFailed && doc.error_message && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs leading-relaxed space-y-1">
                        <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Indexing Error
                        </div>
                        <p>{doc.error_message}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3">
                    {/* Primary Action Button */}
                    {isReady ? (
                      <Link
                        href={`/chat/new?docId=${doc.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-9 shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Chat with this document
                        </Button>
                      </Link>
                    ) : isProcessing ? (
                      <Button
                        size="sm"
                        disabled
                        className="flex-1 rounded-xl bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 font-medium text-xs h-9 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Processing...
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="flex-1 rounded-xl border-rose-500/30 text-rose-500 text-xs h-9 cursor-not-allowed opacity-60"
                      >
                        Unavailable
                      </Button>
                    )}

                    {/* Delete Icon Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDocToDelete(doc)}
                      className="h-9 w-9 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 transition-colors"
                      title="Delete document"
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* 4. DELETE CONFIRMATION DIALOG */}
        <Dialog
          open={!!docToDelete}
          onOpenChange={(open) => !open && !isDeleting && setDocToDelete(null)}
        >
          <DialogContent className="glass-panel border-zinc-200 dark:border-white/15 max-w-md p-6 rounded-3xl">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto sm:mx-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                Delete document?
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">
                  &ldquo;{docToDelete?.name}&rdquo;
                </span>
                ? This action will permanently remove the file from cloud storage and delete all associated vector chunks.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDocToDelete(null)}
                className="rounded-xl border-zinc-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs h-10 shadow-lg shadow-rose-950/30 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete permanently</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
