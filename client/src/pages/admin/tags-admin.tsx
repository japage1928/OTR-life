import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/markdown";
import type { Tag } from "@shared/schema";

export default function TagsAdminPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: tags, isLoading } = useQuery<Tag[]>({ queryKey: ["/api/tags"] });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/admin/tags", { name, slug: slugify(name) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setNewName("");
      toast({ title: "Tag created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PUT", `/api/admin/tags/${id}`, { name, slug: slugify(name) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setEditingId(null);
      toast({ title: "Tag updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({ title: "Tag deleted" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) createMutation.mutate(newName.trim());
  };

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-xl">
        <h1 className="text-xl font-bold" data-testid="text-tags-title">Tags</h1>

        <form onSubmit={handleCreate} className="flex gap-2" data-testid="form-new-tag">
          <Input
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="input-new-tag"
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending} data-testid="button-add-tag">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </form>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)}
          </div>
        ) : tags && tags.length > 0 ? (
          <div className="rounded-md border border-card-border bg-card divide-y divide-border">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between gap-2 p-3" data-testid={`row-tag-${tag.id}`}>
                {editingId === tag.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      data-testid="input-edit-tag"
                    />
                    <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: tag.id, name: editName })}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-sm">{tag.name}</p>
                      <p className="text-xs text-muted-foreground">{tag.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(tag.id); setEditName(tag.name); }} data-testid={`button-edit-tag-${tag.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(tag.id); }} data-testid={`button-delete-tag-${tag.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No tags yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
