import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl ?? (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "")).replace(
  /\/+$/,
  "",
);
const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function isLoopback(url: string) {
  try {
    return loopbackHosts.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!API_BASE_URL) {
    throw new Error("The backend URL is not configured. Set NEXT_PUBLIC_API_URL to the public backend URL and rebuild the storefront.");
  }
  if (
    typeof window !== "undefined" &&
    isLoopback(API_BASE_URL) &&
    !loopbackHosts.has(window.location.hostname)
  ) {
    throw new Error("The storefront is using a localhost backend URL, which is not reachable by deployed visitors. Set NEXT_PUBLIC_API_URL to the public backend URL and redeploy.");
  }

  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error("[api] Backend request failed:", error);
    throw new Error(
      `The backend at ${API_BASE_URL} could not be reached. Check that the API is running, the URL is correct, and its CORS_ORIGIN allows this storefront.`,
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${response.status}.`);
  }
  return response;
}

export const apiBaseUrl = API_BASE_URL;
