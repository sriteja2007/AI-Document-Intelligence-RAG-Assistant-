import { getAccessToken } from "@/lib/auth";

export interface DocumentItem {
  id: string;
  user_id?: string;
  name: string;
  storage_path?: string;
  file_type: string;
  file_size: number;
  status: "processing" | "ready" | "failed";
  error_message?: string | null;
  page_count: number;
  created_at: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper that injects the Supabase JWT Bearer token and handles 401 redirects.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the backend server. Please verify the service is running.",
      0
    );
  }

  // Handle unauthorized (expired or missing session)
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(errorDetail, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch all documents for the current user.
 */
export async function getDocuments(): Promise<DocumentItem[]> {
  return request<DocumentItem[]>("/documents");
}

/**
 * Fetch a single document by ID.
 */
export async function getDocument(id: string): Promise<DocumentItem> {
  return request<DocumentItem>(`/documents/${id}`);
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(
  id: string
): Promise<{ message: string; id: string }> {
  return request<{ message: string; id: string }>(`/documents/${id}`, {
    method: "DELETE",
  });
}

/**
 * Upload a document with real XMLHttpRequest progress tracking.
 */
export async function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void
): Promise<DocumentItem> {
  const token = await getAccessToken();

  return new Promise<DocumentItem>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE_URL}/documents/upload`;

    xhr.open("POST", url, true);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Upload progress event
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(
            100,
            Math.round((event.loaded / event.total) * 100)
          );
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        reject(new ApiError("Session expired. Please log in again.", 401));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const doc: DocumentItem = JSON.parse(xhr.responseText);
          resolve(doc);
        } catch {
          reject(new ApiError("Failed to parse server response.", xhr.status));
        }
      } else {
        let errorDetail = "Upload failed.";
        try {
          const parsed = JSON.parse(xhr.responseText);
          errorDetail = parsed.detail || parsed.message || errorDetail;
        } catch {
          errorDetail = xhr.statusText || errorDetail;
        }
        reject(new ApiError(errorDetail, xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          "Network error occurred while uploading. Please check your connection.",
          0
        )
      );
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}
