export interface Citation {
  id: string;
  citationIndex: number;
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerpt: string;
  relevanceScore?: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  status: "processing" | "ready" | "failed";
  errorMessage?: string;
  uploadedAt: string;
  vectorCount?: number;
}

export interface ConversationItem {
  id: string;
  title: string;
  documentIds: string[];
  documentCount: number;
  lastMessageSnippet: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

// 6 Realistic Documents (mix of ready, processing, and failed)
export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Q3 2026 Fiscal Performance Report",
    fileName: "Q3_2026_Fiscal_Performance.pdf",
    fileSize: "4.8 MB",
    pageCount: 42,
    status: "ready",
    uploadedAt: "2026-10-15T09:30:00Z",
    vectorCount: 184,
  },
  {
    id: "doc-2",
    name: "Enterprise Multi-Agent Architecture",
    fileName: "Enterprise_MultiAgent_Whitepaper_v4.pdf",
    fileSize: "12.3 MB",
    pageCount: 78,
    status: "ready",
    uploadedAt: "2026-10-28T14:15:00Z",
    vectorCount: 340,
  },
  {
    id: "doc-3",
    name: "Global Security & SOC2 Compliance",
    fileName: "SOC2_TypeII_Audit_Summary_2026.pdf",
    fileSize: "2.1 MB",
    pageCount: 26,
    status: "ready",
    uploadedAt: "2026-11-02T11:00:00Z",
    vectorCount: 96,
  },
  {
    id: "doc-4",
    name: "Commercial Merger & Acquisition Agreement",
    fileName: "Merger_Agreement_Draft_Redacted.pdf",
    fileSize: "18.7 MB",
    pageCount: 114,
    status: "processing",
    uploadedAt: "2026-11-21T18:45:00Z",
  },
  {
    id: "doc-5",
    name: "Clinical Drug Trial Evaluation Protocol",
    fileName: "Clinical_Trial_Phase3_Protocol.pdf",
    fileSize: "8.4 MB",
    pageCount: 55,
    status: "processing",
    uploadedAt: "2026-11-21T19:20:00Z",
  },
  {
    id: "doc-6",
    name: "Legacy Scanned Historical Archive",
    fileName: "Legacy_Archive_OCR_Batch1998.pdf",
    fileSize: "1.2 MB",
    pageCount: 8,
    status: "failed",
    errorMessage:
      "PDF parsing failed: Document contains unsupported raster encryption and corrupted XRef table.",
    uploadedAt: "2026-11-20T16:10:00Z",
  },
];

// 5 Realistic Conversations
export const MOCK_CONVERSATIONS: ConversationItem[] = [
  {
    id: "conv-1",
    title: "Q3 Revenue Breakdown & Margin Trajectory",
    documentIds: ["doc-1"],
    documentCount: 1,
    lastMessageSnippet:
      "Operating margins reached 24.3% in North America, exceeding projections.",
    lastMessageAt: "10 minutes ago",
    createdAt: "2026-11-21T14:00:00Z",
  },
  {
    id: "conv-2",
    title: "Agent Swarm Topology & Memory Persistence",
    documentIds: ["doc-2"],
    documentCount: 1,
    lastMessageSnippet:
      "The coordinator delegates state snapshots through hierarchical vector storage.",
    lastMessageAt: "2 hours ago",
    createdAt: "2026-11-20T10:30:00Z",
  },
  {
    id: "conv-3",
    title: "SOC2 Encryption at Rest & Key Rotation",
    documentIds: ["doc-3"],
    documentCount: 1,
    lastMessageSnippet:
      "All master cryptographic keys are automatically rotated every 90 days via KMS.",
    lastMessageAt: "Yesterday",
    createdAt: "2026-11-19T16:00:00Z",
  },
  {
    id: "conv-4",
    title: "Acquisition Warranty Liabilities",
    documentIds: ["doc-4"],
    documentCount: 1,
    lastMessageSnippet: "Document is currently indexing vector embeddings...",
    lastMessageAt: "3 days ago",
    createdAt: "2026-11-18T08:15:00Z",
  },
  {
    id: "conv-5",
    title: "Clinical Dosage Tolerances across Age Groups",
    documentIds: ["doc-5"],
    documentCount: 1,
    lastMessageSnippet: "Trial protocols require 28-day baseline observation.",
    lastMessageAt: "5 days ago",
    createdAt: "2026-11-16T12:00:00Z",
  },
];

