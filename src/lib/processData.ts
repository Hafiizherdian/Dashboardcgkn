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
  WeekStart?: string; // ISO date or string
  Year: number;
  // quantitative fields that might exist in CSV
  Omzet?: number; // Omzet (Net)
  Jual_Bks?: number;
  Jual_Slop?: number;
  Jual_Bal?: number;
  Jual_Dos?: number;
  Quantity?: number;
  // optional other columns
  [key: string]: any;
};

export type ProductMetrics = {
  product: string;
  weeks: { year: number; week: number; omzet: number; quantity: number; weekStart?: string }[];
  avgOmzet: number;
  l4wOmzet: number; // last 4 weeks omzet sum
  c4wOmzet: number; // comparison 4 weeks prior to last 4 weeks
  growthL4WvsC4W: number; // percent
  growthYoY: number; // percent comparing last 4 weeks to same period previous year when possible
  totalQuantity: number;
};

function sum(arr: number[]) {
  return arr.reduce((s, x) => s + (x || 0), 0);
}

// Normalize raw parsed CSV object into Row. Accepts several possible column names.
export function normalizeRaw(raw: any): Row | null {
  if (!raw) return null;
  const get = (keys: string[]) => {
    for (const k of keys) {
      if (k in raw && raw[k] !== undefined && raw[k] !== null && raw[k] !== '') return raw[k];
      const lower = Object.keys(raw).find((rk) => rk.toLowerCase().trim() === k.toLowerCase().trim());
      if (lower) return raw[lower];
    }
    return undefined;
  };

  const product = get(['Product', 'produk', 'Produk']);
  if (!product) return null;

  const weekNumber = Number(get(['WeekNumber', 'Minggu', 'MingguNumber', 'week', 'weeknumber']) ?? NaN);
  const yearRaw = Number(get(['Year', 'Tahun', 'tahun']) ?? NaN);
  const weekStart = get(['WeekStart', 'Tanggal', 'tanggal', 'Date']) as string | undefined;

  // If no explicit Year provided, try to infer from the Tanggal/WeekStart date
  let inferredYear = isNaN(yearRaw) ? undefined : yearRaw;
  if ((inferredYear === undefined || isNaN(inferredYear)) && weekStart) {
    const d = new Date(String(weekStart));
    if (!isNaN(d.getTime())) inferredYear = d.getFullYear();
  }

  const omzetRaw = get(['Omzet (Net)', 'Omzet (Nett)', 'Omzet', 'OmzetNet', 'omzet']) as any;
  const omzet = omzetRaw !== undefined ? Number(String(omzetRaw).replace(/[^0-9.-]+/g, '')) : 0;

  const jual_bks = Number(get(['Jual (Bungkus Nett)', 'Jual (Bks N)', 'Jual_Bks', 'jual_bks', 'Bks', 'BKS']) ?? 0);
  const jual_slop = Number(get(['Jual (Slop Nett)', 'Jual (Slop N)', 'Jual_Slop', 'jual_slop']) ?? 0);
  const jual_bal = Number(get(['Jual (Bal Nett)', 'Jual (Bal Net)', 'Jual_Bal', 'jual_bal']) ?? 0);
  const jual_dos = Number(get(['Jual (Dos N)', 'Jual_Dos', 'jual_dos']) ?? 0);

  const quantity = (Number(jual_bks) || 0) + (Number(jual_slop) || 0) + (Number(jual_bal) || 0) + (Number(jual_dos) || 0);

  return {
    Product: String(product).trim(),
    WeekNumber: isNaN(weekNumber) ? 0 : weekNumber,
    WeekStart: weekStart,
    Year: inferredYear ?? new Date().getFullYear(),
    Omzet: isNaN(omzet) ? 0 : omzet,
    Jual_Bks: jual_bks,
    Jual_Slop: jual_slop,
    Jual_Bal: jual_bal,
    Jual_Dos: jual_dos,
    Quantity: quantity,
    raw: raw,
  } as Row;
}

export function processRows(rows: Row[]): ProductMetrics[] {
  // Group by product
  const grouped = new Map<string, Row[]>();
  rows.forEach((r) => {
    if (!r || !r.Product) return;
    if (!grouped.has(r.Product)) grouped.set(r.Product, []);
    grouped.get(r.Product)!.push(r);
  });

  const results: ProductMetrics[] = [];

  for (const [product, items] of grouped.entries()) {
    // sort by year then week
    const weeks = items
      .slice()
      .sort((a, b) => (a.Year === b.Year ? a.WeekNumber - b.WeekNumber : a.Year - b.Year))
      .map((r) => ({ year: r.Year, week: r.WeekNumber, omzet: r.Omzet ?? 0, quantity: (r.Quantity ?? 0), weekStart: r.WeekStart }));

    const omzetArray = weeks.map((w) => w.omzet);
    const avgOmzet = omzetArray.length ? sum(omzetArray) / omzetArray.length : 0;

    // Compute L4W (last 4 weeks from the latest available week)
    const lastIdx = weeks.length - 1;
    const l4wArr = weeks.slice(Math.max(0, lastIdx - 3), lastIdx + 1).map((w) => w.omzet);
    const l4wOmzet = sum(l4wArr);

    // C4W is the 4 weeks immediately before the L4W
    const c4Start = Math.max(0, lastIdx - 7);
    const c4wArr = weeks.slice(c4Start, Math.max(0, lastIdx - 3)).map((w) => w.omzet);
    const c4wOmzet = sum(c4wArr);

    const growthL4WvsC4W = c4wOmzet === 0 ? (l4wOmzet === 0 ? 0 : -100) : ((l4wOmzet - c4wOmzet) / Math.abs(c4wOmzet)) * 100;

    // YoY growth: compare last 4 weeks sum with same weeks previous year (approx)
    const lastWeeks = weeks.slice(Math.max(0, lastIdx - 3), lastIdx + 1);
    const prevYearOmzet = lastWeeks
      .map((lw) => {
        const found = weeks.find((w) => w.week === lw.week && w.year === lw.year - 1);
        return found ? found.omzet : null;
      })
      .filter((x) => x !== null) as number[];

    let growthYoY = 0;
    if (prevYearOmzet.length >= 1) {
      const sumPrev = sum(prevYearOmzet);
      growthYoY = sumPrev === 0 ? (l4wOmzet === 0 ? 0 : -100) : ((l4wOmzet - sumPrev) / Math.abs(sumPrev)) * 100;
    }

    const totalQuantity = sum(weeks.map((w) => w.quantity));

    results.push({
      product,
      weeks,
      avgOmzet: +avgOmzet.toFixed(2),
      l4wOmzet: +l4wOmzet.toFixed(2),
      c4wOmzet: +c4wOmzet.toFixed(2),
      growthL4WvsC4W: +growthL4WvsC4W.toFixed(2),
      growthYoY: +growthYoY.toFixed(2),
      totalQuantity: +totalQuantity.toFixed(2),
    });
  }

  // Sort results by total recent omzet desc
  results.sort((a, b) => b.l4wOmzet - a.l4wOmzet);

  return results;
}
