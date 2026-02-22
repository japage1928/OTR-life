import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/markdown";
import type { Category } from "@shared/schema";

export default function CategoriesAdminPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories, isLoading } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/admin/categories", { name, slug: slugify(name) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewName("");
      toast({ title: "Category created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PUT", `/api/admin/categories/${id}`, { name, slug: slugify(name) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingId(null);
      toast({ title: "Category updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) createMutation.mutate(newName.trim());
  };

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-xl">
        <h1 className="text-xl font-bold" data-testid="text-categories-title">Categories</h1>

        <form onSubmit={handleCreate} className="flex gap-2" data-testid="form-new-category">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="input-new-category"
          />
          <Button type="submit" size="sm" disabled={createMutation.isPending} data-testid="button-add-category">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </form>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="rounded-md border border-card-border bg-card divide-y divide-border">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-2 p-3" data-testid={`row-cat-${cat.id}`}>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      data-testid="input-edit-category"
                    />
                    <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: cat.id, name: editName })}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} data-testid={`button-edit-cat-${cat.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(cat.id); }} data-testid={`button-delete-cat-${cat.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No categories yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
