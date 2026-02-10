import { apiFetch } from "@/lib/api-server";

export async function getAdminOrders() {
  const response = await apiFetch("/api/admin/orders", {}, true);
  if (!response.ok) return [];
  return response.json();
}

export async function getAdminOrdersByDay(dayKey: string) {
  const response = await apiFetch(`/api/admin/orders/by-day?date=${dayKey}`, {}, true);
  if (!response.ok) return [];
  const data = (await response.json()) as { orders?: any[] };
  return data.orders || [];
}

export async function getOrderById(id: string) {
  const response = await apiFetch(`/api/orders/${id}`, {}, true);
  if (!response.ok) return null;
  return response.json();
}

export async function getOrdersByEmail(_email: string) {
  const response = await apiFetch("/api/orders/me", {}, true);
  if (!response.ok) return [];
  return response.json();
}

export async function countOrdersByEmail(email: string) {
  const orders = await getOrdersByEmail(email);
  return orders.length;
}
