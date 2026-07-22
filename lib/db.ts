import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Cek apakah sedang menggunakan database cloud (bukan localhost)
  const isCloudDB = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Claudiabata05',
    database: process.env.DB_DATABASE || 'db__eling_jateng',
    port: Number(process.env.DB_PORT) || 3306,
    // Aiven butuh pengaturan SSL jika dihubungkan dari Vercel
    ssl: isCloudDB ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const [results] = await connection.execute(queryText, values);
    return results;
  } catch (error) {
    throw error;
  } finally {
    await connection.end();
  }
}