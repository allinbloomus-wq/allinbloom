export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

// Enum values whose plain title-case form reads wrong in English.
const LABEL_OVERRIDES: Record<string, string> = {
  RANUNCULUSES: "Ranunculus",
};

export const formatLabel = (value: string) =>
  value && LABEL_OVERRIDES[value.toUpperCase()]
    ? LABEL_OVERRIDES[value.toUpperCase()]
    : value
    ? value
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    : value;

export const formatDateTime = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(date);
};

export const formatDate = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Chicago",
  }).format(date);
};

export const formatOrderStatus = (status: string) => {
  switch (status) {
    case "PAID":
      return "Paid";
    case "PENDING":
      return "Pending payment";
    case "FAILED":
      return "Payment failed";
    case "CANCELED":
      return "Canceled";
    case "PARTIALLY_REFUNDED":
      return "Partially refunded";
    case "REFUNDED":
      return "Refunded";
    case "DISPUTED":
      return "Payment disputed";
    case "CHARGEBACK":
      return "Chargeback";
    case "REVERSED":
      return "Payment reversed";
    default:
      return status;
  }
};
