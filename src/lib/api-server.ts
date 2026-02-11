import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth-cookies";

const API_BASE =
  process.env.API_BASE_URL || "";

export const apiUrl = (path: string) => {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
};

export const getServerAuthToken = async () => {
  const store = await cookies();
  return store.get(AUTH_TOKEN_COOKIE)?.value || null;
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  auth: boolean = false
) => {
  const headers = new Headers(options.headers);
  if (auth) {
    const token = await getServerAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(apiUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });
};
