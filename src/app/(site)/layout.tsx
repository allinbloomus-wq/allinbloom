import Header from "@/components/header";
import Footer from "@/components/footer";
import TidioChatWidget from "@/components/tidio-chat-widget";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-10 lg:px-8">
        {children}
      </main>
      <Footer />
      <div id="lightbox-root" />
      <TidioChatWidget />
    </div>
  );
}
