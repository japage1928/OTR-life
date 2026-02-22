import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Truck, Wrench } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { PostWithRelations, Category } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithRelations[]>({
    queryKey: ["/api/posts"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <PublicLayout>
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/20 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Life on the Road</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
              Your Trucking Companion for Better Rides
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl" data-testid="text-hero-subtitle">
              Tips, reviews, and tools to make every mile more comfortable, safe, and profitable.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md pt-2" data-testid="form-hero-search">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Button type="submit" data-testid="button-search-submit">Search</Button>
            </form>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-1 mb-6">
          <h2 className="text-xl font-bold" data-testid="text-latest-posts">Latest Posts</h2>
          <Link href="/blog">
            <Button variant="ghost" size="sm" data-testid="link-view-all">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {postsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.slice(0, 6).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for new content!</p>
          </div>
        )}
      </section>

      {categories && categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold mb-4" data-testid="text-categories">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Badge variant="secondary" className="cursor-pointer text-sm py-1 px-3" data-testid={`badge-home-cat-${cat.id}`}>
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-md border border-card-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold" data-testid="text-tools-cta">Trucker Tools</h2>
              <p className="text-sm text-muted-foreground">
                Free calculators, converters, and tools designed for life on the road.
              </p>
              <Link href="/tools">
                <Button size="sm" data-testid="link-explore-tools">
                  Explore Tools <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}
