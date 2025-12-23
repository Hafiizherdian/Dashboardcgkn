import { describe, it, expect } from 'vitest';
import { normalizeRaw, processRows } from './processData';

describe('normalizeRaw', () => {
  it('parses typical raw row', () => {
    const raw = {
      'Minggu': '1',
      'Tanggal': '2025-01-06',
      'Produk': 'Aqua',
      'Kategori': 'Minuman',
      'No. Customer': 'C001',
      'Customer': 'Toko X',
      'Tipe Customer': 'Retail',
      'Salesman': 'Andi',
      'Desa': 'Desa A',
      'Kecamatan': 'Kec A',
      'Kota': 'Kota A',
      'Jual (Bungkus Nett)': '10',
      'Jual (Slop Nett)': '2',
      'Jual (Bal Nett)': '0',
      'Omzet (Nett)': '120000'
    };

    const r = normalizeRaw(raw as any);
    expect(r).not.toBeNull();
    if (!r) return;
    expect(r.Product).toBe('Aqua');
    expect(r.Jual_Bks).toBe(10);
    expect(r.Jual_Slop).toBe(2);
    expect(r.Quantity).toBe(12);
    expect(r.Omzet).toBe(120000);
    expect(r.WeekNumber).toBe(1);
    expect(r.Year).toBe(2025);
  });
});

describe('processRows', () => {
  it('computes avg and L4W sums correctly', () => {
    const rows = [
      { Product: 'X', WeekNumber: 1, Year: 2024, Omzet: 100, Quantity: 10 },
      { Product: 'X', WeekNumber: 2, Year: 2024, Omzet: 200, Quantity: 20 },
      { Product: 'X', WeekNumber: 3, Year: 2024, Omzet: 300, Quantity: 30 },
      { Product: 'X', WeekNumber: 4, Year: 2024, Omzet: 400, Quantity: 40 },
      { Product: 'X', WeekNumber: 5, Year: 2024, Omzet: 500, Quantity: 50 },
    ];

    const metrics = processRows(rows as any);
    expect(metrics.length).toBe(1);
    const m = metrics[0];
    expect(m.product).toBe('X');
    // avg is (100+200+300+400+500)/5
    expect(m.avgOmzet).toBe(300);
    // last 4 weeks should be weeks 2-5 => 200+300+400+500 = 1400
    expect(m.l4wOmzet).toBe(1400);
    expect(m.totalQuantity).toBe(150);
  });
});