import Link from "next/link";
import { Users, ArrowRight, Scissors } from "lucide-react";

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-12 space-y-8">
      <header className="space-y-2 border-b pb-6">
        <div className="flex items-center gap-3">
          <Scissors className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">SewFlow</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Operating system for modern tailoring businesses.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/customers"
          className="group p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-primary" />
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <h2 className="text-2xl font-semibold">Customers</h2>
          <p className="text-muted-foreground text-sm">
            Manage customer profiles, contact details, and tailoring measurement histories.
          </p>
        </Link>
      </div>
    </main>
  );
}
