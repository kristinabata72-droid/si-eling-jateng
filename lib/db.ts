import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Ambil data koneksi dari .env (dengan nilai fallback TiDB Cloud)
  const host = process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const user = process.env.DB_USER || '2b7GzwXu6GivvAE.root';
  const password = process.env.DB_PASSWORD || 'Nkm3CbKxwup3iqzI';
  const database = (process.env.DB_NAME || process.env.DB_DATABASE || 'sieling').trim();
  const port = Number(process.env.DB_PORT) || 4000;

  try {
    // 1. Buka koneksi ke server tanpa langsung mengunci database (mencegah ER_BAD_DB_ERROR)
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      },
      connectTimeout: 15000,
    });

    try {
      // 2. Otomatis buat database jika belum ada & langsung gunakan
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await connection.query(`USE \`${database}\`;`);

      // 3. Eksekusi query utama
      const [results] = await connection.query(queryText, values);
      return results;
    } finally {
      // 4. Tutup koneksi secara rapi
      await connection.end();
    }
  } catch (err: any) {
    console.error('Database Connection Error:', err);
    throw new Error(err.message || String(err));
  }
}