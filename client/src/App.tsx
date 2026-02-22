import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import HomePage from "@/pages/home";
import BlogPage from "@/pages/blog";
import PostPage from "@/pages/post";
import CategoryPage from "@/pages/category";
import TagPage from "@/pages/tag";
import SearchPage from "@/pages/search";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PrivacyPage from "@/pages/privacy";
import AffiliateDisclosurePage from "@/pages/affiliate-disclosure";
import ToolsPage from "@/pages/tools";
import RouteLogConverterPage from "@/pages/route-log-converter";

import AdminLoginPage from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPostsPage from "@/pages/admin/posts";
import PostEditorPage from "@/pages/admin/post-editor";
import CategoriesAdminPage from "@/pages/admin/categories-admin";
import TagsAdminPage from "@/pages/admin/tags-admin";
import LinksAdminPage from "@/pages/admin/links-admin";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/post/:slug" component={PostPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/tag/:slug" component={TagPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/affiliate-disclosure" component={AffiliateDisclosurePage} />
      <Route path="/tools" component={ToolsPage} />
      <Route path="/tools/route-log-converter" component={RouteLogConverterPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard">{() => <ProtectedRoute component={AdminDashboard} />}</Route>
      <Route path="/admin/posts">{() => <ProtectedRoute component={AdminPostsPage} />}</Route>
      <Route path="/admin/posts/new">{() => <ProtectedRoute component={PostEditorPage} />}</Route>
      <Route path="/admin/posts/:id/edit">{() => <ProtectedRoute component={PostEditorPage} />}</Route>
      <Route path="/admin/categories">{() => <ProtectedRoute component={CategoriesAdminPage} />}</Route>
      <Route path="/admin/tags">{() => <ProtectedRoute component={TagsAdminPage} />}</Route>
      <Route path="/admin/links">{() => <ProtectedRoute component={LinksAdminPage} />}</Route>
      <Route path="/admin">{() => <Redirect to="/admin/dashboard" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
