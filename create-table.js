const mysql = require('mysql2/promise');

async function updateTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'mysql-33b8aaa8-si-eling-jateng.f.aivencloud.com',
      user: 'avnadmin',
      password: 'AVNS_Jg_rRoGmWb4MMI-yPHJ',
      database: 'defaultdb',
      port: 26188,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔄 Terhubung ke database Aiven...');

    // 1. Buat Tabel "reminders" (Aman, tidak menghapus data lama jika sudah ada)
    const sqlReminders = `
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(255) PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        keterangan TEXT,
        kategori VARCHAR(100),
        prioritas VARCHAR(50),
        tanggal DATE,
        waktu TIME,
        tanggal_target DATE,
        waktu_target VARCHAR(255),
        sudah_bunyi BOOLEAN DEFAULT FALSE,
        lokasi VARCHAR(255),
        file_url TEXT,
        files TEXT,
        dokumentasi TEXT,
        disposisi TEXT,
        nomor_surat VARCHAR(255),
        pengirim VARCHAR(255),
        penerima VARCHAR(255),
        sifat VARCHAR(100),
        email_tujuan VARCHAR(255),
        wa_tujuan VARCHAR(255),
        email VARCHAR(255),
        no_hp VARCHAR(50),
        no_whatsapp VARCHAR(50),
        status_wa VARCHAR(50),
        status_email VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sqlReminders);
    console.log('✅ Tabel "reminders" SIAP!');

    // 2. Buat Tabel "catatan" (SOLUSI UNTUK ERROR VERCEL LOG GET /api/catatan)
    const sqlCatatan = `
      CREATE TABLE IF NOT EXISTS catatan (
        id VARCHAR(255) PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        isi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sqlCatatan);
    console.log('✅ Tabel "catatan" BERHASIL dibuat!');

    await connection.end();
    console.log('🎉 SELAMAT! Semua tabel database Aiven sudah lengkap & siap digunakan.');
  } catch (err) {
    console.error('❌ Gagal memperbarui tabel:', err.message);
  }
}

updateTable();