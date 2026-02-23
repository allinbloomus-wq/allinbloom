const DEFAULT_GOOGLE_REDIRECT_PATH = "/auth/google/callback";

const normalizeBase = (value?: string) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export const getGoogleRedirectUri = (
  path: string = DEFAULT_GOOGLE_REDIRECT_PATH
) => {
  const configuredBase = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL);
  if (typeof window === "undefined") {
    return configuredBase ? `${configuredBase}${path}` : path;
  }
  const base = configuredBase || window.location.origin;
  return `${base}${path}`;
};
