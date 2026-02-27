export const sanitizeOrderItemDetails = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const cleaned = raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^style\s*:/i.test(item));

  return cleaned.join(" | ");
};
