"use client";

import React, { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import ChartCard from "@/components/ChartCard";
import MetricCard from "@/components/MetricCard";
import { processRows, ProductMetrics, normalizeRaw } from "@/lib/processData";
import type { Row } from "@/lib/processData";

export default function DashboardClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<ProductMetrics[]>([]);
  const [apiChartData, setApiChartData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const [filters, setFilters] = useState(() => ({
    category: "",
    salesman: "",
    kota: "",
    tipeCustomer: "",
    product: "",
    fromDate: "",
    toDate: "",
  }));

  // Persist sorting and filters UX
  const [sortKey, setSortKey] = useState<'l4wOmzet' | 'avgOmzet' | 'totalQuantity'>(() => {
    try { const s = localStorage.getItem('dashboard.sort.key'); return (s as any) || 'l4wOmzet'; } catch { return 'l4wOmzet'; }
  });
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>(() => {
    try { const s = localStorage.getItem('dashboard.sort.dir'); return (s as any) || 'desc'; } catch { return 'desc'; }
  });


  async function fetchFromApi() {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.metrics)) {
        setRows([]);
        setMetrics(json.metrics);
        setApiChartData(null);
        setLastRefreshed(new Date().toISOString());
      } else if (Array.isArray(json.rows)) {
        const normalized: Row[] = (json.rows as any[])
          .map((r) => normalizeRaw(r))
          .filter((r): r is Row => !!r);
        setRows(normalized);
        setMetrics(processRows(normalized));
        setApiChartData(null);
        setLastRefreshed(new Date().toISOString());
      } else if (json.labels && json.sales) {
        setApiChartData(json);
        setRows([]);
        setMetrics([]);
        setLastRefreshed(new Date().toISOString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFromApi(); }, []);

  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // read persisted UX state on mount (safe in client component)
  useEffect(() => {
    try {
      const s = localStorage.getItem('dashboard.filters.open');
      if (s !== null) setIsFiltersOpen(s === '1');
      const f = localStorage.getItem('dashboard.filters');
      if (f) setFilters(JSON.parse(f));
      const sk = localStorage.getItem('dashboard.sort.key');
      if (sk) setSortKey(sk as any);
      const sd = localStorage.getItem('dashboard.sort.dir');
      if (sd) setSortDir(sd as any);
    } catch (e) {
      // ignore
    }
  }, []);

  // persist filters and open state
  useEffect(() => {
    try {
      localStorage.setItem('dashboard.filters', JSON.stringify(filters));
    } catch (e) {}
  }, [filters]);

  useEffect(() => {
    try { localStorage.setItem('dashboard.filters.open', isFiltersOpen ? '1' : '0'); } catch (e) {}
  }, [isFiltersOpen]);

  useEffect(() => {
    try { localStorage.setItem('dashboard.sort.key', sortKey); } catch (e) {}
  }, [sortKey]);
  useEffect(() => {
    try { localStorage.setItem('dashboard.sort.dir', sortDir); } catch (e) {}
  }, [sortDir]);

  const filtersOpen = isFiltersOpen;

  const categories = useMemo(() => Array.from(new Set(rows.map(r => r.Category).filter(Boolean))), [rows]);
  const salesmen = useMemo(() => Array.from(new Set(rows.map(r => r.Salesman).filter(Boolean))), [rows]);
  const kotas = useMemo(() => Array.from(new Set(rows.map(r => r.Kota).filter(Boolean))), [rows]);
  const tipeCustomers = useMemo(() => Array.from(new Set(rows.map(r => r.TipeCustomer).filter(Boolean))), [rows]);

  // Apply filters
  const filteredMetrics = useMemo(() => {
    if (rows.length > 0) {
      const filteredRows = rows.filter((r) => {
        if (filters.category && (r.Category ?? "") !== filters.category) return false;
        if (filters.salesman && (r.Salesman ?? "") !== filters.salesman) return false;
        if (filters.kota && (r.Kota ?? "") !== filters.kota) return false;
        if (filters.tipeCustomer && (r.TipeCustomer ?? "") !== filters.tipeCustomer) return false;
        if (filters.product && !(r.Product ?? "").toLowerCase().includes(filters.product.toLowerCase())) return false;
        if (filters.fromDate && r.WeekStart) {
          const d = new Date(r.WeekStart);
          if (isFinite(d.getTime())) {
            if (d < new Date(filters.fromDate)) return false;
          }
        }
        if (filters.toDate && r.WeekStart) {
          const d = new Date(r.WeekStart);
          if (isFinite(d.getTime())) {
            const to = new Date(filters.toDate);
            to.setHours(23,59,59,999);
            if (d > to) return false;
          }
        }
        return true;
      });
      return processRows(filteredRows);
    }

    // If we only have precomputed metrics, apply a simple filter by product name
    return metrics.filter((m) => (filters.product ? m.product.toLowerCase().includes(filters.product.toLowerCase()) : true));
  }, [rows, metrics, filters]);

  // Sorting
  const sortedMetrics = useMemo(() => {
    const arr = filteredMetrics.slice();
    arr.sort((a,b) => (sortDir === 'desc' ? (b[sortKey] as number) - (a[sortKey] as number) : (a[sortKey] as number) - (b[sortKey] as number)));
    return arr;
  }, [filteredMetrics, sortKey, sortDir]);

  const topProducts = useMemo(() => sortedMetrics.slice(0, 8), [sortedMetrics]);

  const chartData = React.useMemo(() => ({
    labels: topProducts.map((m) => m.product),
    sales: topProducts.map((m) => m.l4wOmzet),
    visitors: topProducts.map((m) => m.totalQuantity),
  }), [topProducts]);

  // Pareto (top-products L4W) - labels and values
  const paretoData = React.useMemo(() => ({ labels: chartData.labels, values: chartData.sales }), [chartData]);

  // Stacked: Omzet by Category, stacked by Product (top products)
  const stackedData = React.useMemo(() => {
    if (!rows || rows.length === 0) return { labels: [], datasets: [] };
    const cats = Array.from(new Set(rows.map(r => r.Category).filter(Boolean)));
    const prods = topProducts.map(p => p.product);
    const datasets = prods.map((prod, idx) => {
      const data = cats.map(c => rows.filter(r => r.Product === prod && r.Category === c).reduce((s, r) => s + (r.Omzet || 0), 0));
      const bg = [`rgba(34,197,94,0.${7 - (idx % 6)})`, `rgba(59,130,246,0.${5 + (idx % 4)})`][idx % 2];
      return { label: prod, data, backgroundColor: bg };
    });
    return { labels: cats, datasets };
  }, [rows, topProducts]);

  // Heatmap: Kota × Product
  const heatmapData = React.useMemo(() => {
    if (!rows || rows.length === 0) return { rows: [], cols: [], matrix: [] };
    const cities = Array.from(new Set(rows.map(r => r.Kota).filter(Boolean)));
    const prods = topProducts.map(p => p.product);
    const matrix = cities.map(c => prods.map(p => rows.filter(r => r.Kota === c && r.Product === p).reduce((s, r) => s + (r.Omzet || 0), 0)));
    return { rows: cities, cols: prods, matrix };
  }, [rows, topProducts]);

  // Small multiples: sparklines per product (use metrics.weeks)
  const smallMultiplesData = React.useMemo(() => {
    const items: { label: string; series: number[] }[] = [];
    const n = 12;
    filteredMetrics.slice(0, 12).forEach(m => {
      const series = (m.weeks || []).slice(-n).map(w => w.omzet);
      items.push({ label: m.product, series });
    });
    return { items };
  }, [filteredMetrics]);

  // Area: compute weekly aggregates and rolling 4-week windows (L4W vs C4W)
  const areaWindowsData = React.useMemo(() => {
    if (!rows || rows.length === 0) return { labels: [], l4w: [], c4w: [] };
    // group by WeekStart (or Year-week fallback)
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = r.WeekStart ? r.WeekStart : `${r.Year}-W${String(r.WeekNumber)}`;
      map.set(k, (map.get(k) || 0) + (r.Omzet || 0));
    });
    const entries = Array.from(map.entries()).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    const labels = entries.map(e => e[0]);
    const vals = entries.map(e => e[1]);
    const l4w: number[] = [];
    const c4w: number[] = [];
    for (let i = 0; i < vals.length; i++) {
      const lStart = Math.max(0, i - 3);
      const lSum = vals.slice(lStart, i + 1).reduce((s, v) => s + v, 0);
      l4w.push(lSum);
      const cStart = Math.max(0, i - 7);
      const cSum = vals.slice(cStart, Math.max(0, i - 3)).reduce((s, v) => s + v, 0);
      c4w.push(cSum);
    }
    return { labels, l4w, c4w };
  }, [rows]);

  const totals = useMemo(() => ({
    products: sortedMetrics.length,
    totalL4W: sortedMetrics.reduce((s, m) => s + (m.l4wOmzet || 0), 0),
    totalQty: sortedMetrics.reduce((s, m) => s + (m.totalQuantity || 0), 0),
  }), [sortedMetrics]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Products" value={String(totals.products)} />
        <MetricCard title="Total L4W Omzet" value={totals.totalL4W.toFixed(0)} />
        <MetricCard title="Total Quantity" value={totals.totalQty.toFixed(0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filters sidebar */}
        <div className="md:col-span-1 p-4 bg-white rounded border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">Filters</div>
            <button className="text-xs text-indigo-600 hover:underline md:hidden" onClick={() => setIsFiltersOpen(o => !o)} aria-expanded={filtersOpen}>{filtersOpen ? 'Hide' : 'Show'}</button>
          </div>

          <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${filtersOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!filtersOpen}>
            <div className="space-y-3 py-1">
              <select className="w-full p-2 border rounded text-sm" value={filters.category} onChange={(e) => setFilters(f => ({...f, category: e.target.value}))}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select className="w-full p-2 border rounded text-sm" value={filters.salesman} onChange={(e) => setFilters(f => ({...f, salesman: e.target.value}))}>
                <option value="">All Salesmen</option>
                {salesmen.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select className="w-full p-2 border rounded text-sm" value={filters.kota} onChange={(e) => setFilters(f => ({...f, kota: e.target.value}))}>
                <option value="">All Cities</option>
                {kotas.map(k => <option key={k} value={k}>{k}</option>)}
              </select>

              <select className="w-full p-2 border rounded text-sm" value={filters.tipeCustomer} onChange={(e) => setFilters(f => ({...f, tipeCustomer: e.target.value}))}>
                <option value="">All Customer Types</option>
                {tipeCustomers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <input className="w-full p-2 border rounded text-sm" placeholder="Product search" value={filters.product} onChange={(e) => setFilters(f => ({...f, product: e.target.value}))} />

              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="p-2 border rounded w-full text-sm" value={filters.fromDate} onChange={(e)=>setFilters(f=>({...f, fromDate: e.target.value}))} />
                <input type="date" className="p-2 border rounded w-full text-sm" value={filters.toDate} onChange={(e)=>setFilters(f=>({...f, toDate: e.target.value}))} />
              </div>

              <div className="flex items-center gap-3">
                <button className="px-3 py-2 rounded bg-gray-50 border text-sm hover:bg-gray-100" onClick={() => setFilters({category:'',salesman:'',kota:'',tipeCustomer:'',product:'',fromDate:'',toDate:''})}>Clear</button>
                <div className="ml-auto text-sm text-gray-600">Sorted by:
                  <select className="ml-2 p-1 border rounded text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
                    <option value="l4wOmzet">L4W Omzet</option>
                    <option value="avgOmzet">AVG Omzet</option>
                    <option value="totalQuantity">Total Qty</option>
                  </select>
                  <button className="ml-2 px-2 py-1 border rounded text-sm" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>{sortDir === 'desc' ? '↓' : '↑'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main area: actions + charts */}
        <div className="md:col-span-3 p-4 bg-white rounded border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">Charts</div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">{loading ? 'Loading...' : lastRefreshed ? `Last refreshed ${new Date(lastRefreshed).toLocaleString()}` : 'Not loaded'}</div>
              <button className="px-3 py-2 rounded border" onClick={() => { if (!sortedMetrics || sortedMetrics.length === 0) return; const header = ['Product','avgOmzet','l4wOmzet','c4wOmzet','growthL4WvsC4W','growthYoY','totalQuantity']; const csv = [header.join(',')].concat(sortedMetrics.map((m:any) => [m.product,m.avgOmzet,m.l4wOmzet,m.c4wOmzet,m.growthL4WvsC4W,m.growthYoY,m.totalQuantity].join(','))).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'metrics.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid gap-6">
              <ChartCard title="Top products (L4W Omzet)" dataOverride={{ labels: chartData.labels, sales: chartData.sales, visitors: chartData.visitors }} />
              <ChartCard title="Omzet by Category (stacked)" variant="stacked" dataOverride={stackedData} />
            </div>

            <div className="md:col-span-1 grid gap-6">
              <ChartCard title="Top products Pareto" variant="pareto" dataOverride={{ labels: paretoData.labels, values: paretoData.values }} />
              <ChartCard title="Overview (API)" dataOverride={apiChartData} />
            </div>

            <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
              <ChartCard title="Recent windows (L4W vs C4W)" variant="area-windows" dataOverride={areaWindowsData} />
              <ChartCard title="Heatmap (City × Product)" variant="heatmap" dataOverride={heatmapData} />
            </div>

            <div className="md:col-span-1">
              <ChartCard title="Small multiples (sparklines)" variant="small-multiples" dataOverride={smallMultiplesData} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Top products (L4W Omzet)" dataOverride={{ labels: chartData.labels, sales: chartData.sales, visitors: chartData.visitors }} />
        <ChartCard title="Top products Pareto" variant="pareto" dataOverride={{ labels: paretoData.labels, values: paretoData.values }} />
        <ChartCard title="Overview (API)" dataOverride={apiChartData} />

        <ChartCard title="Omzet by Category (stacked)" variant="stacked" dataOverride={stackedData} />
        <ChartCard title="Heatmap (City × Product)" variant="heatmap" dataOverride={heatmapData} />
        <ChartCard title="Recent windows (L4W vs C4W)" variant="area-windows" dataOverride={areaWindowsData} />

        <ChartCard title="Small multiples (sparklines)" variant="small-multiples" dataOverride={smallMultiplesData} />
      </div>

      <div>
        <DataTable metrics={sortedMetrics} />
      </div>
    </div>
  );
}
