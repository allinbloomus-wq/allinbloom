import ContactForm from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Contact
        </p>
        <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
          We are here for your floral moments
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Ask about custom bouquets, corporate subscriptions, or event florals.
          Our concierge team responds within one business day.
        </p>
        <div className="space-y-2 text-sm text-stone-600">
          <p>Studio hotline: +1 (224) 213-3823</p>
          <p>Email: hello@allinbloom.com</p>
          <p>Hours: Mon-Sat 9:00 AM to 7:00 PM</p>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
