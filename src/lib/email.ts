const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendOtpEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    "All in Bloom Floral Studio <no-reply@allinbloom.com>";

  if (!apiKey) {
    console.info(`[DEV] OTP code for ${email}: ${code}`);
    return;
  }

  const payload = {
    from,
    to: [email],
    subject: "Your All in Bloom Floral Studio verification code",
    html: `<p>Your one-time code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
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
