import nodemailer from 'nodemailer';

// Konfigurasi Email Resmi (Bisa disesuaikan dengan SMTP Pemprov/Instansi nanti)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'email_instansi@gmail.com',
    pass: process.env.SMTP_PASS || 'password_app_email',
  },
});

// Menerima email dan wa secara mandiri (bisa salah satu atau keduanya)
export async function kirimPengingat(data: { 
  judul: string; 
  waktu: string | number; // Bisa menerima angka timestamp
  disposisi?: string; 
  email?: string;         // Email dinamis
  wa?: string             // WA dinamis
}) {
  
  // 1. Format teks waktu agar enak dibaca (jika dari frontend dikirim berupa angka)
  const waktuFormat = typeof data.waktu === 'number' 
    ? new Date(data.waktu).toLocaleString('id-ID') + ' WIB'
    : data.waktu;
    
  // 2. Format teks disposisi
  const teksDisposisi = data.disposisi 
    ? `Disposisi ditujukan kepada: ${data.disposisi}.` 
    : 'Tidak ada disposisi khusus.';

  // 3. Rangkai isi pesan
  const teksPesan = `PENGINGAT JADWAL: Kegiatan "${data.judul}" akan dilaksanakan pada ${waktuFormat}. ${teksDisposisi}`;

  // ==========================================
  // BLOK 1: KIRIM EMAIL (Jika user mengisi form Email)
  // ==========================================
  if (data.email) {
    try {
      await transporter.sendMail({
        from: `"SI-ELING JATENG" <no-reply@jateng.go.id>`,
        to: data.email, 
        subject: `[PENTING] Pengingat Agenda: ${data.judul}`,
        text: teksPesan,
      });
      console.log(`✓ Email pengingat berhasil dikirim ke ${data.email}`);
    } catch (error: any) {
      console.error('⚠️ Gagal mengirim Email:', error.message);
    }
  }

  // ==========================================
  // BLOK 2: KIRIM WA (Jika user mengisi form WA)
  // ==========================================
  if (data.wa) {
    try {
      // 💡 REVISI PRINCESS: Menggunakan URLSearchParams agar Fonnte mengerti isinya!
      const params = new URLSearchParams();
      params.append('target', data.wa);
      params.append('message', teksPesan);

      const token = process.env.WA_TOKEN || 'TOKEN_WA_ANDA';

      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token,
          // Next.js otomatis mendeteksi Content-Type yang sesuai untuk URLSearchParams
        },
        body: params
      });
      
      // Ambil respon balasan dari Fonnte agar kita bisa memantau jika ada eror
      const hasil = await res.json();
      
      if (hasil.status === true) {
        console.log(`✓ Pesan WA BERHASIL dikirim ke nomor ${data.wa}`);
      } else {
        console.warn(`⚠️ Fonnte menolak mengirim WA ke ${data.wa}. Alasan:`, hasil.reason || hasil.detail || JSON.stringify(hasil));
      }
      
    } catch (error: any) {
      console.error('⚠️ Gagal terhubung ke WhatsApp API:', error.message);
    }
  }

  // Selesai diproses
  return { success: true };
}