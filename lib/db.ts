import mysql from 'mysql2/promise';

export async function query(queryText: string, values: any[] = []) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Claudiabata05', // Sudah diganti dengan huruf C kapital
    database: 'db__eling_jateng',
    port: 3306, // Menggunakan port default 3306
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