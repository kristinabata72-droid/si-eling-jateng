import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Hapus tabel lama jika ada (Urutan: agendas dulu baru users)
    await query(`DROP TABLE IF EXISTS agendas;`);
    await query(`DROP TABLE IF EXISTS users;`);

    // 2. Membuat Tabel users
    await query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'ajudan', 'sekda') DEFAULT 'ajudan',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Membuat Tabel agendas
    await query(`
      CREATE TABLE agendas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        disposisi VARCHAR(255),
        agenda_time DATETIME NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // 4. Memasukkan Data Dummy Users
    await query(`
      INSERT INTO users (username, password, full_name, role) 
      VALUES 
      ('ajudan_1', '123456', 'Ajudan Bapak Sekda', 'ajudan'),
      ('sekda_jateng', '123456', 'Sekretaris Daerah Prov Jateng', 'sekda');
    `);

    // 5. Memasukkan Data Dummy Agendas
    await query(`
      INSERT INTO agendas (title, description, location, agenda_time, status, created_by)
      VALUES 
      ('Rapat Koordinasi OPD', 'Membahas serapan anggaran kuartal 3', 'Ruang Rapat Gedung A Lt. 2', '2026-07-10 09:00:00', 'pending', 1),
      ('Penerimaan Kunjungan Kerja', 'Menerima tamu dari Kemendagri', 'Ruang Kerja Sekda', '2026-07-12 13:00:00', 'pending', 1);
    `);

    return NextResponse.json({ 
      success: true, 
      message: '🎉 DATABASE BERHASIL DIPERBAIKI! Tabel users dan agendas beserta data dummy sudah siap.' 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}