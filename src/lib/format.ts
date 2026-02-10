export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export const formatLabel = (value: string) =>
  value ? value.charAt(0) + value.slice(1).toLowerCase() : value;

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
    default:
      return status;
  }
};
