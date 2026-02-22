import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { FileText, FolderOpen, Tag, Link as LinkIconLucide, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDate } from "@/lib/markdown";
import type { Post, Category, Tag as TagType, Link as LinkType } from "@shared/schema";

export default function AdminDashboard() {
  const { data: posts } = useQuery<Post[]>({ queryKey: ["/api/admin/posts"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: tags } = useQuery<TagType[]>({ queryKey: ["/api/tags"] });
  const { data: links } = useQuery<LinkType[]>({ queryKey: ["/api/admin/links"] });

  const publishedCount = posts?.filter((p) => p.status === "published").length || 0;
  const draftCount = posts?.filter((p) => p.status === "draft").length || 0;

  const stats = [
    { label: "Published", value: publishedCount, icon: FileText, color: "text-green-600 dark:text-green-400" },
    { label: "Drafts", value: draftCount, icon: FileText, color: "text-amber-600 dark:text-amber-400" },
    { label: "Categories", value: categories?.length || 0, icon: FolderOpen, color: "text-blue-600 dark:text-blue-400" },
    { label: "Tags", value: tags?.length || 0, icon: Tag, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <h1 className="text-xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <Link href="/admin/posts/new">
            <Button size="sm" data-testid="button-new-post">
              <Plus className="w-4 h-4 mr-1" /> New Post
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-card-border bg-card p-4" data-testid={`stat-${stat.label.toLowerCase()}`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Recent Posts</h2>
          {posts && posts.length > 0 ? (
            <div className="rounded-md border border-card-border bg-card divide-y divide-border">
              {posts.slice(0, 5).map((post) => (
                <Link key={post.id} href={`/admin/posts/${post.id}/edit`}>
                  <div className="flex items-center justify-between gap-2 p-3 hover-elevate cursor-pointer" data-testid={`row-post-${post.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(post.updatedAt)}</p>
                    </div>
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="shrink-0 text-xs">
                      {post.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No posts yet. Create your first one!</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
