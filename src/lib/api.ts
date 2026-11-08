import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);

export async function apiFetch(path: string, init: RequestInit = {}) {
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
      `The server is unavailable at ${API_BASE_URL}. Start the backend service and try again.`,
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${response.status}.`);
  }
  return response;
}

export const apiBaseUrl = API_BASE_URL;
