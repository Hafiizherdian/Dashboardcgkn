"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ApiData = {
  labels: string[];
  sales: number[];
  visitors: number[];
};

export default function ChartCard({ title = "Sales & Visitors", dataOverride, variant = 'mixed' }: { title?: string; dataOverride?: any | null; variant?: 'mixed' | 'bar' | 'pareto' | 'stacked' | 'heatmap' | 'small-multiples' | 'area-windows' }) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (dataOverride) {
      setData(dataOverride);
      return;
    }
    async function load() {
      const res = await fetch('/api/data');
      if (!res.ok) return;
      const json: any = await res.json();
      setData(json);
    }
    load();
  }, [dataOverride]);

  if (!data)
    return (
      <div className="p-6 bg-white rounded-lg shadow-md flex items-center justify-center min-h-[160px]">
        <div className="text-sm text-gray-500">Loading chart…</div>
      </div>
    );

  // Helper: number formatting
  const fmt = (v: number) => (Number.isFinite(v) ? Number(v).toLocaleString() : String(v));

  // Sparkline small SVG component
  const Sparkline = ({ series = [] as number[] }: { series: number[] }) => {
    if (!series || series.length === 0) return <div className="text-xs text-gray-400">no data</div>;
    const w = 120, h = 32, pad = 2;
    const max = Math.max(...series), min = Math.min(...series);
    const pts = series.map((v, i) => {
      const x = (i / Math.max(1, series.length - 1)) * (w - pad * 2) + pad;
      const y = max === min ? h / 2 : (1 - (v - min) / (max - min)) * (h - pad * 2) + pad;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    const fillPath = `0,${h} ${pts} ${w},${h}`;
    return (
      <svg width={w} height={h} className="inline-block align-middle" viewBox={`0 0 ${w} ${h}`}>
        <polyline fill={"rgba(59,130,246,0.1)"} stroke={"none"} points={fillPath} />
        <polyline fill={'none'} stroke={'rgba(59,130,246,0.9)'} strokeWidth={1.2} points={pts} />
      </svg>
    );
  };

  // Heatmap grid (simple CSS table)
  const HeatmapGrid = ({ rows = [], cols = [], matrix = [[0]] }: { rows: string[]; cols: string[]; matrix: number[][] }) => {
    const flat = matrix.flat();
    const max = Math.max(...flat, 1);
    const getColor = (v: number) => {
      const t = Math.max(0, Math.min(1, v / max));
      // green -> yellow -> red scale
      const r = Math.round(255 * t);
      const g = Math.round(200 * (1 - t));
      return `rgb(${r},${g},50)`;
    };
    return (
      <div className="overflow-auto">
        <table className="table-auto border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left">City \ Product</th>
              {cols.map(c => <th key={c} className="p-1 text-left">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r}>
                <td className="p-1 pr-2 font-medium">{r}</td>
                {cols.map((c, j) => (
                  <td key={c} className="p-1">
                    <div className="w-20 h-6 rounded" style={{ background: getColor(matrix[i]?.[j] ?? 0) }} title={`${matrix[i]?.[j] ?? 0}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Main rendering per variant
  if (variant === 'pareto') {
    // Expect data: { labels: string[], values: number[] }
    const labels = data.labels ?? [];
    const values = data.values ?? data.sales ?? [];
    const pairs = labels.map((l: string, i: number) => ({ label: l, value: values[i] ?? 0 })).sort((a: any,b:any)=>b.value-a.value);
    const sortedLabels = pairs.map((p:any)=>p.label);
    const sortedVals = pairs.map((p:any)=>p.value);
    const total = sortedVals.reduce((s:any,v:any)=>s+v,0)||1;
    let cum = 0;
    const cumPct = sortedVals.map((v:any) => { cum += v; return +(cum/total*100).toFixed(2); });

    const chartData = {
      labels: sortedLabels,
      datasets: [
        { type: 'bar' as const, label: 'Omzet', data: sortedVals, backgroundColor: 'rgba(34,197,94,0.9)', borderRadius: 4 },
        { type: 'line' as const, label: 'Cumulative %', data: cumPct, borderColor: 'rgba(245,158,11,0.95)', backgroundColor: 'rgba(245,158,11,0.12)', yAxisID: 'y1', tension: 0.3 },
      ],
    };
    const options = {
      responsive: true,
      interaction: { mode: 'index' as const, intersect: false },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v:any)=>fmt(Number(v)) } },
        y1: { position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { callback: (v:any)=>`${v}%` } }
      },
      plugins: { legend: { position: 'top' as const }, title: { display: true, text: title }, tooltip: { callbacks: { label: (ctx:any)=>`${ctx.dataset.label}: ${ctx.parsed.y ?? ctx.parsed}` } } }
    };

    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <div className="min-h-[220px]">
          <Bar data={chartData as any} options={options as any} />
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    // Expect data: { labels: string[], datasets: {label,data,backgroundColor}[] }
    const labels = data.labels ?? [];
    const datasets = data.datasets ?? [];
    const chartData = { labels, datasets };
    const options = { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (v:any)=>fmt(Number(v)) } } }, plugins: { title: { display: true, text: title } } };
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <div className="min-h-[220px]">
          <Bar data={chartData as any} options={options as any} />
        </div>
      </div>
    );
  }

  if (variant === 'heatmap') {
    const rows = data.rows ?? [];
    const cols = data.cols ?? [];
    const matrix = data.matrix ?? [];
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <HeatmapGrid rows={rows} cols={cols} matrix={matrix} />
      </div>
    );
  }

  if (variant === 'small-multiples') {
    const items: { label: string; series: number[] }[] = data.items ?? [];
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(it => (
            <div key={it.label} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium truncate" title={it.label}>{it.label}</div>
                <div className="text-gray-500">{fmt((it.series[it.series.length-1]||0))}</div>
              </div>
              <Sparkline series={it.series} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'area-windows') {
    // Expect data: { labels: string[], l4w: number[], c4w: number[] }
    const labels = data.labels ?? [];
    const l4w = data.l4w ?? [];
    const c4w = data.c4w ?? [];
    const chartData = { labels, datasets: [ { label: 'L4W', data: l4w, borderColor: 'rgba(34,197,94,0.95)', backgroundColor: 'rgba(34,197,94,0.12)', fill: true }, { label: 'C4W', data: c4w, borderColor: 'rgba(59,130,246,0.95)', backgroundColor: 'rgba(59,130,246,0.12)', fill: true } ] };
    const options = { responsive: true, interaction: { mode: 'index' as const, intersect: false }, scales: { y: { ticks: { callback: (v:any)=>fmt(Number(v)) } } }, plugins: { title: { display: true, text: title } } };
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        </div>
        <div className="min-h-[220px]">
          <Bar data={chartData as any} options={options as any} />
        </div>
      </div>
    );
  }

  // Default mixed/bar chart (backward compatible)
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Sales',
        data: data.sales,
        backgroundColor: 'rgba(34,197,94,0.9)',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: variant === 'mixed' ? 'line' as const : 'bar' as const,
        label: 'Visitors',
        data: data.visitors,
        borderColor: 'rgba(59,130,246,0.95)',
        backgroundColor: variant === 'mixed' ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.6)',
        tension: 0.35,
        pointRadius: 3,
        yAxisID: 'y1',
        fill: variant === 'mixed',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    stacked: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) { return Number(value).toLocaleString(); }
        }
      },
      y1: {
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: function (value: any) { return Number(value).toLocaleString(); }
        }
      }
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const val = context.parsed.y ?? context.parsed;
            return `${context.dataset.label}: ${Number(val).toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md transition-transform duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="min-h-[220px]">
        <Bar data={chartData as any} options={options as any} />
      </div>
    </div>
  );
}