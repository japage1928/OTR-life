import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/markdown";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@shared/schema";

export default function AdminPostsPage() {
  const { toast } = useToast();
  const { data: posts, isLoading } = useQuery<Post[]>({ queryKey: ["/api/admin/posts"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({ title: "Post deleted" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-1">
          <h1 className="text-xl font-bold" data-testid="text-posts-title">Posts</h1>
          <Link href="/admin/posts/new">
            <Button size="sm" data-testid="button-new-post">
              <Plus className="w-4 h-4 mr-1" /> New Post
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="rounded-md border border-card-border bg-card divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-2 p-3" data-testid={`row-post-${post.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.slug} &middot; {formatDate(post.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                    {post.status}
                  </Badge>
                  {post.status === "published" && (
                    <Link href={`/post/${post.slug}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-${post.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/posts/${post.id}/edit`}>
                    <Button variant="ghost" size="icon" data-testid={`button-edit-${post.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete this post?")) deleteMutation.mutate(post.id);
                    }}
                    data-testid={`button-delete-${post.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
