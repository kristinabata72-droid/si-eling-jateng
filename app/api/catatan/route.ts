import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Fungsi pembantu untuk memastikan format tanggal selalu YYYY-MM-DD sesuai kemauan MySQL
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

// 1. [GET] : Mengambil semua data catatan mandiri dari MySQL
export async function GET() {
  try {
    const catatan = await query('SELECT * FROM catatan ORDER BY id DESC');
    return NextResponse.json({ success: true, data: catatan }, { status: 200 });
  } catch (error: any) {
    console.error('GET Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil catatan: ' + error.message }, { status: 500 });
  }
}

// 2. [POST] : Menambahkan catatan baru ke MySQL
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, judul_catatan, tanggal_input, isi_catatan, files } = body;

    // Validasi input wajib
    if (!id || !judul_catatan || !isi_catatan) {
      return NextResponse.json({ success: false, message: 'Judul dan Isi catatan wajib diisi!' }, { status: 400 });
    }

    const filesString = files ? (typeof files === 'string' ? files : JSON.stringify(files)) : null;
    
    // Format tanggal ke YYYY-MM-DD sebelum masuk ke query
    const tanggalBersih = formatTanggalMySQL(tanggal_input);

    await query(
      `INSERT INTO catatan (id, judul_catatan, tanggal_input, isi_catatan, files) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, judul_catatan, tanggal_input || tanggalBersih, isi_catatan, filesString]
    );

    return NextResponse.json({ success: true, message: 'Catatan berhasil disimpan!' }, { status: 201 });
  } catch (error: any) {
    console.error('POST Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menyimpan catatan: ' + error.message }, { status: 500 });
  }
}

// 3. [PUT] : Mengubah/Update catatan yang sudah ada
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
      [judul_catatan, tanggalBersih, isi_catatan, filesString, id]
    );

    return NextResponse.json({ success: true, message: 'Catatan berhasil diperbarui!' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT Catatan Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui catatan: ' + error.message }, { status: 500 });
  }
}

// 4. [DELETE] : Menghapus catatan berdasarkan ID

// 4. [DELETE] : Menghapus catatan berdasarkan ID
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID catatan wajib dicantumkan!' }, 
        { status: 400 }
      );
    }

    await query('DELETE FROM catatan WHERE id = ?', [id]);
    return NextResponse.json(
      { success: true, message: 'Catatan berhasil dihapus!' }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error('DELETE Catatan Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus catatan: ' + error.message }, 
      { status: 500 }
    );
  }
}