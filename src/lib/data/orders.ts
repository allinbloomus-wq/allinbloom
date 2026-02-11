import { apiFetch } from "@/lib/api-server";
import type { Order, OrderStripeSession } from "@/lib/api-types";

export async function getAdminOrders(): Promise<Order[]> {
  const response = await apiFetch("/api/admin/orders", {}, true);
  if (!response.ok) return [];
  return response.json() as Promise<Order[]>;
}

export async function getAdminOrdersByDay(dayKey: string): Promise<Order[]> {
  const response = await apiFetch(`/api/admin/orders/by-day?date=${dayKey}`, {}, true);
  if (!response.ok) return [];
  const data = (await response.json()) as { orders?: Order[] };
  return data.orders || [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const response = await apiFetch(`/api/orders/${id}`, {}, true);
  if (!response.ok) return null;
  return response.json() as Promise<Order>;
}

export async function getOrdersByEmail(_email: string): Promise<Order[]> {
  const response = await apiFetch("/api/orders/me", {}, true);
  if (!response.ok) return [];
  return response.json() as Promise<Order[]>;
}

export async function getOrderStripeSession(
  orderId: string
): Promise<OrderStripeSession | null> {
  const response = await apiFetch(`/api/admin/orders/${orderId}/stripe-session`, {}, true);
  if (!response.ok) return null;
  return response.json() as Promise<OrderStripeSession>;
}

export async function countOrdersByEmail(email: string) {
  const orders = await getOrdersByEmail(email);
  return orders.length;
}
