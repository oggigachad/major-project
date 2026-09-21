"use client";

/* ------------------------------------------------------------------ */
/* Env-driven API client — zero hard-coded endpoints or URLs.          */
/*                                                                     */
/* Resolution order for the API base:                                  */
/*   1. NEXT_PUBLIC_API_BASE_URL  — direct mode (e.g. http://localhost:8000)      */
/*   2. NEXT_PUBLIC_API_PORT     — gateway proxy mode: same-origin path +          */
/*                                 ?XTransformPort=<port> (sandbox preview)        */
/*   3. neither                   — same-origin relative (reverse proxy) */
/* ------------------------------------------------------------------ */

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const GATEWAY_PORT = (process.env.NEXT_PUBLIC_API_PORT ?? "").trim();

export function apiUrl(path: string): string {
  if (BASE_URL) return `${BASE_URL}${path}`;
  if (GATEWAY_PORT) {
    return `${path}${path.includes("?") ? "&" : "?"}XTransformPort=${encodeURIComponent(GATEWAY_PORT)}`;
  }
  return path;
}

export function wsUrl(path: string): string {
  if (typeof window === "undefined") return "";
  if (BASE_URL) {
    try {
      const url = new URL(BASE_URL);
      const proto = url.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${url.host}${path}`;
    } catch {
      const proto = BASE_URL.startsWith("https") ? "wss:" : "ws:";
      const host = BASE_URL.replace(/^https?:\/\//, "");
      return `${proto}//${host}${path}`;
    }
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  let full = `${proto}//${host}${path}`;
  if (GATEWAY_PORT) {
    full += `${full.includes("?") ? "&" : "?"}XTransformPort=${encodeURIComponent(GATEWAY_PORT)}`;
  }
  return full;
}


const AUTH_PREFIX = "/api/v1/auth/";

/**
 * fetch wrapper with cookies + one silent access-token refresh.
 * If a request comes back 401 (access token expired), we rotate the
 * refresh cookie once and replay the original request.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(apiUrl(path), {
      ...init,
      credentials: "include",
      headers: { ...(init.headers ?? {}) },
    });

  let res = await send();
  if (res.status === 401 && !path.startsWith(AUTH_PREFIX)) {
    try {
      const refreshed = await fetch(apiUrl("/api/v1/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });
      if (refreshed.ok) res = await send();
    } catch {
      /* network hiccup — surface the original 401 */
    }
  }
  return res;
}

/** Extract the standard error message from an API response. */
export async function apiError(res: Response, fallback = "Request failed"): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