// 1 Sample Chat with 6 Messages (3 user questions, 3 AI answers with grounded citations)
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    role: "user",
    content:
      "What was the total net revenue reported for Q3 2026, and how did recurring software subscriptions perform?",
    createdAt: "2026-11-21T14:00:15Z",
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    role: "assistant",
    content:
      "According to the Q3 financial summary, total net revenue reached **$142.8 million**, representing a **19.4% year-over-year increase** [1].\n\nRecurring software subscription revenue (ARR) was the primary growth catalyst, contributing **$108.2 million** (75.8% of total revenue) with a net dollar retention rate of **121%** across enterprise tiers [2].",
    citations: [
      {
        id: "cit-1",
        citationIndex: 1,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 4,
        excerpt:
          "Consolidated quarterly net revenue totaled $142.8M for the three months ended September 30, 2026, an expansion of 19.4% compared to $119.6M in Q3 2025.",
        relevanceScore: 0.96,
      },
      {
        id: "cit-2",
        citationIndex: 2,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 7,
        excerpt:
          "Annual Recurring Revenue (ARR) closed at $108.2M, driven by rapid cloud tier expansions and an enterprise net retention rate of 121%.",
        relevanceScore: 0.94,
      },
    ],
    createdAt: "2026-11-21T14:00:23Z",
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    role: "user",
    content:
      "Did operating expenses increase as well? What drove the changes in research and development?",
    createdAt: "2026-11-21T14:02:10Z",
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    role: "assistant",
    content:
      "Yes, total operating expenses rose to **$64.5 million**, primarily due to strategic investments in AI infrastructure [1].\n\nSpecifically, Research & Development expenses increased by **31% to $32.4 million**, which the report attributes directly to compute cluster procurement and generative model inference optimization [2].",
    citations: [
      {
        id: "cit-3",
        citationIndex: 1,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 12,
        excerpt:
          "Operating expenses totaled $64.5M compared to $52.1M in the prior year period, reflecting targeted expansion in specialized infrastructure.",
        relevanceScore: 0.92,
      },
      {
        id: "cit-4",
        citationIndex: 2,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 14,
        excerpt:
          "R&D expenditure grew 31% to $32.4M, driven by dedicated GPU cluster leases and model distillation engineering pipelines.",
        relevanceScore: 0.95,
      },
    ],
    createdAt: "2026-11-21T14:02:22Z",
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    role: "user",
    content:
      "What is the guidance for Q4 2026 and what risks are identified regarding customer renewals?",
    createdAt: "2026-11-21T14:05:00Z",
  },
  {
    id: "msg-6",
    conversationId: "conv-1",
    role: "assistant",
    content:
      "Management issued Q4 2026 revenue guidance between **$154.0M and $158.0M**, targeting 22% overall annual growth [1].\n\nRegarding risks, the document highlights potential headwinds in EMEA renewal cycles due to extended enterprise compliance reviews, though gross churn remains stable at under **3.2%** [2].",
    citations: [
      {
        id: "cit-5",
        citationIndex: 1,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 38,
        excerpt:
          "For the fourth quarter of 2026, we forecast total revenue between $154.0M and $158.0M, representing a projected FY26 annual growth trajectory of 22%.",
        relevanceScore: 0.93,
      },
      {
        id: "cit-6",
        citationIndex: 2,
        documentId: "doc-1",
        documentName: "Q3_2026_Fiscal_Performance.pdf",
        pageNumber: 39,
        excerpt:
          "Risk Factors: European enterprise buying cycles have lengthened by an average of 18 days due to regional compliance assessments; however, gross dollar churn remained resilient at 3.2%.",
        relevanceScore: 0.91,
      },
    ],
    createdAt: "2026-11-21T14:05:14Z",
  },
];
