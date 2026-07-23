import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Menambahkan kolom judul_catatan tanpa klausa IF NOT EXISTS
    await query(`
      ALTER TABLE catatan 
      ADD COLUMN judul_catatan VARCHAR(255) AFTER id;
    `);

    return NextResponse.json({ 
      success: true, 
      message: '🎉 BERHASIL! Kolom judul_catatan sudah ditambahkan ke database Aiven.' 
    });
  } catch (error: any) {
    // Jika kolom sudah terlanjur ada, tangkap error-nya & anggap berhasil
    if (error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('Duplicate column')) {
      return NextResponse.json({ 
        success: true, 
        message: '🎉 Kolom judul_catatan sudah ada & database siap digunakan!' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}