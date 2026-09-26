import { useAuth } from "./auth";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { code: string; message: string } | Record<string, string> };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getAccessToken(): string | null {
  // Read from the zustand store directly. The store persists under
  // "nexora-auth" and also keeps an in-memory copy that's hot-reload safe.
  if (typeof window === "undefined") return null;
  try {
    return useAuth.getState().accessToken;
  } catch {
    return null;
  }
}

function getAuthHeaders(): HeadersInit {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || (body && body.success === false)) {
    const err = (body as ApiError).error;
    let message =
      typeof err === "object" && "message" in err
        ? err.message
        : typeof err === "object" && err !== null
          ? Object.values(err).join("; ")
          : `Request failed (${res.status})`;

    const data = (body as any)?.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const details = Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
      if (details) {
        message = `${message}: ${details}`;
      }
    }
    throw new Error(message);
  }
  return (body as ApiSuccess<T>).data;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: form,
    headers: { ...getAuthHeaders() },
  });
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || (body && body.success === false)) {
    const err = (body as ApiError).error;
    throw new Error(typeof err === "object" && "message" in err ? err.message : `Upload failed (${res.status})`);
  }
  return (body as ApiSuccess<T>).data;
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}