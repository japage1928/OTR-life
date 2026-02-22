import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const { login, isLoggingIn, loginError, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    setLocation("/admin/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password }).then(() => {
      setLocation("/admin/dashboard");
    }).catch(() => {
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center mx-auto">
            <Truck className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold" data-testid="text-login-title">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your blog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-login">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              data-testid="input-login-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              data-testid="input-login-password"
            />
          </div>

          {loginError && (
            <p className="text-sm text-destructive" data-testid="text-login-error">
              {loginError.message.includes("401") ? "Invalid email or password" : "Login failed. Please try again."}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoggingIn} data-testid="button-login">
            <LogIn className="w-4 h-4 mr-2" />
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
