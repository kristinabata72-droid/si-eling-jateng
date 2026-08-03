import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

// 📧 1. Konfigurasi Pengirim Email (Nodemailer Transporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Email Gmail pengirim
    pass: process.env.GMAIL_PASS, // App Password Gmail (16 Karakter)
  },
});

// 🚀 Fungsi Kirim Email Instan (Wajib Await)
async function sendEmailNotification(judul: string, isi: string, tanggal: string) {
  try {
    const receiverEmail = process.env.GMAIL_RECEIVER || process.env.GMAIL_USER;
    
    await transporter.sendMail({
      from: `"Si Eling Jateng" <${process.env.GMAIL_USER}>`,
      to: receiverEmail,
      subject: `🔔 Catatan Arsip Baru: ${judul}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #0d6efd; margin-bottom: 10px;">Si Eling Jateng - Notifikasi Catatan Resmi</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>Judul Catatan / Kegiatan:</strong></p>
          <p style="font-size: 16px; font-weight: bold; color: #333;">${judul}</p>
          
          <p><strong>Waktu Input:</strong> ${tanggal}</p>
          
          <p><strong>Isi Lengkap Catatan:</strong></p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0d6efd; border-radius: 4px; white-space: pre-line;">
            ${isi}
          </div>
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <small style="color: #888;">Pesan otomatis dari Sistem Agenda & Dokumentasi Catatan Resmi Sekda Jateng.</small>
        </div>
      `,
    });
    console.log('✅ Email notifikasi berhasil dikirim seketika!');
  } catch (error) {
    console.error('❌ Gagal mengirim email notifikasi:', error);
  }
}

// Helper untuk format tanggal
const formatTanggalMySQL = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) {
    const sisa = new Date();
    return `${sisa.getFullYear()}-${String(sisa.getMonth() + 1).padStart(2, '0')}-${String(sisa.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 1. [GET] : Mengambil semua data catatan dari MySQL
export async function GET() {
  try {
    const catatan = await query('SELECT * FROM catatan ORDER BY id DESC');
    return NextResponse.json({ success: true, data: catatan }, { status: 200 });
  } catch (error: any) {
    console.error('GET Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil catatan: ' + error.message }, { status: 500 });
  }
}

// 2. [POST] : Menambahkan catatan baru ke MySQL + Kirim Email Seketika
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, judul_catatan, tanggal_input, isi_catatan, files } = body;

    // Validasi input wajib (Judul dan Isi wajib diisi)
    if (!judul_catatan || !isi_catatan) {
      return NextResponse.json({ success: false, message: 'Judul dan Isi catatan wajib diisi!' }, { status: 400 });
    }

    const filesString = files ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;
    const tanggalBersih = formatTanggalMySQL(tanggal_input);
    const waktuTampil = tanggal_input || tanggalBersih;

    // Simpan ke Database Aiven
    if (id) {
      await query(
        `INSERT INTO catatan (id, judul_catatan, tanggal_input, isi_catatan, files) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, judul_catatan, waktuTampil, isi_catatan, filesString]
      );
    } else {
      await query(
        `INSERT INTO catatan (judul_catatan, tanggal_input, isi_catatan, files) 
         VALUES (?, ?, ?, ?)`,
        [judul_catatan, waktuTampil, isi_catatan, filesString]
      );
    }

    // 📩 KIRIM EMAIL REALTME (AWAIT memastikan email terkirim sebelum respon balik dikirim ke browser)
    await sendEmailNotification(judul_catatan, isi_catatan, waktuTampil);

    return NextResponse.json({ success: true, message: 'Catatan berhasil disimpan & Email notifikasi terkirim!' }, { status: 201 });
  } catch (error: any) {
    console.error('POST Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan catatan: ' + error.message }, { status: 500 });
  }
}

// 3. [PUT] : Mengubah/Update catatan
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, judul_catatan, tanggal_input, isi_catatan, files } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID catatan wajib disertakan!' }, { status: 400 });
    }

    const filesString = files ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;
    const tanggalBersih = formatTanggalMySQL(tanggal_input);

    await query(
      `UPDATE catatan SET 
        judul_catatan = ?, tanggal_input = ?, isi_catatan = ?, files = ? 
       WHERE id = ?`,
      [judul_catatan, tanggal_input || tanggalBersih, isi_catatan, filesString, id]
    );

    return NextResponse.json({ success: true, message: 'Catatan berhasil diperbarui!' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui catatan: ' + error.message }, { status: 500 });
  }
}

// 4. [DELETE] : Menghapus catatan
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID catatan wajib dicantumkan!' }, { status: 400 });
    }

    await query('DELETE FROM catatan WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Catatan berhasil dihapus!' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus catatan: ' + error.message }, { status: 500 });
  }
}