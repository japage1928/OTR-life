import { PublicLayout } from "@/components/layout/public-layout";

export default function AffiliateDisclosurePage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" data-testid="text-affiliate-title">Affiliate Disclosure</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
          <p>
            TruckerTools is a participant in various affiliate marketing programs. This means we may earn a commission 
            when you click on certain links on our website and make a purchase. This is at no additional cost to you.
          </p>
          
          <h2>How It Works</h2>
          <p>
            When we review or recommend a product, we may include links to retailers where you can purchase that product. 
            If you click on one of those links and make a purchase, we may receive a small commission from the retailer.
          </p>
          
          <h2>Our Commitment</h2>
          <p>
            Our affiliate relationships do not influence our reviews or recommendations. We only recommend products we 
            genuinely believe will be helpful to our fellow truckers. Our content is based on real experience and research.
          </p>
          
          <h2>Transparency</h2>
          <p>
            Posts that contain affiliate links will have a disclosure notice at the top of the article. 
            We believe in full transparency with our readers.
          </p>
          
          <h2>Questions?</h2>
          <p>
            If you have any questions about our affiliate relationships, please don't hesitate to 
            <a href="/contact"> contact us</a>.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
