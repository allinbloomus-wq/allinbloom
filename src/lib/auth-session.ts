import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth-cookies";
import { apiFetch } from "@/lib/api-server";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  image?: string | null;
  phone?: string | null;
};

const parseUserCookie = (value: string | undefined) => {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded) as AuthUser;
  } catch {
    return null;
  }
};

export const getAuthSession = async () => {
  const store = await cookies();
  const token = store.get(AUTH_TOKEN_COOKIE)?.value || null;
  const user = parseUserCookie(store.get(AUTH_USER_COOKIE)?.value);
  return { token, user };
};

const fetchCurrentUser = async () => {
  const response = await apiFetch("/api/users/me", {}, true);
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as AuthUser | null;
};

export const requireAuth = async () => {
  const { user, token } = await getAuthSession();
  if (!token) {
    redirect("/auth");
  }
  const authToken = token;

  if (user) {
    return { user, token: authToken };
  }

  const currentUser = await fetchCurrentUser();
  if (!currentUser) {
    redirect("/auth");
  }
  return { user: currentUser, token: authToken };
};

export const requireAdmin = async () => {
  const { token } = await getAuthSession();
  if (!token) {
    redirect("/auth");
  }
  const authToken = token;

  const currentUser = await fetchCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/auth");
  }
  return { user: currentUser, token: authToken };
};
