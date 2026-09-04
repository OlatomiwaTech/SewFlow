"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Scissors,
  Users,
  LayoutDashboard,
  LogOut,
  Loader2,
  Building2,
  Menu,
  X,
  Package,
  Ruler,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, business, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  // Primary navigation destinations
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/orders", label: "Production", icon: Scissors },
    { href: "/inventory", label: "Materials", icon: Package },
    { href: "/measurements", label: "Measurements", icon: Ruler },
    { href: "/payments", label: "Payments", icon: CreditCard },
  ];

  // Highest priority destinations for mobile bottom navigation
  const bottomNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/orders", label: "Production", icon: Scissors },
    { href: "/inventory", label: "Materials", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-20 md:pb-0">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 lg:gap-6 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg lg:text-xl shrink-0">
              <Scissors className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              <span>SewFlow</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 overflow-x-auto no-scrollbar py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-semibold truncate max-w-[120px] lg:max-w-[200px]">
                  {user?.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 font-bold rounded bg-primary/10 text-primary shrink-0">
                  {user?.role}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px] lg:max-w-[180px]">{business?.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-background px-4 py-3 space-y-3 shadow-lg">
            <div className="pb-2 border-b text-xs text-muted-foreground flex justify-between items-center">
              <div>
                <div className="font-semibold text-foreground text-sm">{user?.name}</div>
                <div className="text-xs">{business?.name}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-destructive flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>

            <nav className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for Instant Access */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t md:hidden flex items-center justify-around py-1.5 px-1 shadow-lg">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button to trigger Mobile Dropdown */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
            mobileMenuOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="More navigation options"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span>More</span>
        </button>
      </nav>

      {/* Main App Content */}
      <main className="container mx-auto max-w-6xl px-4 py-6 md:py-8 flex-1">{children}</main>
    </div>
  );
}
