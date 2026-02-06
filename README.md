# All in Bloom Floral Studio

Elegant, pastel-toned flower shop for the US market with a curated catalog,
florist choice builder, contact form, fully functional cart, secure auth,
and an admin panel for managing bouquets.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Prisma + SQLite (easy local dev, swap to Postgres later)
- NextAuth (email code + Google)
- Stripe Checkout (Google Pay enabled via Stripe)

## Setup

1. Install dependencies
   - `npm install`

2. Create `.env`
   - Copy `.env.example` to `.env`
   - Fill in `NEXTAUTH_SECRET` and `STRIPE_SECRET_KEY`
   - Optional: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Optional: set `NEXT_PUBLIC_GOOGLE_ENABLED="true"` to show the Google button
   - Optional: `RESEND_API_KEY` for sending OTP emails
   - Optional: configure Cloudinary for admin image uploads

3. Initialize database
   - `npm run db:push`
   - `npm run db:seed`

If you change the schema later (for example, to add order details), run
`npm run db:push` again.

4. Run the app
   - `npm run dev`

## Admin Access

- Default admin email: `admin@allinbloom.com`
- Update `ADMIN_EMAIL` in `.env` to your own address before seeding.

## Notes

- Email OTP works in dev even without a mail provider. The OTP is logged in the
  server console when `RESEND_API_KEY` is missing.
- Stripe Checkout supports Google Pay automatically when enabled on the Stripe
  account and the user device supports it.
- PayPal is not wired yet to keep setup simple and low cost. Add it later if required.
- Cloudinary uploads: set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to enable the image upload button.
- Image assets are stored in `public/images`.

## Structure

- `src/app/(site)` public pages
- `src/app/admin` admin panel
- `src/app/api` API routes (auth, checkout, contact)
- `src/components` UI building blocks
- `src/lib` data, auth, and utilities
