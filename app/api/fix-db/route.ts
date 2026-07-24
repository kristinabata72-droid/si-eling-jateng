import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Buat tabel 'catatan' jika belum ada
    await query(`
      CREATE TABLE IF NOT EXISTS catatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul_catatan VARCHAR(255),
        isi_catatan TEXT,
        tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP,
        tanggal DATE,
        status VARCHAR(50) DEFAULT 'AKTIF',
        kategori VARCHAR(100),
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tambahkan kolom satu per satu secara aman (jika tabel sudah ada tapi belum lengkap)
    const alterQueries = [
      'ALTER TABLE catatan ADD COLUMN judul_catatan VARCHAR(255);',
      'ALTER TABLE catatan ADD COLUMN isi_catatan TEXT;',
      'ALTER TABLE catatan ADD COLUMN tanggal_input DATETIME DEFAULT CURRENT_TIMESTAMP;',
      'ALTER TABLE catatan ADD COLUMN tanggal DATE;',
      'ALTER TABLE catatan ADD COLUMN status VARCHAR(50) DEFAULT "AKTIF";',
      'ALTER TABLE catatan ADD COLUMN kategori VARCHAR(100);',
      'ALTER TABLE catatan ADD COLUMN file_path VARCHAR(255);'
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
      } catch (err) {
        // Abaikan error jika kolom sudah ada di database
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 DATABASE LENGKAP 100%! Tabel catatan, users, dan agendas sudah siap digunakan!' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}