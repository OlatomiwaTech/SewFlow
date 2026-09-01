"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Scissors, Users, LayoutDashboard, LogOut, Loader2, Building2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, business, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <Scissors className="h-6 w-6 text-primary" />
              <span>SewFlow</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 font-bold rounded bg-primary/10 text-primary">
                  {user?.role}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{business?.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8 flex-1">{children}</main>
    </div>
  );
}
