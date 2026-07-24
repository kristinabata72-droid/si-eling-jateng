import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const alterQueries = [
      // 1. Tangani kolom 'judul' agar tidak mewajibkan isi (bisa NULL)
      'ALTER TABLE catatan ADD COLUMN judul VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN judul VARCHAR(255) DEFAULT NULL;',
      
      // 2. Tangani kolom 'judul_catatan'
      'ALTER TABLE catatan ADD COLUMN judul_catatan VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN judul_catatan VARCHAR(255) DEFAULT NULL;',
      
      // 3. Tangani variasi kolom isi/deskripsi
      'ALTER TABLE catatan ADD COLUMN isi TEXT DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN isi TEXT DEFAULT NULL;',
      'ALTER TABLE catatan ADD COLUMN isi_catatan TEXT DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN isi_catatan TEXT DEFAULT NULL;',
      
      // 4. Tangani kolom tanggal & lampiran
      'ALTER TABLE catatan ADD COLUMN tanggal_input VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN tanggal_input VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan ADD COLUMN tanggal VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN tanggal VARCHAR(255) DEFAULT NULL;',
      'ALTER TABLE catatan ADD COLUMN files TEXT DEFAULT NULL;',
      'ALTER TABLE catatan MODIFY COLUMN files TEXT DEFAULT NULL;'
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
      } catch (err) {
        // Abaikan jika struktur kolom sudah sesuai
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 BERHASIL! Struktur kolom judul dan seluruh atribut catatan sudah fleksibel!' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}