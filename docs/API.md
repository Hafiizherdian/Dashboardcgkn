# /api/data — API contract

This document describes the accepted response shapes for the dashboard endpoint `/api/data` used by the app in this repository.

## Overview
The dashboard accepts three main response shapes. The frontend (DashboardClient) will prefer `metrics[]` if present, otherwise will accept `rows[]` (spreadsheet-like raw rows which will be normalized + aggregated), otherwise will accept a simple time-series shape `{ labels, sales, visitors }` used for demo charts.

Supported shapes:
- rows[] — raw spreadsheet rows (recommended for server-side ingestion)
- metrics[] — pre-computed per-product metrics
- time-series — `{ labels, sales, visitors }` for quick charting

---

## 1) rows[] (recommended)
Use when your API returns raw rows that follow the spreadsheet structure.

Example row fields (common header names the normalizer recognizes):
- Minggu (week number)
- Tanggal (date string / week start)
- Produk (product)
- Kategori
- No. Customer (Id Customer)
- Customer
- Tipe Customer
- Salesman
- Desa
- Kecamatan
- Kota
- Jual (Bungkus Nett)
- Jual (Slop Nett)
- Jual (Bal Nett)
- Omzet (Nett)

Example response:

```json
{
  "rows": [
    {
      "Minggu": 51,
      "Tanggal": "2024-12-16",
      "Produk": "Aqua",
      "Kategori": "Minuman",
      "No. Customer": "C004",
      "Customer": "Toko Q",
      "Tipe Customer": "Retail",
      "Salesman": "Citra",
      "Desa": "Desa D",
      "Kecamatan": "Kec D",
      "Kota": "Kota C",
      "Jual (Bungkus Nett)": 140,
      "Jual (Slop Nett)": 5,
      "Jual (Bal Nett)": 0,
      "Omzet (Nett)": 280000
    }
  ]
}
```

How it's handled:
- Each row is passed to `normalizeRaw()` (see `src/lib/processData.ts`) which maps common header variants to the internal `Row` shape and extracts numeric values.
- `processRows()` aggregates rows per product and computes: `avgOmzet`, `l4wOmzet`, `c4wOmzet`, `growthL4WvsC4W`, `growthYoY`, `totalQuantity`.
- If `Year` is not provided, the normalizer will attempt to infer from `Tanggal`.

TypeScript interface (simplified):

```ts
export type Row = {
  Product: string;
  Category?: string;
  CustomerId?: string;
  Customer?: string;
  TipeCustomer?: string;
  Salesman?: string;
  Desa?: string;
  Kecamatan?: string;
  Kota?: string;
  WeekNumber: number;
  WeekStart?: string; // date string
  Year: number;
  Omzet?: number;
  Jual_Bks?: number;
  Jual_Slop?: number;
  Jual_Bal?: number;
  Jual_Dos?: number;
  Quantity?: number;
};
```

---

## 2) metrics[] (pre-computed)
If your backend already computes metrics per product, return `metrics` directly. Dashboard prefers this format and will render it immediately.

Example:

```json
{
  "metrics": [
    {
      "product": "Aqua",
      "avgOmzet": 270000,
      "l4wOmzet": 1100000,
      "c4wOmzet": 900000,
      "growthL4WvsC4W": 22.22,
      "growthYoY": 5.0,
      "totalQuantity": 550
    }
  ]
}
```

TypeScript interface (simplified):

```ts
export type ProductMetrics = {
  product: string;
  weeks: { year: number; week: number; omzet: number; quantity: number; weekStart?: string }[];
  avgOmzet: number;
  l4wOmzet: number;
  c4wOmzet: number;
  growthL4WvsC4W: number;
  growthYoY: number;
  totalQuantity: number;
};
```

---

## 3) time-series (demo)
A simple shape for chart demos.

Example:

```json
{
  "labels": ["Mon","Tue","Wed"],
  "sales": [120, 200, 150],
  "visitors": [900, 1200, 1000]
}
```

The dashboard's `ChartCard` will use this shape if provided.

---

## Quick fetch example (client)

```ts
const res = await fetch('/api/data');
const json = await res.json();
if (Array.isArray(json.metrics)) {
  // use metrics directly
} else if (Array.isArray(json.rows)) {
  // normalize + process rows
} else if (json.labels && json.sales) {
  // render as time series
}
```

---

## Notes & tips
- Numbers should be plain numeric values if possible; the normalizer will strip common currency formatting (commas, currency symbols) when parsing `Omzet`.
- If your data includes `Tanggal` (ISO date), `WeekNumber` and `Year` can be inferred for aggregation.
- If you prefer, precompute `metrics[]` server-side and return it directly — this avoids client-side aggregation.

---

## Where to look in this repo
- Normalizer & aggregator: `src/lib/processData.ts`
- Dashboard client: `src/app/dashboard/DashboardClient.tsx`
