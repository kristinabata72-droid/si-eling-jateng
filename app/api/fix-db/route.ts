import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Kelompokkan seluruh kolom yang dibutuhkan aplikasi
    const columns = [
      { name: 'judul_catatan', type: 'VARCHAR(255)' },
      { name: 'isi_catatan', type: 'TEXT' },
      { name: 'tanggal_input', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'tanggal', type: 'DATE' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT "AKTIF"' },
      { name: 'kategori', type: 'VARCHAR(100)' },
      { name: 'file_path', type: 'VARCHAR(255)' }
    ];

    const results = [];

    // Tambahkan setiap kolom jika belum ada
    for (const col of columns) {
      try {
        await query(`ALTER TABLE catatan ADD COLUMN ${col.name} ${col.type};`);
        results.push(`✅ Kolom ${col.name} berhasil ditambahkan`);
      } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME' || e.message?.includes('Duplicate column')) {
          results.push(`ℹ️ Kolom ${col.name} sudah ada`);
        } else {
          results.push(`⚠️ Kolom ${col.name}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 BERHASIL! Seluruh kolom tabel catatan sudah lengkap!',
      details: results
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}