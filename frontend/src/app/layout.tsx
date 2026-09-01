import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "SewFlow",
  description: "Garment production and order management system for modern tailoring businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          {children}
        </div>
      </body>
    </html>
  );
}
