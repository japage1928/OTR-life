import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function RouteLogConverterPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState("");
  const [output, setOutput] = useState("");

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const stopsList = stops.split("\n").filter(Boolean);
    const lines = [
      `TRIP LOG`,
      `========`,
      `Origin: ${origin}`,
      ...(stopsList.length > 0 ? [`Stops: ${stopsList.join(" -> ")}`] : []),
      `Destination: ${destination}`,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Note: Full trip logging with mileage and time tracking coming soon!`,
    ];
    setOutput(lines.join("\n"));
  };

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/tools">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-tools">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" data-testid="text-converter-title">Route to Trip Log</h1>
              <Badge>Beta</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Convert your route into a formatted trip log.</p>
          </div>
        </div>

        <form onSubmit={handleConvert} className="space-y-4" data-testid="form-route-converter">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                placeholder="e.g., Dallas, TX"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                data-testid="input-origin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g., Chicago, IL"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                data-testid="input-destination"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stops">Stops (one per line, optional)</Label>
            <Textarea
              id="stops"
              placeholder="Oklahoma City, OK&#10;Springfield, MO"
              value={stops}
              onChange={(e) => setStops(e.target.value)}
              rows={3}
              data-testid="input-stops"
            />
          </div>
          <Button type="submit" data-testid="button-convert">
            Generate Trip Log <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {output && (
          <div className="mt-6">
            <Label className="mb-2 block">Generated Trip Log</Label>
            <pre className="rounded-md border border-card-border bg-card p-4 text-sm font-mono whitespace-pre-wrap" data-testid="text-output">
              {output}
            </pre>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
