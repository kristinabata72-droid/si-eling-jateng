import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Tambah kolom tanggal_input jika belum ada
    try {
      await query(`
        ALTER TABLE catatan 
        ADD COLUMN tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP;
      `);
    } catch (e) {
      // Abaikan jika kolom sudah ada
    }

    // 2. Jaga-jaga untuk kolom judul_catatan
    try {
      await query(`
        ALTER TABLE catatan 
        ADD COLUMN judul_catatan VARCHAR(255);
      `);
    } catch (e) {
      // Abaikan jika kolom sudah ada
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 BERHASIL! Kolom tanggal_input dan judul_catatan sudah siap di database.' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}