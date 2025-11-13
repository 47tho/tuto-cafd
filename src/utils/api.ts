import { projectId, publicAnonKey } from "./supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9ffbf00b`;

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null,
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    ...options.headers,
  };

  // ----- AÑADE ESTA LÓGICA -----
  // Revisa si el body existe, si es un objeto y si no es ya un string.
  const body =
    options.body && typeof options.body === "object"
      ? JSON.stringify(options.body)
      : options.body;
  // ------------------------------

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    body, // <-- USA EL 'body' MODIFICADO
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`API Error on ${endpoint}:`, error);
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}