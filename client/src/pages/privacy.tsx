import { PublicLayout } from "@/components/layout/public-layout";

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" data-testid="text-privacy-title">Privacy Policy</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly when you contact us, such as your name and email address. We also collect standard web analytics data including page views, browser type, and referring URLs.</p>
          
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to respond to your inquiries, improve our website, and provide relevant content. We do not sell or share your personal information with third parties.</p>
          
          <h2>Cookies</h2>
          <p>We use essential cookies for basic website functionality and analytics cookies to understand how visitors use our site. You can disable cookies through your browser settings.</p>
          
          <h2>Affiliate Links</h2>
          <p>Some of our content contains affiliate links. When you click these links and make a purchase, we may receive a commission. This does not affect the price you pay. See our <a href="/affiliate-disclosure">Affiliate Disclosure</a> for more details.</p>
          
          <h2>Contact</h2>
          <p>If you have questions about this privacy policy, please <a href="/contact">contact us</a>.</p>
        </div>
      </div>
    </PublicLayout>
  );
}
