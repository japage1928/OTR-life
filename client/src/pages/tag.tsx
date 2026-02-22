import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { PostWithRelations, Tag } from "@shared/schema";

export default function TagPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery<{ tag: Tag; posts: PostWithRelations[] }>({
    queryKey: ["/api/tags", slug, "posts"],
  });

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog
          </Button>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-tag-title">
          #{data?.tag?.name || "Tag"}
        </h1>
        <p className="text-muted-foreground mb-8">All posts with this tag.</p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : data?.posts && data.posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center py-16 text-muted-foreground">No posts with this tag yet.</p>
        )}
      </div>
    </PublicLayout>
  );
}
