import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Link as LinkType } from "@shared/schema";

export default function LinksAdminPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");

  const { data: links, isLoading } = useQuery<LinkType[]>({ queryKey: ["/api/admin/links"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      setLabel(""); setUrl(""); setNotes(""); setCategory("");
      setShowForm(false);
      toast({ title: "Link added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({ title: "Link deleted" });
    },
  });

  const copySnippet = (link: LinkType) => {
    const snippet = `[${link.label}](${link.url})`;
    navigator.clipboard.writeText(snippet);
    toast({ title: "Copied!", description: "Markdown snippet copied to clipboard." });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      label,
      url,
      notes: notes || null,
      category: category || null,
    });
  };

  const groupedLinks = links?.reduce((acc, link) => {
    const cat = link.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {} as Record<string, LinkType[]>) || {};

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-1">
          <h1 className="text-xl font-bold" data-testid="text-links-title">Link Library</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-link">
            <Plus className="w-4 h-4 mr-1" /> Add Link
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-md border border-card-border bg-card p-4 space-y-3" data-testid="form-new-link">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="label">Label</Label>
                <Input id="label" placeholder="Product name" value={label} onChange={(e) => setLabel(e.target.value)} required data-testid="input-link-label" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="url">URL</Label>
                <Input id="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required data-testid="input-link-url" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g., CB Radios" value={category} onChange={(e) => setCategory(e.target.value)} data-testid="input-link-category" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-link-notes" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending} data-testid="button-save-link">Save Link</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-md animate-pulse" />)}
          </div>
        ) : Object.keys(groupedLinks).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedLinks).map(([cat, catLinks]) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{cat}</h3>
                <div className="rounded-md border border-card-border bg-card divide-y divide-border">
                  {catLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between gap-2 p-3" data-testid={`row-link-${link.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{link.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        {link.notes && <p className="text-xs text-muted-foreground mt-0.5">{link.notes}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => copySnippet(link)} data-testid={`button-copy-${link.id}`}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(link.id); }} data-testid={`button-delete-link-${link.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No links yet. Add your first affiliate link!</p>
        )}
      </div>
    </AdminLayout>
  );
}
