"use client";
import React from "react";

// DataUploader removed — dashboard is API-driven. Keep a lightweight stub for reference.
export default function DataUploader({ onData }: { onData?: (...args: any[]) => void }) {
  return (
    <div className="p-4 bg-yellow-50 rounded border text-sm text-yellow-800">
      The CSV uploader has been removed from the live dashboard (API-driven). If you need it, re-enable the uploader or restore from git history.
    </div>
  );
}
