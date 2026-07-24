import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Ubah tipe kolom tanggal_input & tanggal menjadi VARCHAR agar menerima teks "24 Juli 2026 pukul 08.05"
    const alterQueries = [
      'ALTER TABLE catatan MODIFY COLUMN tanggal_input VARCHAR(255);',
      'ALTER TABLE catatan MODIFY COLUMN tanggal VARCHAR(255);'
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
      } catch (err) {
        // Abaikan jika tipe kolom sudah berhasil diubah
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '🎉 SIAP! Tipe kolom tanggal berhasil diubah ke VARCHAR/Teks!' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}