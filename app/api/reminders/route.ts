import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 1. [GET] : Mengambil semua data agenda untuk ditampilkan di layar dashboard
export async function GET() {
  try {
    // Kita ambil data agenda dan tambahkan ALIAS 'waktuTarget' 
    // supaya klop dengan kode frontend Anda yang membaca 'item.waktuTarget'
    const reminders = await query(
      `SELECT id, judul, waktu_target, waktu_target AS waktuTarget, 
              kategori, sudah_bunyi, dokumentasi, disposisi, 
              email_tujuan, wa_tujuan, files 
       FROM reminders ORDER BY waktu_target ASC`
    );
    
    return NextResponse.json({ success: true, data: reminders }, { status: 200 });
  } catch (error: any) {
    console.error('GET Reminders Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data agenda: ' + error.message }, 
      { status: 500 }
    );
  }
}

// 2. [POST] : Menyimpan data agenda baru (Kodingan BARU yang sudah kebal eror Truncated)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, judul, waktu_target, kategori, dokumentasi, disposisi, email_tujuan, wa_tujuan, files } = body;

    // Validasi input wajib
    if (!judul || !waktu_target) {
      return NextResponse.json(
        { success: false, message: 'Judul dan Waktu Target wajib diisi!' }, 
        { status: 400 }
      );
    }

    // --- PERBAIKAN UTAMA: Menggunakan JavaScript Date agar aman dari format browser apa pun ---
    const d = new Date(waktu_target);
    
    // Proteksi jika tanggal rusak / tidak valid
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal/waktu yang dikirim dari form tidak valid!' }, 
        { status: 400 }
      );
    }

    // Susun manual ke format YYYY-MM-DD HH:mm:ss yang disukai MySQL
    const tahun   = d.getFullYear();
    const bulan   = String(d.getMonth() + 1).padStart(2, '0');
    const tanggal = String(d.getDate()).padStart(2, '0');
    const jam     = String(d.getHours()).padStart(2, '0');
    const menit   = String(d.getMinutes()).padStart(2, '0');
    const detik   = String(d.getSeconds()).padStart(2, '0');

    const waktuBersih = `${tahun}-${bulan}-${tanggal} ${jam}:${menit}:${detik}`;
    // -----------------------------------------------------------------------------------------

    // Konversi objek files ke string jika ada lampiran berkas
    const filesString = files ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;

    // Jalankan query ke tabel reminders
    await query(
      `INSERT INTO reminders (id, judul, waktu_target, kategori, sudah_bunyi, dokumentasi, disposisi, email_tujuan, wa_tujuan, files) 
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [id || null, judul, waktuBersih, kategori, dokumentasi, disposisi, email_tujuan, wa_tujuan, filesString]
    );

    return NextResponse.json(
      { success: true, message: 'Agenda berhasil disimpan!' }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('POST Reminders Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan data ke database: ' + error.message }, 
      { status: 500 }
    );
  }
}