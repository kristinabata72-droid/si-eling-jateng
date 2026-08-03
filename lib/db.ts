import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Nilai default dialihkan langsung ke Aiven Cloud
  const host = (process.env.DB_HOST || 'mysql-33b8aaa8-si-eling-jateng.f.aivencloud.com').trim();
  const user = (process.env.DB_USER || 'avnadmin').trim();
  const password = (process.env.DB_PASSWORD || 'AVNS_Jg_rRoGmWb4MMI-yPHJ').trim();
  const database = (process.env.DB_DATABASE || 'defaultdb').trim();
  const port = Number(process.env.DB_PORT) || 26188;

  const isCloud = !host.includes('localhost') && !host.includes('127.0.0.1');

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 10000,
    });

    try {
      const [results] = await connection.query(queryText, values);
      return results;
    } finally {
      await connection.end();
    }
  } catch (err: any) {
    console.error('Database Error:', err);
    // Melempar pesan error asli MySQL agar muncul di alert browser
    throw new Error(err.message || String(err));
  }
}