import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
// Mengimpor fungsi kirimPengingat yang sudah Anda buat dengan rapi
import { kirimPengingat } from '@/lib/notification'; 

export async function GET() {
  try {
    // 1. Ambil agenda yang waktunya SUDAH TIBA/LEWAT dan BELUM DIBUNYIKAN (sudah_bunyi = 0)
    const pendingReminders: any = await query(
      `SELECT * FROM reminders 
       WHERE waktu_target <= NOW() AND sudah_bunyi = 0`
    );

    if (!pendingReminders || pendingReminders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tidak ada notifikasi yang perlu dikirim saat ini.' 
      });
    }

    // 2. Loop dan panggil kirimPengingat() untuk setiap agenda
    for (const item of pendingReminders) {
      await kirimPengingat({
        judul: item.judul,
        waktu: item.waktu_target,
        disposisi: item.disposisi,
        email: item.email_tujuan,
        wa: item.wa_tujuan,
      });

      // 3. Tandai sudah_bunyi = 1 agar tidak terkirim dua kali di menit berikutnya
      await query(
        `UPDATE reminders SET sudah_bunyi = 1 WHERE id = ?`,
        [item.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses dan mengirim ${pendingReminders.length} notifikasi agenda.`
    });

  } catch (error: any) {
    console.error('Cron Execution Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}