import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import type { PostWithRelations } from "@shared/schema";

export default function SearchPage() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  useEffect(() => {
    const p = new URLSearchParams(searchParams);
    const q = p.get("q") || "";
    setQuery(q);
    setActiveQuery(q);
  }, [searchParams]);

  const { data: results, isLoading } = useQuery<PostWithRelations[]>({
    queryKey: [`/api/search?q=${encodeURIComponent(activeQuery)}`],
    enabled: activeQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" data-testid="text-search-title">Search</h1>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mb-8" data-testid="form-search">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-page"
            />
          </div>
          <Button type="submit" data-testid="button-search-page">Search</Button>
        </form>

        {activeQuery && (
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-search-results">
            {isLoading ? "Searching..." : `${results?.length || 0} results for "${activeQuery}"`}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : activeQuery ? (
          <p className="text-center py-16 text-muted-foreground">No results found.</p>
        ) : null}
      </div>
    </PublicLayout>
  );
}
