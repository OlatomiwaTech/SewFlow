"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import type { ProductionMetrics } from "@/types/order";
import { Users, Plus, Building2, UserCheck, ShieldCheck, Scissors, AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, business } = useAuth();
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);

  useEffect(() => {
    apiClient
      .getProductionMetrics()
      .then((data) => setMetrics(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border bg-card p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Here is an overview of your fashion tailoring workspace at <strong className="text-foreground">{business?.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Scissors className="h-4 w-4" />
              Production Pipeline
            </Link>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Production Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Active Jobs</span>
              <Scissors className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono">{metrics.activeOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">In production pipeline</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Urgent Jobs</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-rose-600">{metrics.urgentOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">High / Urgent priority</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Completed</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-emerald-600">{metrics.completedOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Delivered to clients</div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Outstanding</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-amber-600">
              ₦{metrics.balanceOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Pending collection</div>
          </div>
        </div>
      )}

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

      {/* Management Quick Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/orders"
          className="group rounded-xl border bg-card p-6 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <Scissors className="h-8 w-8 text-primary" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center gap-1">
              Kanban Pipeline <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <h2 className="text-xl font-bold">Production Workflow</h2>
          <p className="text-sm text-muted-foreground">
            Track garment orders through stages (New, Cutting, Sewing, Fitting, Ready), update priorities, and log status history.
          </p>
        </Link>

        <Link
          href="/customers"
          className="group rounded-xl border bg-card p-6 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-primary" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <h2 className="text-xl font-bold">Customer Directory</h2>
          <p className="text-sm text-muted-foreground">
            View customer profile directory, record tailoring measurements, and manage customer orders and payments.
          </p>
        </Link>
      </div>
    </div>
  );
}
