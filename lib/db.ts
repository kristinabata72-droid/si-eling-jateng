import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  // Menggunakan Service URI Aiven secara presisi agar tidak terkecoh port 3306 lama di Vercel
  const connectionUri = 
    process.env.DATABASE_URL || 
    'mysql://avnadmin:AVNS_Jg_rRoGmWb4MMI-yPHJ@mysql-33b8aaa8-si-eling-jateng.f.aivencloud.com:26188/defaultdb';

  const connection = await mysql.createConnection({
    uri: connectionUri,
    ssl: {
      rejectUnauthorized: false,
    },
    connectTimeout: 10000,
  });

  try {
    const [results] = await connection.query(queryText, values);
    return results;
  } finally {
    await connection.end();
  }
}