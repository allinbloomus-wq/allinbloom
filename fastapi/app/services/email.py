from __future__ import annotations

from typing import Iterable

import httpx

from app.core.config import settings


RESEND_ENDPOINT = "https://api.resend.com/emails"


def _escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def _format_money(value: int) -> str:
    return f"${value / 100:,.2f}"


def _resolve_reply_to(candidate: str | None = None) -> str:
    return candidate or settings.email_reply_to or settings.admin_email


def _format_fee(value: str | int | None) -> str:
    if value is None:
        return "-"
    try:
        cents = int(value)
    except (TypeError, ValueError):
        return str(value)
    return _format_money(cents)


async def send_email(to: Iterable[str], subject: str, text: str, html: str, reply_to: str) -> None:
    if not settings.resend_api_key:
        return
    payload = {
        "from": settings.email_from,
        "to": list(to),
        "subject": subject,
        "text": text,
        "html": html,
        "reply_to": reply_to,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            RESEND_ENDPOINT,
            json=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        )
    if response.status_code >= 400:
        raise RuntimeError(f"Resend error: {response.text}")


async def send_otp_email(email: str, code: str) -> None:
    subject = "Your All in Bloom Floral Studio verification code"
    text = f"Your one-time code is {code}. It expires in 10 minutes."
    html = f"<p>Your one-time code is <strong>{_escape(code)}</strong>. It expires in 10 minutes.</p>"
    await send_email([email], subject, text, html, _resolve_reply_to())


async def send_admin_order_email(params: dict) -> None:
    if not settings.admin_email:
        return
    safe_order = _escape(params["order_id"])
    safe_email = _escape(params.get("email") or "-")
    safe_phone = _escape(params.get("phone") or "-")
    safe_address = _escape(params.get("delivery_address") or "-")
    safe_miles = _escape(params.get("delivery_miles") or "-")
    safe_fee = _escape(_format_fee(params.get("delivery_fee")))
    safe_discount = _escape(params.get("first_order_discount") or "0")
    total = _escape(_format_money(params["total_cents"]))

    items = params.get("items") or []
    items_html = "".join(
        f"<li>{item['quantity']} x {_escape(item['name'])} - {_escape(_format_money(item['price_cents']))}</li>"
        for item in items
    )
    items_text = "\n".join(
        f"{item['quantity']} x {item['name']} - {_format_money(item['price_cents'])}"
        for item in items
    )

    subject = f"New paid order {safe_order}"
    text = "\n".join(
        [
            "Order paid",
            f"Order: {params['order_id']}",
            f"Customer email: {params.get('email') or '-'}",
            f"Phone: {params.get('phone') or '-'}",
            f"Total: {_format_money(params['total_cents'])}",
            f"Delivery address: {params.get('delivery_address') or '-'}",
            f"Delivery miles: {params.get('delivery_miles') or '-'}",
            f"Delivery fee: {_format_fee(params.get('delivery_fee'))}",
            f"First order discount %: {params.get('first_order_discount') or '0'}",
            "Items:",
            items_text or "-",
        ]
    )
    html = f"""
      <h2>Order paid</h2>
      <p><strong>Order:</strong> {safe_order}</p>
      <p><strong>Customer email:</strong> {safe_email}</p>
      <p><strong>Phone:</strong> {safe_phone}</p>
      <p><strong>Total:</strong> {total}</p>
      <p><strong>Delivery address:</strong> {safe_address}</p>
      <p><strong>Delivery miles:</strong> {safe_miles}</p>
      <p><strong>Delivery fee:</strong> {safe_fee}</p>
      <p><strong>First order discount %:</strong> {safe_discount}</p>
      <h3>Items</h3>
      <ul>{items_html}</ul>
    """
    await send_email(
        [settings.admin_email],
        subject,
        text,
        html,
        _resolve_reply_to(params.get("email")),
    )


async def send_customer_order_email(params: dict) -> None:
    if not params.get("email"):
        return
    safe_order = _escape(params["order_id"])
    safe_email = _escape(params.get("email") or "-")
    safe_phone = _escape(params.get("phone") or "-")
    safe_address = _escape(params.get("delivery_address") or "-")
    safe_miles = _escape(params.get("delivery_miles") or "-")
    safe_fee = _escape(_format_fee(params.get("delivery_fee")))
    safe_discount = _escape(params.get("first_order_discount") or "0")
    total = _escape(_format_money(params["total_cents"]))

    items = params.get("items") or []
    items_html = "".join(
        f"<li>{item['quantity']} x {_escape(item['name'])} - {_escape(_format_money(item['price_cents']))}</li>"
        for item in items
    )
    items_text = "\n".join(
        f"{item['quantity']} x {item['name']} - {_format_money(item['price_cents'])}"
        for item in items
    )

    subject = f"Your order {safe_order} is confirmed"
    text = "\n".join(
        [
            "Thank you for your order!",
            f"Order: {params['order_id']}",
            f"Email: {params.get('email') or '-'}",
            f"Phone: {params.get('phone') or '-'}",
            f"Total: {_format_money(params['total_cents'])}",
            f"Delivery address: {params.get('delivery_address') or '-'}",
            f"Delivery miles: {params.get('delivery_miles') or '-'}",
            f"Delivery fee: {_format_fee(params.get('delivery_fee'))}",
            f"First order discount %: {params.get('first_order_discount') or '0'}",
            "Items:",
            items_text or "-",
        ]
    )
    html = f"""
      <h2>Thank you for your order!</h2>
      <p><strong>Order:</strong> {safe_order}</p>
      <p><strong>Email:</strong> {safe_email}</p>
      <p><strong>Phone:</strong> {safe_phone}</p>
      <p><strong>Total:</strong> {total}</p>
      <p><strong>Delivery address:</strong> {safe_address}</p>
      <p><strong>Delivery miles:</strong> {safe_miles}</p>
      <p><strong>Delivery fee:</strong> {safe_fee}</p>
      <p><strong>First order discount %:</strong> {safe_discount}</p>
      <h3>Items</h3>
      <ul>{items_html}</ul>
    """
    await send_email(
        [params["email"]],
        subject,
        text,
        html,
        _resolve_reply_to(),
    )


async def send_contact_email(name: str, email: str, message: str) -> None:
    if not settings.admin_email:
        return
    safe_name = _escape(name)
    safe_email = _escape(email)
    safe_message = _escape(message).replace("\n", "<br>")
    subject = f"New contact form message from {safe_name}"
    text = "\n".join(
        ["New Contact Form Submission", f"Name: {name}", f"Email: {email}", "", message]
    )
    html = f"""
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> {safe_name}</p>
      <p><strong>Email:</strong> {safe_email}</p>
      <p><strong>Message:</strong></p>
      <p>{safe_message}</p>
    """
    await send_email(
        [settings.admin_email],
        subject,
        text,
        html,
        _resolve_reply_to(email),
    )
