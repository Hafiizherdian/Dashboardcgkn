import { NextResponse } from 'next/server';

export async function GET() {
  // Mocked rows matching the spreadsheet columns you provided
  const rows = [
    // Product A - spread over several weeks / years
    { 'Minggu': 48, 'Tanggal': '2024-11-25', 'Produk': 'Tali Roso Sejati 12K', 'Kategori': 'Sigaret Kretek Tangan (SKT)', 'No. Customer': 'C001', 'Customer': 'Toko X', 'Tipe Customer': 'Retail', 'Salesman': 'Andi', 'Desa': 'Desa A', 'Kecamatan': 'Kec A', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 120, 'Jual (Slop Nett)': 0, 'Jual (Bal Nett)': 0, 'Omzet (Nett)': 240000 },
    { 'Minggu': 49, 'Tanggal': '2024-12-02', 'Produk': 'Tali Roso Sejati 12K', 'Kategori': 'Sigaret Kretek Tangan (SKT)', 'No. Customer': 'C002', 'Customer': 'Toko Y', 'Tipe Customer': 'Wholesale', 'Salesman': 'Budi', 'Desa': 'Desa B', 'Kecamatan': 'Kec B', 'Kota': 'Kota B', 'Jual (Bungkus Nett)': 150, 'Jual (Slop Nett)': 0, 'Jual (Bal Nett)': 0, 'Omzet (Nett)': 300000 },
    { 'Minggu': 50, 'Tanggal': '2024-12-09', 'Produk': 'Tali Roso Sejati 12K', 'Kategori': 'Sigaret Kretek Tangan (SKT)', 'No. Customer': 'C003', 'Customer': 'Toko Z', 'Tipe Customer': 'Retail', 'Salesman': 'Andi', 'Desa': 'Desa C', 'Kecamatan': 'Kec C', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 130, 'Jual (Slop Nett)': 10, 'Jual (Bal Nett)': 0, 'Omzet (Nett)': 260000 },
    { 'Minggu': 51, 'Tanggal': '2024-12-16', 'Produk': 'Tali Roso Sejati 12K', 'Kategori': 'Sigaret Kretek Tangan (SKT)', 'No. Customer': 'C004', 'Customer': 'Toko Q', 'Tipe Customer': 'Retail', 'Salesman': 'Citra', 'Desa': 'Desa D', 'Kecamatan': 'Kec D', 'Kota': 'Kota C', 'Jual (Bungkus Nett)': 140, 'Jual (Slop Nett)': 5, 'Jual (Bal Nett)': 0, 'Omzet (Nett)': 280000 },
    { 'Minggu': 1, 'Tanggal': '2025-01-06', 'Produk': 'Tali Roso Sejati 12K', 'Kategori': 'Sigaret Kretek Tangan (SKT)', 'No. Customer': 'C005', 'Customer': 'Toko W', 'Tipe Customer': 'Retail', 'Salesman': 'Andi', 'Desa': 'Desa E', 'Kecamatan': 'Kec E', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 160, 'Jual (Slop Nett)': 0, 'Jual (Bal Nett)': 0, 'Omzet (Nett)': 320000 },

    // Product B
    { 'Minggu': 48, 'Tanggal': '2024-11-25', 'Produk': 'ON BOLD 20F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C010', 'Customer': 'Depot A', 'Tipe Customer': 'Wholesale', 'Salesman': 'Budi', 'Desa': 'Desa A', 'Kecamatan': 'Kec A', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 50, 'Jual (Slop Nett)': 30, 'Jual (Bal Nett)': 10, 'Omzet (Nett)': 400000 },
    { 'Minggu': 49, 'Tanggal': '2024-12-02', 'Produk': 'ON BOLD 20F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C011', 'Customer': 'Depot B', 'Tipe Customer': 'Wholesale', 'Salesman': 'Budi', 'Desa': 'Desa B', 'Kecamatan': 'Kec B', 'Kota': 'Kota B', 'Jual (Bungkus Nett)': 60, 'Jual (Slop Nett)': 20, 'Jual (Bal Nett)': 15, 'Omzet (Nett)': 450000 },
    { 'Minggu': 50, 'Tanggal': '2024-12-09', 'Produk': 'ON BOLD 20F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C012', 'Customer': 'Depot C', 'Tipe Customer': 'Wholesale', 'Salesman': 'Citra', 'Desa': 'Desa C', 'Kecamatan': 'Kec C', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 55, 'Jual (Slop Nett)': 25, 'Jual (Bal Nett)': 12, 'Omzet (Nett)': 420000 },
    { 'Minggu': 51, 'Tanggal': '2024-12-16', 'Produk': 'ON BOLD 20F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C013', 'Customer': 'Depot D', 'Tipe Customer': 'Retail', 'Salesman': 'Andi', 'Desa': 'Desa D', 'Kecamatan': 'Kec D', 'Kota': 'Kota C', 'Jual (Bungkus Nett)': 65, 'Jual (Slop Nett)': 18, 'Jual (Bal Nett)': 10, 'Omzet (Nett)': 490000 },
    { 'Minggu': 1, 'Tanggal': '2025-01-06', 'Produk': 'ON BOLD 20F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C014', 'Customer': 'Depot E', 'Tipe Customer': 'Retail', 'Salesman': 'Budi', 'Desa': 'Desa E', 'Kecamatan': 'Kec E', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 70, 'Jual (Slop Nett)': 22, 'Jual (Bal Nett)': 14, 'Omzet (Nett)': 540000 },

    // Product C
    { 'Minggu': 50, 'Tanggal': '2024-12-09', 'Produk': 'ON LINE FRESH GRAPE 16F', 'Kategori': 'Sigaret Kretek Mesin (SKM)', 'No. Customer': 'C020', 'Customer': 'Toko Beras', 'Tipe Customer': 'Retail', 'Salesman': 'Citra', 'Desa': 'Desa Z', 'Kecamatan': 'Kec Z', 'Kota': 'Kota B', 'Jual (Bungkus Nett)': 30, 'Jual (Slop Nett)': 0, 'Jual (Bal Nett)': 5, 'Omzet (Nett)': 150000 },
    { 'Minggu': 51, 'Tanggal': '2024-12-16', 'Produk': 'ON LINE FRESH GRAPE 16F', 'Kategori': 'Sigaret Kretek Mesin (SKM', 'No. Customer': 'C021', 'Customer': 'Toko Beras B', 'Tipe Customer': 'Retail', 'Salesman': 'Andi', 'Desa': 'Desa Y', 'Kecamatan': 'Kec Y', 'Kota': 'Kota B', 'Jual (Bungkus Nett)': 28, 'Jual (Slop Nett)': 2, 'Jual (Bal Nett)': 6, 'Omzet (Nett)': 140000 },
    { 'Minggu': 1, 'Tanggal': '2025-01-06', 'Produk': 'ON LINE FRESH GRAPE 16F', 'Kategori': 'Sigaret Kretek Mesin (SKM', 'No. Customer': 'C022', 'Customer': 'Toko Beras C', 'Tipe Customer': 'Retail', 'Salesman': 'Budi', 'Desa': 'Desa X', 'Kecamatan': 'Kec X', 'Kota': 'Kota A', 'Jual (Bungkus Nett)': 35, 'Jual (Slop Nett)': 0, 'Jual (Bal Nett)': 8, 'Omzet (Nett)': 175000 },
  ];

  return NextResponse.json({ rows });
}

