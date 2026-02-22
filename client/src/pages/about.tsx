import { PublicLayout } from "@/components/layout/public-layout";
import { Truck, Shield, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" data-testid="text-about-title">About TruckerTools</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Welcome to TruckerTools -- your go-to resource for everything trucking. 
            Whether you're an OTR driver, a local hauler, or just starting out in the industry, 
            we've got you covered.
          </p>

          <div className="grid gap-6 mt-8 not-prose">
            <div className="flex gap-4 p-4 rounded-md border border-card-border bg-card">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reviews & Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Honest reviews of gear, gadgets, and accessories that make life on the road better. 
                  From mattresses to CB radios, we test it all.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-md border border-card-border bg-card">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Safety & Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Stay up to date with regulations, safety tips, and best practices. 
                  Your safety is our top priority.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-md border border-card-border bg-card">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Built by truckers, for truckers. We understand the challenges and rewards of the open road.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
