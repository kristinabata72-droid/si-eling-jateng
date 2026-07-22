import { NextResponse } from "next/server";
import { kirimPengingat } from "@/lib/notification"; 

export async function POST(request: Request) {
  try {
    // 1. Menangkap data yang dikirim dari frontend saat alarm/pemicu aktif
    const body = await request.json();
    
    // 🌟 PERBAIKAN 1: Ekstraksi variabel dengan fallback (mendukung camelCase & snake_case)
    const judul = body.judul || "Agenda Tanpa Judul";
    const waktu = body.waktu || body.waktu_target || body.waktuTarget || "-";
    const disposisi = body.disposisi || "-";
    const emailTarget = body.emailTujuan || body.email_tujuan || body.email || null;
    const waTarget = body.waTujuan || body.wa_tujuan || body.wa || null;

    console.log("📥 [API Notifikasi] Menerima request untuk:", judul);
    console.log("📧 Target Email:", emailTarget || "(Kosong / Tidak diisi)");
    console.log("📱 Target WA:", waTarget || "(Kosong / Tidak diisi)");

    // 🌟 PERBAIKAN 2: Validasi agar server tidak memproses jika tidak ada tujuan
    if (!emailTarget && !waTarget) {
      console.warn("⚠️ API Notifikasi dilewati: Alamat Email atau WA tujuan tidak ditemukan.");
      return NextResponse.json({ 
        success: false, 
        message: "Request ditolak: Tidak ada alamat email atau nomor WhatsApp tujuan yang valid." 
      }, { status: 400 });
    }

    // 2. Memanggil fungsi pengirim Email/WA dari lib/notification.ts
    const hasil = await kirimPengingat({
      judul: judul,
      waktu: waktu,
      disposisi: disposisi,
      email: emailTarget, 
      wa: waTarget        
    });

    // 3. Response sukses ke frontend
    return NextResponse.json({ 
      success: true, 
      message: "Notifikasi berhasil diproses dan dikirim server!",
      detail: hasil 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error di API Notifikasi:", error?.message || error);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal memproses notifikasi: " + (error?.message || "Internal Server Error"),
    }, { status: 500 });
  }
}