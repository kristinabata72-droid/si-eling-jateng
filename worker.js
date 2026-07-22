const cron = require('node-cron');

console.log('🤖 Robot pengingat di belakang layar siap berjalan...');

// Jalankan tugas setiap menit
cron.schedule('* * * * *', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/cron/check-reminders');
    const data = await res.json();
    console.log(`[${new Date().toLocaleTimeString()}] Status Cron:`, data.message);
  } catch (err) {
    console.error('Gagal memanggil API Cron:', err.message);
  }
});