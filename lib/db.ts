import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  const host = process.env.DB_HOST || 'localhost';
  const isCloud = !host.includes('localhost') && !host.includes('127.0.0.1');

  // Buat koneksi per-request
  const connection = await mysql.createConnection({
    host: host,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Claudiabata05',
    database: process.env.DB_DATABASE || 'db__eling_jateng',
    port: Number(process.env.DB_PORT) || 3306,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000,
  });

  try {
    // Gunakan .query() alih-alih .execute() untuk menghindari bug binary protocol parser
    const [results] = await connection.query(queryText, values);
    return results;
  } finally {
    // Selalu tutup koneksi agar socket SSL tidak hang
    await connection.end();
  }
}