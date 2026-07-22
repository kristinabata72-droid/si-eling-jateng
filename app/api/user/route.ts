import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Menggunakan 'query' sesuai isi db.ts

export async function PUT(request: Request) {
  try {
    const { id, newUsername, newPassword } = await request.json();

    // 1. Validasi input sederhana
    if (!id || !newUsername || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'ID, Username baru, dan Password baru wajib diisi!'
      }, { status: 400 });
    }

    // 2. Jalankan perintah SQL UPDATE untuk mengubah data di database
    await query(
      'UPDATE users SET username = ?, password = ? WHERE id = ?',
      [newUsername, newPassword, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Username dan password berhasil diperbarui!'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update User Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server saat memperbarui data.' 
    }, { status: 500 });
  }
}