import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Menambahkan kolom judul_catatan ke database Aiven
    await query(`
      ALTER TABLE catatan 
      ADD COLUMN IF NOT EXISTS judul_catatan VARCHAR(255) AFTER id;
    `);
    return NextResponse.json({ 
      success: true, 
      message: '🎉 BERHASIL! Kolom judul_catatan sudah ditambahkan ke database Aiven.' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}