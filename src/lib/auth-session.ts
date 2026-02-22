import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { apiFetch } from "@/lib/api-server";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  image?: string | null;
  phone?: string | null;
};

const fetchCurrentUser = async () => {
  const response = await apiFetch("/api/users/me", {}, true);
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as AuthUser | null;
};

export const getAuthSession = async () => {
  const store = await cookies();
  const token = store.get(AUTH_TOKEN_COOKIE)?.value || null;
  const refreshCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME || "aib_refresh";
  const hasRefreshCookie = Boolean(store.get(refreshCookieName)?.value);
  if (!token && !hasRefreshCookie) {
    return { token: null, user: null };
  }

  const user = await fetchCurrentUser();
  return { token, user };
};

export const requireAuth = async () => {
  const { user, token } = await getAuthSession();
  if (!user) {
    redirect("/auth");
  }
  return { user, token };
};

export const requireAdmin = async () => {
  const { user, token } = await getAuthSession();
  if (!user || user.role !== "ADMIN") {
    redirect("/auth");
  }
  return { user, token };
};
