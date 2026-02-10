import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth-cookies";

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

export const getAuthSession = () => {
  const store = cookies();
  const token = store.get(AUTH_TOKEN_COOKIE)?.value || null;
  const user = parseUserCookie(store.get(AUTH_USER_COOKIE)?.value);
  return { token, user };
};

export const requireAuth = () => {
  const { user, token } = getAuthSession();
  if (!user || !token) {
    redirect("/auth");
  }
  return { user, token };
};

export const requireAdmin = () => {
  const { user, token } = getAuthSession();
  if (!user || !token || user.role !== "ADMIN") {
    redirect("/auth");
  }
  return { user, token };
};
