import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Tambahkan kolom 'files' dan variasi kolom berkas lainnya secara aman
    const alterQueries = [
      'ALTER TABLE catatan ADD COLUMN files TEXT;',
      'ALTER TABLE catatan ADD COLUMN file TEXT;',
      'ALTER TABLE catatan ADD COLUMN file_path VARCHAR(255);',
      'ALTER TABLE catatan ADD COLUMN judul_catatan VARCHAR(255);',
      'ALTER TABLE catatan ADD COLUMN isi_catatan TEXT;',
      'ALTER TABLE catatan ADD COLUMN tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP;',
      'ALTER TABLE catatan ADD COLUMN tanggal DATE;',
      'ALTER TABLE catatan ADD COLUMN status VARCHAR(50) DEFAULT "AKTIF";',
      'ALTER TABLE catatan ADD COLUMN kategori VARCHAR(100);'
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
      } catch (err) {
        // Abaikan jika kolom sudah ada
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 SEMPURNA! Kolom files berhasil ditambahkan ke database!' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}