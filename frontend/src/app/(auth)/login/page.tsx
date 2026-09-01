"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Scissors, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-muted/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        <div className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight">
          <Scissors className="h-7 w-7 text-primary" />
          <span>SewFlow</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-muted-foreground">
          Welcome back! Manage your customers, measurements, and orders.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card p-8 shadow-sm rounded-xl border">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tailor@sewflow.com"
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register business
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
