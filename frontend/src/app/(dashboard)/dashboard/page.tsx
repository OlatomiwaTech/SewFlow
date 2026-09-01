"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, Building2, UserCheck, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { user, business } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is an overview of your workspace at <strong className="text-foreground">{business?.name}</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Account & Business Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Business</span>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xl font-bold">{business?.name}</p>
          <p className="text-xs text-muted-foreground">
            Currency: {business?.currency} | Timezone: {business?.timezone}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Logged in User</span>
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xl font-bold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">Access Role</span>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xl font-bold">{user?.role}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role === "OWNER" ? "Full administrative access" : "Staff access"}
          </p>
        </div>
      </div>

      {/* Management Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/customers"
          className="group rounded-xl border bg-card p-6 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-primary" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              Manage →
            </span>
          </div>
          <h2 className="text-xl font-bold">Customer Management</h2>
          <p className="text-sm text-muted-foreground">
            View customer directory, manage tailoring measurements, contact info, and customer history.
          </p>
        </Link>
      </div>
    </div>
  );
}
