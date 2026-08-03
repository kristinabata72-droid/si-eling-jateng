import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Langsung diarahkan ke host dan port Aiven Cloud
  const host = (process.env.DB_HOST || 'mysql-33b8aaa8-si-eling-jateng.f.aivencloud.com').trim();
  const user = (process.env.DB_USER || 'avnadmin').trim();
  const password = (process.env.DB_PASSWORD || 'AVNS_Jg_rRoGmWb4MMI-yPHJ').trim();
  const database = (process.env.DB_DATABASE || 'defaultdb').trim();
  const port = Number(process.env.DB_PORT) || 26188;

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