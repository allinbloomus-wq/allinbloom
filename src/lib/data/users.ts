import { apiFetch } from "@/lib/api-server";

export async function getCurrentUser() {
  const response = await apiFetch("/api/users/me", {}, true);
  if (!response.ok) return null;
  return response.json();
}
