import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TableOfContents } from "@/components/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDate } from "@/lib/markdown";
import type { PostWithRelations } from "@shared/schema";

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery<PostWithRelations>({
    queryKey: ["/api/posts", slug],
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded mt-4" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist.</p>
          <Link href="/blog">
            <Button data-testid="button-back-to-blog">Back to Blog</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Blog
          </Button>
        </Link>

        <div className="mb-4 p-3 rounded-md bg-accent/50 border border-accent-border flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground" data-testid="text-affiliate-disclosure">
            Some links in this article may be affiliate links. We may earn a small commission at no extra cost to you. 
            <Link href="/affiliate-disclosure">
              <span className="text-primary ml-1 hover:underline">Learn more</span>
            </Link>
          </p>
        </div>

        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Badge variant="secondary" className="text-xs" data-testid={`badge-post-cat-${cat.id}`}>
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3" data-testid="text-post-title">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.publishedAt)}
            </span>
          )}
          {post.updatedAt && post.publishedAt && new Date(post.updatedAt) > new Date(post.publishedAt) && (
            <span className="text-xs">(Updated {formatDate(post.updatedAt)})</span>
          )}
        </div>

        {post.featuredImageUrl && (
          <div className="aspect-[16/9] overflow-hidden rounded-md mb-8">
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
              data-testid="img-post-featured"
            />
          </div>
        )}

        <div className="lg:hidden mb-6">
          <TableOfContents markdown={post.contentMd} />
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <MarkdownRenderer content={post.contentMd} />
          </div>
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              <TableOfContents markdown={post.contentMd} />
            </div>
          </aside>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Tags:</span>
              {post.tags.map((tag) => (
                <Link key={tag.id} href={`/tag/${tag.slug}`}>
                  <Badge variant="outline" className="text-xs" data-testid={`badge-post-tag-${tag.id}`}>
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </PublicLayout>
  );
}
