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

    // 1. Hapus tabel lama
    await connection.query(`DROP TABLE IF EXISTS reminders;`);

    // 2. Buat tabel baru dengan id bertipe VARCHAR (Teks)
    const sql = `
      CREATE TABLE reminders (
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

    await connection.query(sql);
    console.log('✅ SELAMAT! Tabel "reminders" BERHASIL diperbarui dengan ID tipe Teks/VARCHAR!');
    
    await connection.end();
  } catch (err) {
    console.error('❌ Gagal memperbarui tabel:', err.message);
  }
}

updateTable();