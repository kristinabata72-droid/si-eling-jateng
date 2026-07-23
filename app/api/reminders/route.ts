import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';

// 1. [GET] : Mengambil semua data agenda
export async function GET() {
  try {
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

// 2. [POST] : Menyimpan data agenda BARU + Mengirim Email Otomatis
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

    // Format tanggal/waktu
    const d = new Date(waktu_target);
    if (isNaN(d.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal/waktu tidak valid!' }, 
        { status: 400 }
      );
    }

    const tahun   = d.getFullYear();
    const bulan   = String(d.getMonth() + 1).padStart(2, '0');
    const tanggal = String(d.getDate()).padStart(2, '0');
    const jam     = String(d.getHours()).padStart(2, '0');
    const menit   = String(d.getMinutes()).padStart(2, '0');
    const detik   = String(d.getSeconds()).padStart(2, '0');

    const waktuBersih = `${tahun}-${bulan}-${tanggal} ${jam}:${menit}:${detik}`;
    const filesString = files ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;

    // A. SIMPAN KE DATABASE
    await query(
      `INSERT INTO reminders (id, judul, waktu_target, kategori, sudah_bunyi, dokumentasi, disposisi, email_tujuan, wa_tujuan, files) 
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [id || null, judul, waktuBersih, kategori, dokumentasi, disposisi, email_tujuan, wa_tujuan, filesString]
    );

    // B. KIRIM EMAIL OTOMATIS (Menggunakan variabel SMTP_USER & SMTP_PASS)
    if (email_tujuan) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER, // Sesuai Vercel & .env
            pass: process.env.SMTP_PASS, // Sesuai Vercel & .env
          },
        });

        const mailOptions = {
          from: `"SI-ELING JATENG" <${process.env.SMTP_USER}>`,
          to: email_tujuan,
          subject: `📌 [Pengingat Agenda] ${judul}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0A2540; margin-top: 0;">SI-ELING JATENG</h2>
              <p style="font-size: 14px; color: #475569;">Halo, Anda telah dijadwalkan untuk agenda berikut:</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0A2540; border-radius: 4px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">${judul}</h3>
                <p style="margin: 5px 0; font-size: 13px;"><strong>🕒 Waktu Target:</strong> ${waktuBersih} WIB</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>🏷️ Kategori:</strong> ${kategori || '-'}</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>📝 Disposisi:</strong> ${disposisi || '-'}</p>
              </div>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
                Email ini dikirimkan secara otomatis oleh Sistem SI-ELING JATENG. Mohon tidak membalas email ini.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email pemberitahuan agenda berhasil dikirim ke: ${email_tujuan}`);
      } catch (emailErr: any) {
        console.error('⚠️ Agenda tersimpan, namun gagal mengirim email:', emailErr.message);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Agenda berhasil disimpan & pemberitahuan email diproses!' }, 
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

// 3. [DELETE] : Menghapus data agenda berdasarkan ID
export async function DELETE(request: Request) {
  try {
    let id: string | null = null;
    
    // Cek ID dari URL query (?id=xxx)
    const { searchParams } = new URL(request.url);
    id = searchParams.get('id');

    // Jika tidak ada di URL, cek dari Body Request JSON
    if (!id) {
      try {
        const body = await request.json();
        id = body.id || null;
      } catch (e) {
        // Abaikan jika tidak ada body JSON
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID agenda wajib disertakan!' }, 
        { status: 400 }
      );
    }

    // Eksekusi Hapus dari tabel reminders
    await query('DELETE FROM reminders WHERE id = ?', [id]);

    return NextResponse.json(
      { success: true, message: 'Agenda berhasil dihapus!' }, 
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE Reminders Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus agenda: ' + error.message }, 
      { status: 500 }
    );
  }
}