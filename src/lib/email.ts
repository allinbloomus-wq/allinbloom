import { formatMoney } from "@/lib/format";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "All in Bloom Floral Studio <allinbloom.us@gmail.com>";
const DEFAULT_REPLY_TO = "allinbloom.us@gmail.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCents(value?: string | null) {
  if (!value) return "-";
  const cents = Number(value);
  if (!Number.isFinite(cents)) return "-";
  return formatMoney(cents);
}

function buildReplyTo(candidate?: string | null) {
  return (
    candidate ||
    process.env.EMAIL_REPLY_TO ||
    process.env.ADMIN_EMAIL ||
    DEFAULT_REPLY_TO
  );
}

type AdminOrderItem = {
  name: string;
  quantity: number;
  priceCents: number;
};

export async function sendOtpEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const replyTo = buildReplyTo();

  if (!apiKey) {
    console.info(`[DEV] OTP code for ${email}: ${code}`);
    return;
  }

  const payload = {
    from,
    to: [email],
    subject: "Your All in Bloom Floral Studio verification code",
    text: `Your one-time code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your one-time code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    reply_to: replyTo,
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Failed to send OTP email", text);
  }
}

export async function sendAdminOrderEmail(params: {
  orderId: string;
  totalCents: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  items: AdminOrderItem[];
  deliveryAddress?: string | null;
  deliveryMiles?: string | null;
  deliveryFeeCents?: string | null;
  firstOrderDiscountPercent?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.info("[DEV] Admin order email skipped (missing config).", {
      orderId: params.orderId,
    });
    return;
  }

  const safeOrderId = escapeHtml(params.orderId);
  const safeEmail = escapeHtml(params.email || "-");
  const safePhone = escapeHtml(params.phone || "-");
  const safeAddress = escapeHtml(params.deliveryAddress || "-");
  const safeMiles = escapeHtml(params.deliveryMiles || "-");
  const safeFee = escapeHtml(formatCents(params.deliveryFeeCents));
  const safeDiscount = escapeHtml(params.firstOrderDiscountPercent || "0");
  const totalFormatted = escapeHtml(formatMoney(params.totalCents));

  const itemsHtml = params.items
    .map((item) => {
      const safeName = escapeHtml(item.name);
      const formatted = escapeHtml(formatMoney(item.priceCents));
      return `<li>${item.quantity} x ${safeName} - ${formatted}</li>`;
    })
    .join("");

  const itemsText = params.items
    .map(
      (item) => `${item.quantity} x ${item.name} - ${formatMoney(item.priceCents)}`
    )
    .join("\n");

  const payload = {
    from,
    to: [adminEmail],
    subject: `New paid order ${safeOrderId}`,
    text: [
      "Order paid",
      `Order: ${params.orderId}`,
      `Customer email: ${params.email || "-"}`,
      `Phone: ${params.phone || "-"}`,
      `Total: ${formatMoney(params.totalCents)}`,
      `Delivery address: ${params.deliveryAddress || "-"}`,
      `Delivery miles: ${params.deliveryMiles || "-"}`,
      `Delivery fee: ${formatCents(params.deliveryFeeCents)}`,
      `First order discount %: ${params.firstOrderDiscountPercent || "0"}`,
      "Items:",
      itemsText || "-",
    ].join("\n"),
    html: `
      <h2>Order paid</h2>
      <p><strong>Order:</strong> ${safeOrderId}</p>
      <p><strong>Customer email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Total:</strong> ${totalFormatted}</p>
      <p><strong>Delivery address:</strong> ${safeAddress}</p>
      <p><strong>Delivery miles:</strong> ${safeMiles}</p>
      <p><strong>Delivery fee:</strong> ${safeFee}</p>
      <p><strong>First order discount %:</strong> ${safeDiscount}</p>
      <h3>Items</h3>
      <ul>${itemsHtml}</ul>
    `,
    reply_to: buildReplyTo(params.email),
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Failed to send admin order email", text);
  }
}

export async function sendCustomerOrderEmail(params: {
  orderId: string;
  totalCents: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  items: AdminOrderItem[];
  deliveryAddress?: string | null;
  deliveryMiles?: string | null;
  deliveryFeeCents?: string | null;
  firstOrderDiscountPercent?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  if (!apiKey || !params.email) {
    console.info("[DEV] Customer order email skipped (missing config).", {
      orderId: params.orderId,
    });
    return;
  }

  const safeOrderId = escapeHtml(params.orderId);
  const safeEmail = escapeHtml(params.email);
  const safePhone = escapeHtml(params.phone || "-");
  const safeAddress = escapeHtml(params.deliveryAddress || "-");
  const safeMiles = escapeHtml(params.deliveryMiles || "-");
  const safeFee = escapeHtml(formatCents(params.deliveryFeeCents));
  const safeDiscount = escapeHtml(params.firstOrderDiscountPercent || "0");
  const totalFormatted = escapeHtml(formatMoney(params.totalCents));

  const itemsHtml = params.items
    .map((item) => {
      const safeName = escapeHtml(item.name);
      const formatted = escapeHtml(formatMoney(item.priceCents));
      return `<li>${item.quantity} x ${safeName} - ${formatted}</li>`;
    })
    .join("");

  const itemsText = params.items
    .map(
      (item) => `${item.quantity} x ${item.name} - ${formatMoney(item.priceCents)}`
    )
    .join("\n");

  const payload = {
    from,
    to: [params.email],
    subject: `Your order ${safeOrderId} is confirmed`,
    text: [
      "Thank you for your order!",
      `Order: ${params.orderId}`,
      `Email: ${params.email}`,
      `Phone: ${params.phone || "-"}`,
      `Total: ${formatMoney(params.totalCents)}`,
      `Delivery address: ${params.deliveryAddress || "-"}`,
      `Delivery miles: ${params.deliveryMiles || "-"}`,
      `Delivery fee: ${formatCents(params.deliveryFeeCents)}`,
      `First order discount %: ${params.firstOrderDiscountPercent || "0"}`,
      "Items:",
      itemsText || "-",
    ].join("\n"),
    html: `
      <h2>Thank you for your order!</h2>
      <p><strong>Order:</strong> ${safeOrderId}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Total:</strong> ${totalFormatted}</p>
      <p><strong>Delivery address:</strong> ${safeAddress}</p>
      <p><strong>Delivery miles:</strong> ${safeMiles}</p>
      <p><strong>Delivery fee:</strong> ${safeFee}</p>
      <p><strong>First order discount %:</strong> ${safeDiscount}</p>
      <h3>Items</h3>
      <ul>${itemsHtml}</ul>
    `,
    reply_to: buildReplyTo(),
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Failed to send customer order email", text);
  }
}
