import nodemailer from 'nodemailer';

// Konfigurasi Transporter Nodemailer (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // port 587 menggunakan STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function kirimPengingat(data: { 
  judul: string; 
  waktu: string | number; 
  disposisi?: string; 
  email?: string;         
  wa?: string             
}) {
  let emailSuccess = false;
  let waSuccess = false;

  // 1. Format teks waktu agar rapi
  const waktuFormat = typeof data.waktu === 'number' 
    ? new Date(data.waktu).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
    : data.waktu;
    
  // 2. Format teks disposisi
  const teksDisposisi = data.disposisi ? data.disposisi : 'Tidak ada disposisi khusus.';

  // 3. Teks ringkasan untuk WhatsApp & Email Polos
  const teksPesan = `PENGINGAT AGENDA: Kegiatan "${data.judul}" akan dilaksanakan pada ${waktuFormat}. Disposisi: ${teksDisposisi}`;

  // ==========================================
  // BLOK 1: KIRIM EMAIL (Jika ada target email)
  // ==========================================
  if (data.email) {
    try {
      const emailPengirim = process.env.SMTP_USER || 'sarpras92@gmail.com';

      await transporter.sendMail({
        // PERBAIKAN 1: Gunakan email pengirim yang sesuai dengan akun login SMTP agar tidak ditolak Gmail
        from: `"SI-ELING JATENG" <${emailPengirim}>`, 
        to: data.email, 
        subject: `📌 [PENTING] Pengingat Agenda: ${data.judul}`,
        text: teksPesan,
        // PERBAIKAN 2: Tambahkan tampilan HTML rapi agar profesional & tidak dianggap Spam
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0A2540; margin-top: 0;">SI-ELING JATENG</h2>
            <p style="font-size: 14px; color: #475569;">Halo, berikut adalah pengingat untuk kegiatan/agenda Anda:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0A2540; border-radius: 4px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${data.judul}</h3>
              <p style="margin: 5px 0; font-size: 13px;"><strong>🕒 Waktu:</strong> ${waktuFormat}</p>
              <p style="margin: 5px 0; font-size: 13px;"><strong>📝 Disposisi:</strong> ${teksDisposisi}</p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
              Email ini dikirimkan secara otomatis oleh Sistem SI-ELING JATENG. Mohon tidak membalas email ini.
            </p>
          </div>
        `,
      });
      console.log(`✓ Email pengingat berhasil dikirim ke ${data.email}`);
      emailSuccess = true;
    } catch (error: any) {
      console.error('⚠️ Gagal mengirim Email:', error.message);
    }
  }

  // ==========================================
  // BLOK 2: KIRIM WA (Jika ada target WA)
  // ==========================================
  if (data.wa) {
    try {
      // PERBAIKAN 3: Bersihkan nomor HP dari spasi, strip (-), atau karakter non-angka
      const nomorBersih = data.wa.replace(/[^0-9]/g, '');

      const params = new URLSearchParams();
      params.append('target', nomorBersih);
      params.append('message', teksPesan);

      const token = process.env.WA_TOKEN || '';

      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token,
        },
        body: params
      });
      
      const hasil = await res.json();
      
      if (hasil.status === true) {
        console.log(`✓ Pesan WA BERHASIL dikirim ke nomor ${nomorBersih}`);
        waSuccess = true;
      } else {
        console.warn(`⚠️ Fonnte menolak mengirim WA ke ${nomorBersih}. Alasan:`, hasil.reason || hasil.detail || JSON.stringify(hasil));
      }
      
    } catch (error: any) {
      console.error('⚠️ Gagal terhubung ke WhatsApp API:', error.message);
    }
  }

  // Mengembalikan laporan detail hasil pengiriman
  return { 
    success: true, 
    emailSent: emailSuccess, 
    waSent: waSuccess 
  };
}