"use client";
import React from "react";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="font-semibold text-lg">Analytics Dashboard</div>
          <nav className="flex items-center gap-6">
            <a className="text-sm hover:underline" href="/dashboard">Dashboard</a>
            <a className="text-sm hover:underline" href="/api/data">API</a>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
