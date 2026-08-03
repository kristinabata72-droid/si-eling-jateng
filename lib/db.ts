import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  const isCloud = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost');

  // Buat koneksi baru per-request
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Claudiabata05',
    database: process.env.DB_DATABASE || 'db__eling_jateng',
    port: Number(process.env.DB_PORT) || 3306,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const [results] = await connection.execute(queryText, values);
    return results;
  } finally {
    // Memastikan koneksi selalu ditutup agar SSL tidak menggantung di Vercel
    await connection.end();
  }
}