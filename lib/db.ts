import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Hardcode port Aiven 26188 dan host agar tidak terkecoh port 3306 dari Vercel
  const host = 'mysql-33b8aaa8-si-eling-jateng.f.aivencloud.com';
  const user = 'avnadmin';
  const password = 'AVNS_Jg_rRoGmWb4MMI-yPHJ';
  const database = (process.env.DB_DATABASE || 'db_reminder_sekda').trim();
  const port = 26188; // Wajib 26188 untuk Aiven Cloud

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 15000,
    });

    try {
      const [results] = await connection.query(queryText, values);
      return results;
    } finally {
      await connection.end();
    }
  } catch (err: any) {
    console.error('Database Connection Error:', err);
    throw new Error(err.message || String(err));
  }
}