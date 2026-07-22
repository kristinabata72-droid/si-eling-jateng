"use client";

import { useState, useEffect, useRef } from "react";

interface AttachedFile {
  name: string;
  data: string;
}

interface Reminder {
  id: string;
  judul: string;
  waktuTarget: number;
  kategori: "Kerja" | "Pribadi" | "Penting";
  sudahBunyi: boolean;
  dokumentasi?: string;
  disposisi?: string;
  files?: AttachedFile[];
  emailTujuan?: string;
  waTujuan?: string;
}

interface CatatanMandiri {
  id: string;
  judulCatatan: string;
  tanggalInput: string;
  isiCatatan: string;
  files?: AttachedFile[];
}

export default function Home() {
  // Tampilan Depan / Utama
  const [sudahMasuk, setSudahMasuk] = useState(false);

  // State Utama Data
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [catatanList, setCatatanList] = useState<CatatanMandiri[]>([]);
  
  // State Navigasi Form & Filter
  const [tabForm, setTabForm] = useState<"agenda" | "catatan">("agenda");
  const [tabLihatData, setTabLihatData] = useState<"semua" | "agenda" | "catatan">("semua");
  const [kataKunci, setKataKunci] = useState("");
  const [filterKategori, setFilterKategori] = useState<"Semua" | "Kerja" | "Pribadi" | "Penting">("Semua");

  // Inputs Form 1: Agenda
  const [judulInput, setJudulInput] = useState("");
  const [waktuInput, setWaktuInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState<"Kerja" | "Pribadi" | "Penting">("Kerja");
  const [dokumentasiInput, setDokumentasiInput] = useState("");
  const [disposisiInput, setDisposisiInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [waInput, setWaInput] = useState("");

  // Inputs Form 2: Catatan Mandiri
  const [catatanJudul, setCatatanJudul] = useState("");
  const [catatanIsi, setCatatanIsi] = useState("");

  // State Multi-File Upload Bersama
  const [filesInput, setFilesInput] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoEror, setLogoEror] = useState(false);
  const [modalAgenda, setModalAgenda] = useState<Reminder | null>(null);
  const [modalCatatan, setModalCatatan] = useState<CatatanMandiri | null>(null);

  const [waktuSekarang, setWaktuSekarang] = useState(new Date().getTime() + (5 * 60 * 1000));
  const [isMounted, setIsMounted] = useState(false);

// Load Data dari MySQL Database 
  useEffect(() => {
    setIsMounted(true);
    const statusLogin = localStorage.getItem('si_eling_login_status');
    if (statusLogin === 'true') {
      setSudahMasuk(true);
    } else {
    
    }
    const ambilRemindersDariMySQL = async () => {
      try {
        const respon = await fetch("/api/reminders");
        const hasil = await respon.json();
        if (hasil.success) {
          // Menerjemahkan data MySQL (snake_case) ke format Web (camelCase)
          const dataMapped = hasil.data.map((r: any) => ({
            id: r.id,
            judul: r.judul,
            waktuTarget: typeof r.waktu_target === 'number' ? r.waktu_target : new Date(r.waktu_target).getTime(),
            kategori: r.kategori,
            sudahBunyi: r.sudah_bunyi === 1 || r.sudah_bunyi === true,
            dokumentasi: r.dokumentasi,
            disposisi: r.disposisi,
            emailTujuan: r.email_tujuan,
            waTujuan: r.wa_tujuan,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : undefined
          }));
          setReminders(dataMapped);
        }
      } catch (e) {
        console.error("Gagal memuat agenda dari database:", e);
      }
    };

    const ambilCatatanDariMySQL = async () => {
      try {
        const respon = await fetch("/api/catatan");
        const hasil = await respon.json();
        if (hasil.success) {
          // Menerjemahkan data catatan MySQL ke format Web
          const catatanMapped = hasil.data.map((c: any) => ({
            id: c.id,
            judulCatatan: c.judul_catatan,
            tanggalInput: c.tanggal_input,
            isiCatatan: c.isi_catatan,
            files: c.files ? (typeof c.files === 'string' ? JSON.parse(c.files) : c.files) : undefined
          }));
          setCatatanList(catatanMapped);
        }
      } catch (e) {
        console.error("Gagal memuat catatan dari database:", e);
      }
    };

    ambilRemindersDariMySQL();
    ambilCatatanDariMySQL();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Engine Waktu Nyata & Alarm
  useEffect(() => {
    const interval = setInterval(() => {
      const waktuKoreksi = new Date().getTime() + (5 * 60 * 1000);
      setWaktuSekarang(waktuKoreksi);

      setReminders((prevReminders) => {
        let adaPerubahan = false;
        const dataBaru = prevReminders.map((reminder) => {
          if (waktuKoreksi >= reminder.waktuTarget && !reminder.sudahBunyi) {
            pemicuAlarm(reminder); 
            adaPerubahan = true;
            return { ...reminder, sudahBunyi: true };
          }
          return reminder;
        });
        return adaPerubahan ? dataBaru : prevReminders;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pemicuAlarm = async (reminder: Reminder) => {
    try {
      fetch("/api/notifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: reminder.judul,
          waktu: reminder.waktuTarget,
          disposisi: reminder.disposisi,
          emailTujuan: reminder.emailTujuan, 
          waTujuan: reminder.waTujuan      
        }),
      });
    } catch (error) {
      console.error("❌ Gagal mengirim kontak ke API:", error);
    }

    try {
      const audio = new Audio("/alarm.aac");
      audio.volume = 0.8;
      audio.play().catch((err) => {
        console.warn("Autoplay diblokir oleh browser sebelum ada interaksi:", err);
      });
    } catch (e) {
      console.error("Gagal memutar audio alarm:", e);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pengingat Agenda Resmi", {
        body: `Agenda "${reminder.judul}" telah memasuki jadwal pelaksanaan.`,
        icon: "/logo-reminder.png"
      });
    }

    setTimeout(() => {
      alert(`PENGINGAT RESMI: Agenda "${reminder.judul}" sudah masuk jadwal pelaksanaan.`);
    }, 100);
  };

  // Upload Handler Multi-File (Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = e.target.files;
    if (!targetFiles || targetFiles.length === 0) return;

    Array.from(targetFiles).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Berkas "${file.name}" terlalu besar! Maksimal berkas berukuran 2MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilesInput((prev) => [
          ...prev,
          { name: file.name, data: reader.result as string }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input file agar file yang sama bisa dipilih ulang jika dihapus
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hapusFileSpesifik = (indexHapus: number) => {
    setFilesInput((prev) => prev.filter((_, idx) => idx !== indexHapus));
  };

  const bersihkanSemuaFile = () => {
    setFilesInput([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

// Aksi Tambah Agenda (Form 1) ke MySQL
  const simpanAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulInput.trim() || !waktuInput) return;

    const timestampTarget = new Date(waktuInput).getTime();
    const idBaru = "AGD-" + Date.now().toString();

    // 1. Sesuaikan dengan format kolom database MySQL Anda
    const dataKeBackend = {
      id: idBaru,
      judul: judulInput.trim(),
      waktu_target: waktuInput, // Dikirim dalam format string tanggal agar MySQL mudah membaca DATETIME
      kategori: kategoriInput,
      dokumentasi: dokumentasiInput.trim() || null,
      disposisi: disposisiInput.trim() || null,
      email_tujuan: emailInput.trim() || null,
      wa_tujuan: waInput.trim() || null,
      files: filesInput.length > 0 ? filesInput : null
    };

    try {
      const respon = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataKeBackend)
      });
      const hasil = await respon.json();

      if (hasil.success) {
        // 2. Jika sukses di MySQL, masukkan ke state lokal agar langsung muncul di layar tanpa refresh
        const baru: Reminder = {
          id: idBaru,
          judul: judulInput.trim(),
          waktuTarget: timestampTarget,
          kategori: kategoriInput,
          sudahBunyi: timestampTarget <= waktuSekarang,
          dokumentasi: dokumentasiInput.trim() || undefined,
          disposisi: disposisiInput.trim() || undefined,
          emailTujuan: emailInput.trim() || undefined,
          waTujuan: waInput.trim() || undefined,
          files: filesInput.length > 0 ? filesInput : undefined
        };

        setReminders((prev) => [baru, ...prev]);
        
        // Reset form input
        setJudulInput("");
        setWaktuInput("");
        setDokumentasiInput("");
        setDisposisiInput("");
        bersihkanSemuaFile();
        setEmailInput("");
        setWaInput("");
        alert("Agenda berhasil disimpan ke database MySQL!");
      } else {
        alert("Gagal menyimpan ke database: " + hasil.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat menyimpan agenda.");
    }
  };

  // Aksi Tambah Catatan Mandiri (Form 2) ke MySQL
  const simpanCatatanMandiri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatanJudul.trim() || !catatanIsi.trim()) return;

    const idBaru = "CTN-" + Date.now().toString();
    const formatTanggal = new Date().toLocaleDateString("id-ID", { 
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
    });

    // Sesuaikan key parameter dengan API backend catatan
    const dataKeBackend = {
      id: idBaru,
      judul_catatan: catatanJudul.trim(),
      tanggal_input: formatTanggal,
      isi_catatan: catatanIsi.trim(),
      files: filesInput.length > 0 ? filesInput : null
    };

    try {
      const respon = await fetch("/api/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataKeBackend)
      });
      const hasil = await respon.json();

      if (hasil.success) {
        const baru: CatatanMandiri = {
          id: idBaru,
          judulCatatan: catatanJudul.trim(),
          tanggalInput: formatTanggal,
          isiCatatan: catatanIsi.trim(),
          files: filesInput.length > 0 ? filesInput : undefined
        };

        setCatatanList((prev) => [baru, ...prev]);
        setCatatanJudul("");
        setCatatanIsi("");
        bersihkanSemuaFile();
        alert("Dokumen catatan berhasil diarsipkan ke MySQL!");
      } else {
        alert("Gagal mengarsipkan catatan: " + hasil.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat mengarsipkan catatan.");
    }
  };

  // Aksi Hapus Agenda dari MySQL
  const hapusAgenda = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus agenda ini dari database?")) {
      try {
        const respon = await fetch(`/api/reminders?id=${id}`, {
          method: "DELETE"
        });
        const hasil = await respon.json();

        if (hasil.success) {
          setReminders((prev) => prev.filter((r) => r.id !== id));
          alert("Agenda berhasil dihapus!");
        } else {
          alert("Gagal menghapus dari database: " + hasil.message);
        }
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan jaringan saat menghapus agenda.");
      }
    }
  };

  // Aksi Hapus Catatan dari MySQL
  const hapusCatatan = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokumen catatan ini dari database?")) {
      try {
        const respon = await fetch(`/api/catatan?id=${id}`, {
          method: "DELETE"
        });
        const hasil = await respon.json();

        if (hasil.success) {
          setCatatanList((prev) => prev.filter((n) => n.id !== id));
          alert("Catatan berhasil dihapus!");
        } else {
          alert("Gagal menghapus catatan dari database: " + hasil.message);
        }
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan jaringan saat menghapus catatan.");
      }
    }
  };

  // Filter & Pencarian Gabungan
  const agendaTerfilter = reminders.filter((r) => {
    const cocokKata = r.judul.toLowerCase().includes(kataKunci.toLowerCase());
    const cocokKategori = filterKategori === "Semua" || r.kategori === filterKategori;
    return cocokKata && cocokKategori;
  });

  const catatanTerfilter = catatanList.filter((n) => {
    return n.judulCatatan.toLowerCase().includes(kataKunci.toLowerCase()) || n.isiCatatan.toLowerCase().includes(kataKunci.toLowerCase());
  });

  const agendaMendatang = agendaTerfilter.filter((r) => !r.sudahBunyi && r.waktuTarget > waktuSekarang).sort((a, b) => a.waktuTarget - b.waktuTarget);
  const agendaSelesai = agendaTerfilter.filter((r) => r.sudahBunyi || r.waktuTarget <= waktuSekarang).sort((a, b) => b.waktuTarget - a.waktuTarget);

  const agendaAktifHalamanDepan = reminders.filter((r) => !r.sudahBunyi && r.waktuTarget > waktuSekarang).length;

  if (!sudahMasuk) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4">
        {/* INJEKSI CSS ANIMASI LOGO KUSTOM */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes smoothFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-logo-float {
            animation: smoothFloat 3s ease-in-out infinite;
          }
        `}} />

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6 text-center">
          {/* LOGO DENGAN ANIMASI */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-slate-50 p-2 rounded-xl flex items-center justify-center border border-slate-200 shadow-xs animate-logo-float">
              {!logoEror ? (
                <img src="/logo-reminder.png" alt="Logo Resmi" className="w-full h-full object-contain rounded-lg" onError={() => setLogoEror(true)} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0A2540]" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2540]">
              Si Eling Jateng
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Sistem Pengingat Agenda & Manajemen Dokumentasi Catatan Terintegrasi Pemerintah Provinsi Jawa Tengah.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between text-left">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Sistem</p>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                {agendaAktifHalamanDepan > 0 ? `Terdapat ${agendaAktifHalamanDepan} agenda aktif.` : "Tidak ada agenda aktif."}
              </p>
            </div>
            <div className="bg-[#0A2540] text-white font-semibold px-2.5 py-1 rounded text-[11px]">
              {agendaAktifHalamanDepan} Aktif
            </div>
          </div>

          <button 
            onClick={() => setSudahMasuk(true)}
            className="w-full bg-[#0A2540] hover:bg-[#11385c] text-white font-medium py-3 rounded-lg text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm"
          >
            Masuk ke Dashboard Utama
          </button>
        </div>
        <footer className="mt-8 text-[11px] text-slate-400 font-medium">© 2026 Pemerintah Provinsi Jawa Tengah</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8">
      {/* INJEKSI CSS ANIMASI LOGO KUSTOM DI DASHBOARD UTAMA */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes smoothFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-logo-float-small {
          animation: smoothFloat 3s ease-in-out infinite;
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-xl p-4 gap-4 shadow-sm">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setSudahMasuk(false)} 
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0 l7-7m-7 7h18"/></svg>
              Keluar
            </button>
            <div className="w-10 h-10 bg-slate-50 p-1 rounded-lg flex items-center justify-center border border-slate-200 shrink-0 animate-logo-float-small">
              {!logoEror ? <img src="/logo-reminder.png" alt="Logo" className="w-full h-full object-contain rounded" onError={() => setLogoEror(true)} /> : <div className="w-4 h-4 rounded-full bg-[#0A2540]" />}
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#0A2540]">Si Eling Jateng</h1>
              <p className="text-[10px] text-slate-500 font-medium">Agenda & Dokumentasi Catatan Resmi</p>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-center sm:text-right flex items-center gap-2.5 shrink-0">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Waktu Aktual Sistem</p>
              <p className="text-xs font-mono text-[#0A2540] font-bold">
                {isMounted ? new Date(waktuSekarang).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB" : "--:-- WIB"}
              </p>
            </div>
          </div>
        </header>

        {/* CONTROLS: BAR SEARCH & FILTER */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="relative lg:col-span-5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input
              type="text"
              placeholder="Cari kata kunci agenda atau dokumen..."
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-slate-400 text-slate-700"
            />
          </div>
          
          <div className="flex gap-1 items-center lg:col-span-4 overflow-x-auto py-1">
            <span className="text-[10px] text-slate-400 font-bold mr-2 uppercase shrink-0">Kategori:</span>
            {(["Semua", "Kerja", "Pribadi", "Penting"] as any).map((kat: string) => (
              <button
                key={kat}
                onClick={() => setFilterKategori(kat as any)}
                className={`text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                  filterKategori === kat ? "bg-[#0A2540] text-white border-[#0A2540]" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {kat}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-1.5 lg:col-span-3 border-t lg:border-t-0 pt-3 lg:pt-0">
            <button onClick={() => setTabLihatData("semua")} className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors border ${tabLihatData === "semua" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>Semua Data</button>
            <button onClick={() => setTabLihatData("agenda")} className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors border ${tabLihatData === "agenda" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>Jadwal Agenda</button>
            <button onClick={() => setTabLihatData("catatan")} className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors border ${tabLihatData === "catatan" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>Catatan</button>
          </div>
        </div>

        {/* LAYOUT DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PANEL KIRI: FORM ENTRI */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-4 space-y-4">
            
            {/* SWITCHER TAB FORM */}
            <div className="grid grid-cols-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
              <button 
                type="button" 
                onClick={() => { setTabForm("agenda"); bersihkanSemuaFile(); }}
                className={`text-[11px] font-medium py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${tabForm === "agenda" ? "bg-white text-[#0A2540] shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Jadwal Rapat
              </button>
              <button 
                type="button" 
                onClick={() => { setTabForm("catatan"); bersihkanSemuaFile(); }}
                className={`text-[11px] font-medium py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${tabForm === "catatan" ? "bg-white text-[#0A2540] shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Tambah Catatan
              </button>
            </div>

            {/* FORM 1: INPUT AGENDA */}
            {tabForm === "agenda" && (
              <form onSubmit={simpanAgenda} className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Formulir Rencana Rapat / Agenda</h4>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Nama Agenda / Kegiatan</label>
                  <input type="text" placeholder="Masukkan perihal rapat resmi..." value={judulInput} onChange={(e) => setJudulInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 text-slate-700" required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Disposisi Ditujukan Kepada</label>
                  <input type="text" placeholder="Contoh: Kepala Bagian Umum / Sekda" value={disposisiInput} onChange={(e) => setDisposisiInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 text-slate-700" required />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Waktu Pelaksanaan</label>
                    <input type="datetime-local" value={waktuInput} onChange={(e) => setWaktuInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none text-slate-700" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Label Kategori</label>
                    <select value={kategoriInput} onChange={(e) => setKategoriInput(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700">
                      <option value="Kerja">Kerja</option>
                      <option value="Pribadi">Pribadi</option>
                      <option value="Penting">Penting</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Catatan Rincian Rapat <span className="text-[10px] text-slate-400">(Opsional)</span></label>
                  <textarea placeholder="Tulis rincian atau poin ringkas jadwal..." value={dokumentasiInput} onChange={(e) => setDokumentasiInput(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 resize-none focus:outline-none focus:border-slate-400" />
                </div>

                {/* FILE UPLOAD MULTIPLE */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="text-xs text-slate-700 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"/></svg>
                      Lampiran Berkas Rapat ({filesInput.length})
                    </span>
                    {filesInput.length > 0 && (
                      <button type="button" onClick={bersihkanSemuaFile} className="text-[10px] text-red-600 hover:underline">Hapus Semua</button>
                    )}
                  </label>
                  <input type="file" accept="image/*,application/pdf,.doc,.docx" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 py-2 rounded-lg text-xs font-medium transition-colors">
                    + Tambah File
                  </button>

                  {/* LIST FILE TERPILIH */}
                  {filesInput.length > 0 && (
                    <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                      {filesInput.map((file, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-[11px]">
                          <span className="truncate max-w-[75%] text-slate-600 font-mono">{file.name}</span>
                          <button type="button" onClick={() => hapusFileSpesifik(idx)} className="text-red-600 font-medium hover:underline px-1">Batal</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* INPUT EMAIL & WA */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Email Notifikasi <span className="text-[10px] text-slate-400">(Opsional)</span></label>
                    <input type="text" placeholder="instansi@jateng.go.id" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-slate-400 text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">No. WhatsApp <span className="text-[10px] text-slate-400">(Opsional)</span></label>
                    <input type="text" placeholder="08123..." value={waInput} onChange={(e) => setWaInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-slate-400 text-slate-700" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#0A2540] hover:bg-[#11385c] text-white font-medium py-2.5 rounded-lg text-xs uppercase tracking-wide transition-colors shadow-sm">Simpan Jadwal Agenda</button>
              </form>
            )}

            {/* FORM 2: INPUT CATATAN MANDIRI */}
            {tabForm === "catatan" && (
              <form onSubmit={simpanCatatanMandiri} className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arsip Catatan & Dokumentasi Bersama</h4>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Judul Catatan / Kegiatan</label>
                  <input type="text" placeholder="Contoh: Hasil Koordinasi Evaluasi Triwulan" value={catatanJudul} onChange={(e) => setCatatanJudul(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-400 text-slate-700" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-medium">Isi Lengkap Catatan Resmi</label>
                  <textarea placeholder="Ketik hasil kesepakatan, poin penting, atau risalah rapat di sini..." value={catatanIsi} onChange={(e) => setCatatanIsi(e.target.value)} rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400 resize-none" required />
                </div>

                {/* FILE UPLOAD MULTIPLE UNTUK DOKUMENTASI CATATAN */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="text-xs text-slate-700 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      Lampiran Dokumentasi ({filesInput.length})
                    </span>
                    {filesInput.length > 0 && (
                      <button type="button" onClick={bersihkanSemuaFile} className="text-[10px] text-red-600 hover:underline">Hapus Semua</button>
                    )}
                  </label>
                  <input type="file" accept="image/*,application/pdf,.doc,.docx" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                  
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 py-2 rounded-lg text-xs font-medium transition-colors">
                    + Unggah Berkas Bukti
                  </button>

                  {/* LIST FILE TERPILIH */}
                  {filesInput.length > 0 && (
                    <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                      {filesInput.map((file, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-[11px]">
                          <span className="truncate max-w-[75%] text-slate-600 font-mono">{file.name}</span>
                          <button type="button" onClick={() => hapusFileSpesifik(idx)} className="text-red-600 font-medium hover:underline px-1">Batal</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full bg-[#0A2540] hover:bg-[#11385c] text-white font-medium py-2.5 rounded-lg text-xs uppercase tracking-wide transition-colors shadow-sm">Simpan Dokumen Arsip</button>
              </form>
            )}
          </section>

          {/* PANEL KANAN: DAFTAR DATA */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* PANEL DAFTAR AGENDA */}
            {(tabLihatData === "semua" || tabLihatData === "agenda") && (
              <div className="space-y-3">
                <div className="bg-slate-100 border-l-4 border-[#0A2540] text-[#0A2540] px-4 py-2 rounded-r-lg text-xs font-bold tracking-wider uppercase">
                  Daftar Agenda Terjadwal
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sub-kolom Agenda Mendatang */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Agenda Mendatang ({agendaMendatang.length})
                    </p>
                    {agendaMendatang.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 bg-white rounded-lg font-medium">Tidak ada rencana agenda terdekat.</p>
                    ) : (
                      agendaMendatang.map((item) => (
                        <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{item.judul}</h5>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                                item.kategori === 'Penting' ? 'bg-red-50 text-red-700 border-red-200' : 
                                item.kategori === 'Kerja' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>{item.kategori}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              <span>{new Date(item.waktuTarget).toLocaleString("id-ID")} WIB</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[10px]">
                            <button onClick={() => setModalAgenda(item)} className="text-[#0A2540] font-semibold hover:underline flex items-center gap-1">
                              Rincian Agenda {item.files && item.files.length > 0 && `(${item.files.length} Berkas)`}
                            </button>
                            <button onClick={() => hapusAgenda(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">Hapus</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Sub-kolom Riwayat Selesai */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      Riwayat Rapat Berlalu ({agendaSelesai.length})
                    </p>
                    {agendaSelesai.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 bg-white rounded-lg font-medium">Belum ada riwayat agenda rapat.</p>
                    ) : (
                      agendaSelesai.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between gap-3 text-slate-400">
                          <div>
                            <h5 className="text-xs font-semibold line-through truncate text-slate-500">{item.judul}</h5>
                            <p className="text-[9px] uppercase tracking-wider font-semibold mt-1 text-slate-400">Status: Selesai Dilaksanakan</p>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                            <button onClick={() => setModalAgenda(item)} className="text-[10px] text-slate-600 font-medium hover:underline bg-white border border-slate-200 px-2.5 py-1 rounded">Lihat Hasil</button>
                            <button onClick={() => hapusAgenda(item.id)} className="text-[10px] hover:text-red-600 transition-colors">Hapus</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PANEL DAFTAR ARSIP CATATAN */}
            {(tabLihatData === "semua" || tabLihatData === "catatan") && (
              <div className="space-y-3">
                <div className="bg-slate-100 border-l-4 border-[#0A2540] text-[#0A2540] px-4 py-2 rounded-r-lg text-xs font-bold tracking-wider uppercase">
                  Arsip Catatan & Dokumentasi Berkas
                </div>
                
                {catatanTerfilter.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-lg p-8 text-center text-xs text-slate-400 font-medium">Belum ada berkas dokumen catatan resmi yang diarsipkan.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catatanTerfilter.map((catat) => (
                      <div key={catat.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{catat.judulCatatan}</h5>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase shrink-0">Dokumen</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Arsip: {catat.tanggalInput}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2.5 rounded border border-slate-100 font-sans leading-relaxed">{catat.isiCatatan}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <div className="text-slate-400 max-w-[55%] truncate font-mono">
                            {catat.files && catat.files.length > 0 ? `${catat.files.length} Lampiran Berkas` : "Tidak ada lampiran"}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setModalCatatan(catat)} className="text-[#0A2540] font-semibold hover:underline">Buka Arsip</button>
                            <button onClick={() => hapusCatatan(catat.id)} className="text-slate-400 hover:text-red-600 transition-colors">Hapus</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL VIEW: DETAIL AGENDA */}
      {modalAgenda && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded uppercase">{modalAgenda.kategori}</span>
                <h3 className="text-sm font-bold text-[#0A2540] mt-2">{modalAgenda.judul}</h3>
              </div>
              <button onClick={() => setModalAgenda(null)} className="text-slate-400 hover:text-slate-600 text-base font-bold">✕</button>
            </div>
            
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Waktu Pelaksanaan</p>
                <p className="font-semibold">{new Date(modalAgenda.waktuTarget).toLocaleString("id-ID")} WIB</p>
              </div>
              {modalAgenda.disposisi && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Disposisi Tujuan</p>
                  <p className="font-medium text-slate-800">{modalAgenda.disposisi}</p>
                </div>
              )}
              {modalAgenda.dokumentasi && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Rincian Informasi</p>
                  <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{modalAgenda.dokumentasi}</p>
                </div>
              )}
              {(modalAgenda.emailTujuan || modalAgenda.waTujuan) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Kontak Notifikasi Luar</p>
                  {modalAgenda.emailTujuan && <p className="font-mono">Email: {modalAgenda.emailTujuan}</p>}
                  {modalAgenda.waTujuan && <p className="font-mono">WhatsApp: {modalAgenda.waTujuan}</p>}
                </div>
              )}
              
              {/* RENDERING MULTI-FILE DOWNLOAD UTK AGENDA */}
              {modalAgenda.files && modalAgenda.files.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider pl-1">Unduh Lampiran Resmi ({modalAgenda.files.length})</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {modalAgenda.files.map((file, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate max-w-[65%] font-mono text-slate-600">{file.name}</span>
                        <a href={file.data} download={file.name} className="bg-[#0A2540] hover:bg-[#11385c] text-white text-[10px] px-2.5 py-1 rounded transition-colors font-medium shrink-0">Unduh</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setModalAgenda(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-xs transition-colors">Tutup Detail</button>
          </div>
        </div>
      )}

      {/* MODAL VIEW: DETAIL CATATAN MANDIRI */}
      {modalCatatan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded uppercase">Arsip Lembar Catatan</span>
                <h3 className="text-sm font-bold text-[#0A2540] mt-2">{modalCatatan.judulCatatan}</h3>
              </div>
              <button onClick={() => setModalCatatan(null)} className="text-slate-400 hover:text-slate-600 text-base font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="text-[9px] text-slate-400 font-mono">Waktu Pengarsipan: {modalCatatan.tanggalInput}</p>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{modalCatatan.isiCatatan}</p>
              </div>

              {/* RENDERING MULTI-FILE DOWNLOAD UTK CATATAN */}
              {modalCatatan.files && modalCatatan.files.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider pl-1">Lampiran Bukti Arsip ({modalCatatan.files.length})</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {modalCatatan.files.map((file, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate max-w-[70%] font-mono text-slate-600">{file.name}</span>
                        <a href={file.data} download={file.name} className="bg-[#0A2540] hover:bg-[#11385c] text-white text-[10px] px-2.5 py-1 rounded transition-colors font-medium shrink-0">Unduh</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setModalCatatan(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-xs transition-colors">Tutup Dokumen</button>
          </div>
        </div>
      )}
    </div>
  );
}