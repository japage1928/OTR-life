import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/markdown";
import { Save, Eye, ArrowLeft, Send } from "lucide-react";
import type { Post, Category, Tag } from "@shared/schema";

export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [status, setStatus] = useState("draft");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [autoSlug, setAutoSlug] = useState(true);

  const { data: existingPost } = useQuery<Post & { categoryIds: number[]; tagIds: number[] }>({
    queryKey: ["/api/admin/posts", id],
    enabled: !isNew,
  });

  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: tags } = useQuery<Tag[]>({ queryKey: ["/api/tags"] });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setExcerpt(existingPost.excerpt || "");
      setMetaDescription(existingPost.metaDescription || "");
      setContentMd(existingPost.contentMd);
      setStatus(existingPost.status);
      setFeaturedImageUrl(existingPost.featuredImageUrl || "");
      setSelectedCategories(existingPost.categoryIds || []);
      setSelectedTags(existingPost.tagIds || []);
      setAutoSlug(false);
    }
  }, [existingPost]);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isNew) {
        const res = await apiRequest("POST", "/api/admin/posts", data);
        return await res.json();
      } else {
        const res = await apiRequest("PUT", `/api/admin/posts/${id}`, data);
        return await res.json();
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: isNew ? "Post created!" : "Post saved!" });
      if (isNew && result?.id) {
        setLocation(`/admin/posts/${result.id}/edit`);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error saving post", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = (newStatus?: string) => {
    const data = {
      title,
      slug,
      excerpt: excerpt || null,
      metaDescription: metaDescription || null,
      contentMd,
      status: newStatus || status,
      featuredImageUrl: featuredImageUrl || null,
      publishedAt: (newStatus === "published" || status === "published") ? new Date().toISOString() : null,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
    };
    saveMutation.mutate(data);
    if (newStatus) setStatus(newStatus);
  };

  const toggleCategory = (catId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/posts")} data-testid="button-back-posts">
              <ArrowLeft className="w-4 h-4 mr-1" /> Posts
            </Button>
            <Badge variant={status === "published" ? "default" : "secondary"} className="text-xs">
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleSave()} disabled={saveMutation.isPending} data-testid="button-save-draft">
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {status !== "published" && (
              <Button size="sm" onClick={() => handleSave("published")} disabled={saveMutation.isPending} data-testid="button-publish">
                <Send className="w-4 h-4 mr-1" /> Publish
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="post-slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
                data-testid="input-slug"
              />
            </div>

            <Tabs defaultValue="write" className="w-full">
              <TabsList>
                <TabsTrigger value="write" data-testid="tab-write">Write</TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-2">
                <Textarea
                  placeholder="Write your post content in Markdown..."
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="input-content"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[400px] rounded-md border border-card-border bg-card p-4">
                  {contentMd ? (
                    <MarkdownRenderer content={contentMd} />
                  ) : (
                    <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief summary..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                data-testid="input-excerpt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                placeholder="SEO description..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                data-testid="input-meta-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <Input
                id="featuredImage"
                placeholder="https://..."
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                data-testid="input-featured-image"
              />
              {featuredImageUrl && (
                <img src={featuredImageUrl} alt="Preview" className="rounded-md w-full aspect-video object-cover mt-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories?.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleCategory(cat.id)}
                    data-testid={`toggle-cat-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                ))}
                {(!categories || categories.length === 0) && (
                  <p className="text-xs text-muted-foreground">No categories yet</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag.id)}
                    data-testid={`toggle-tag-${tag.id}`}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {(!tags || tags.length === 0) && (
                  <p className="text-xs text-muted-foreground">No tags yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
