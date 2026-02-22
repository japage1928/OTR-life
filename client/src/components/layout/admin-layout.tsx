import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, FileText, FolderOpen, Tag, LinkIcon, LogOut, Truck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/tags", label: "Tags", icon: Tag },
  { href: "/admin/links", label: "Link Library", icon: LinkIcon },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-1 h-14">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="link-back-to-site">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Site
                </Button>
              </Link>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                  <Truck className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <nav className="border-b border-border bg-card/50 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 py-1" data-testid="nav-admin">
              {adminLinks.map((link) => {
                const isActive = location === link.href || (link.href === "/admin/posts" && location.startsWith("/admin/posts"));
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="shrink-0"
                      data-testid={`link-admin-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <link.icon className="w-4 h-4 mr-1.5" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
