import { NextResponse } from "next/server";
// Ubah path dan nama fungsi di bawah sesuai dengan yang ada di file notification.ts Mas
import { kirimPengingat } from "@/lib/notification"; 

export async function POST(request: Request) {
  try {
    // 1. Menangkap data yang dikirim dari page.tsx saat alarm bunyi
    const body = await request.json();
    
    // 🌟 UBAH 1: Tangkap emailTujuan dan waTujuan dari frontend
    const { judul, waktu, disposisi, emailTujuan, waTujuan } = body;

    console.log("📥 Menerima request notifikasi untuk:", judul);
    console.log("📧 Target Email:", emailTujuan || "Tidak ada");
    console.log("📱 Target WA:", waTujuan || "Tidak ada");

    // 2. Memanggil fungsi pengirim Email/WA dari file notification.ts Mas
    const hasil = await kirimPengingat({
      judul: judul,
      waktu: waktu,
      disposisi: disposisi,
      // 🌟 UBAH 2: Sambungkan ke parameter email dan wa milik kirimPengingat
      email: emailTujuan, 
      wa: waTujuan        
    });

    // 3. Mengirim jawaban balik ke frontend bahwa sukses
    return NextResponse.json({ 
      success: true, 
      message: "Notifikasi berhasil diproses server!",
      detail: hasil 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error di API Notifikasi:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal memproses notifikasi",
      error: error.message 
    }, { status: 500 });
  }
}