"use client";
import React from "react";

export default function MetricCard({ title, value, change }: { title: string; value: string; change?: string }) {
  const positive = change && change.startsWith('+');
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-2xl sm:text-3xl font-semibold text-gray-900">{value}</div>
        {change && (
          <div className={`text-sm font-medium px-2 py-1 rounded ${positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
