import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { PostWithRelations } from "@shared/schema";

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [page, setPage] = useState(1);

  const { data: posts, isLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts"],
  });

  const totalPosts = posts?.length || 0;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);
  const paginatedPosts = posts?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-blog-title">Blog</h1>
          <p className="text-muted-foreground mt-1">Tips, reviews, and stories from the road.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8" data-testid="pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
