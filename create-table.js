require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateTable() {
  let connection;
  try {
    // Menyiapkan konfigurasi koneksi fleksibel
    const dbConfig = process.env.DATABASE_URL 
      ? process.env.DATABASE_URL 
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE || process.env.DB_NAME,
          ssl: { rejectUnauthorized: false } // Wajib untuk Cloud Database (Aiven)
        };

    console.log('🔄 Menghubungkan ke Database Aiven...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Berhasil terhubung ke Database!');

    // 1. Buat / Pastikan Tabel "reminders"
    const sqlReminders = `
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(255) PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        waktu_target DATETIME NOT NULL,
        kategori VARCHAR(100),
        sudah_bunyi TINYINT DEFAULT 0,
        dokumentasi TEXT,
        disposisi TEXT,
        email_tujuan VARCHAR(255),
        wa_tujuan VARCHAR(100),
        files TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sqlReminders);

    // 2. Buat / Pastikan Tabel "catatan"
    const sqlCatatan = `
      CREATE TABLE IF NOT EXISTS catatan (
        id VARCHAR(255) PRIMARY KEY,
        judul_catatan VARCHAR(255),
        judul VARCHAR(255),
        isi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await connection.query(sqlCatatan);

    // 3. Paksa tambah kolom 'judul_catatan' jika belum ada
    try {
      await connection.query(`
        ALTER TABLE catatan 
        ADD COLUMN IF NOT EXISTS judul_catatan VARCHAR(255) AFTER id;
      `);
      console.log('✅ Kolom "judul_catatan" berhasil dipastikan ada!');
    } catch (e) {
      console.log('ℹ️ Kolom "judul_catatan" sudah disesuaikan.');
    }

    console.log('🎉 SELAMAT! Semua tabel database Aiven sudah lengkap & siap digunakan.');

  } catch (err) {
    console.error('❌ Gagal memperbarui tabel:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateTable();