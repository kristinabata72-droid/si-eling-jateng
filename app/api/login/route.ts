import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // 1. Kembali menggunakan 'query' bawaan Anda

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 2. Menggunakan fungsi query bawaan Anda yang sudah aman
    const rows = (await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    )) as any[];

    // 3. Jika data ditemukan di database
    if (rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Login berhasil!',
        user: { 
          id: rows[0].id, 
          username: rows[0].username 
        }
      }, { status: 200 });
    } else {
      // 4. Jika data tidak cocok
      return NextResponse.json({
        success: false,
        message: 'Username atau password salah.'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    }, { status: 500 });
  }
}