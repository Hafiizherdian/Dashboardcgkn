"use client";
import React, { useState } from "react";
import { ProductMetrics } from "@/lib/processData";
import { Chart } from "react-chartjs-2";

export default function DataTable({ metrics }: { metrics: ProductMetrics[] }) {
  const [selected, setSelected] = useState<ProductMetrics | null>(null);

  const nf = new Intl.NumberFormat();

  return (
    <div className="p-2 bg-white rounded-lg shadow-md overflow-x-auto">
      <div className="w-full overflow-hidden rounded">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="bg-gray-50 text-gray-700 sticky top-0">
              <th className="p-2 text-left text-sm font-medium">Product</th>
              <th className="p-2 text-center text-sm font-medium">AVG</th>
              <th className="p-2 text-center text-sm font-medium">L4W</th>
              <th className="p-2 text-center text-sm font-medium">C4W</th>
              <th className="p-2 text-center text-sm font-medium">Δ L4W vs C4W</th>
              <th className="p-2 text-center text-sm font-medium">YoY %</th>
              <th className="p-2 text-center text-sm font-medium">Qty</th>
              <th className="p-2 text-center text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, idx) => (
              <tr key={m.product} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 text-stone-800 text-sm`}>
                <td className="p-2 text-left font-medium">{m.product}</td>
                <td className="p-2 text-center">{nf.format(Math.round(m.avgOmzet))}</td>
                <td className="p-2 text-center">{nf.format(Math.round(m.l4wOmzet))}</td>
                <td className="p-2 text-center">{nf.format(Math.round(m.c4wOmzet))}</td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${m.growthL4WvsC4W < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{m.growthL4WvsC4W}%</span>
                </td>
                <td className="p-2 text-center"><span className={`${m.growthYoY < 0 ? 'text-red-700' : 'text-green-700'}`}>{m.growthYoY}%</span></td>
                <td className="p-2 text-center">{nf.format(Math.round(m.totalQuantity))}</td>
                <td className="p-2 text-center">
                  <button className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setSelected(m)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mt-3 p-3 border rounded-lg bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
            <div className="text-lg font-semibold text-gray-800">{selected.product}</div>
            <div className="mt-2 sm:mt-0 flex items-center gap-4">
              <div className="text-sm text-gray-600">AVG Omzet: <span className="font-medium text-gray-900">{nf.format(Math.round(selected.avgOmzet))}</span></div>
              <button className="text-sm text-gray-500" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>

          <div className="w-full min-h-[220px]">
            <Chart
              type="line"
              data={{
                labels: selected.weeks.map((w) => `${w.year}-W${w.week}`),
                datasets: [
                  {
                    label: 'Omzet',
                    data: selected.weeks.map((w) => w.omzet),
                    borderColor: 'rgba(59,130,246,0.9)',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    tension: 0.3,
                    pointRadius: 3
                  },
                  {
                    label: 'Quantity',
                    data: selected.weeks.map((w) => w.quantity),
                    borderColor: 'rgba(34,197,94,0.9)',
                    backgroundColor: 'rgba(34,197,94,0.08)',
                    tension: 0.3,
                    pointRadius: 3
                  }
                ]
              }}
              options={{ responsive: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
