import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Akun default untuk login (Bisa disesuaikan dengan data admin Anda)
    const USER_ADMIN = 'admin';
    const PASS_ADMIN = 'admin123';

    if (username === USER_ADMIN && password === PASS_ADMIN) {
      const response = NextResponse.json(
        { message: 'Login berhasil' },
        { status: 200 }
      );

      // Set cookie penanda login otomatis dari server Next.js
      response.cookies.set('isLoggedIn', 'true', {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 hari
      });

      return response;
    } else {
      return NextResponse.json(
        { message: 'Username atau password salah!' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}