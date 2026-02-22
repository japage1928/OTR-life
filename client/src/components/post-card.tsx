import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/markdown";
import type { PostWithRelations } from "@shared/schema";

export function PostCard({ post }: { post: PostWithRelations }) {
  return (
    <article className="group" data-testid={`card-post-${post.id}`}>
      <Link href={`/post/${post.slug}`}>
        <div className="hover-elevate rounded-md border border-card-border bg-card p-0 cursor-pointer transition-all">
          {post.featuredImageUrl && (
            <div className="aspect-[16/9] overflow-hidden rounded-t-md">
              <img
                src={post.featuredImageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                data-testid={`img-post-${post.id}`}
              />
            </div>
          )}
          <div className="p-4 space-y-2">
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.categories.map((cat) => (
                  <Badge key={cat.id} variant="secondary" className="text-xs" data-testid={`badge-category-${cat.id}`}>
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}
            <h3 className="font-semibold text-base leading-snug line-clamp-2" data-testid={`text-title-${post.id}`}>
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-excerpt-${post.id}`}>
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.publishedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-md border border-card-border bg-card animate-pulse">
      <div className="aspect-[16/9] bg-muted rounded-t-md" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-24" />
      </div>
    </div>
  );
}
