import { PublicLayout } from "@/components/layout/public-layout";
import { Link } from "wouter";
import { Wrench, MapPin, Calculator, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    slug: "route-log-converter",
    name: "Route to Trip Log Converter",
    description: "Convert your route data into a formatted trip log ready for compliance.",
    icon: MapPin,
    status: "beta" as const,
  },
  {
    slug: null,
    name: "Fuel Cost Calculator",
    description: "Calculate fuel costs for any trip based on distance, MPG, and fuel price.",
    icon: Calculator,
    status: "coming-soon" as const,
  },
  {
    slug: null,
    name: "HOS Calculator",
    description: "Track your Hours of Service and plan your driving schedule.",
    icon: Clock,
    status: "coming-soon" as const,
  },
];

export default function ToolsPage() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-tools-title">Trucker Tools</h1>
            <p className="text-sm text-muted-foreground">Free tools to make your life on the road easier.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const content = (
              <div
                className={`rounded-md border border-card-border bg-card p-5 space-y-3 ${tool.slug ? "hover-elevate cursor-pointer" : "opacity-60"}`}
                data-testid={`card-tool-${tool.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant={tool.status === "beta" ? "default" : "secondary"} className="text-xs">
                    {tool.status === "beta" ? "Beta" : "Coming Soon"}
                  </Badge>
                </div>
                <h3 className="font-semibold">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            );

            if (tool.slug) {
              return (
                <Link key={tool.name} href={`/tools/${tool.slug}`}>
                  {content}
                </Link>
              );
            }
            return <div key={tool.name}>{content}</div>;
          })}
        </div>
      </div>
    </PublicLayout>
  );
}
