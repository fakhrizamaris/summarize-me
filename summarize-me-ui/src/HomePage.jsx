// src/HomePage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { auth } from './config/firebaseConfig'; // Import auth untuk cek login

// Komponen Navbar (bisa diimpor dari file lain jika sudah dipisah)
function UserNavbar({ user, onLogout }) { /* ... kode navbar sama ... */ }

function HomePage({ user, onLogout }) { // Terima user & onLogout
  const [apiResponse, setApiResponse] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("Belum ada file dipilih");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate(); // Dapatkan fungsi navigasi

  const handleFileChange = (event) => { /* ... kode sama ... */ };

  // --- Fungsi Upload DIMODIFIKASI ---
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Silakan pilih file audio terlebih dahulu!");
      return;
    }

    const currentUser = auth.currentUser; // Cek status login

    // Jika BELUM login, arahkan ke halaman /login
    if (!currentUser) {
      navigate('/login'); // Redirect ke halaman login
      return; // Hentikan proses
    }

    // --- Jika SUDAH login, lanjutkan proses upload ---
    setIsProcessing(true);
    setApiResponse("⏳ Sedang memproses audio Anda...");

    try {
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("audioFile", selectedFile);

      const response = await axios.post( /* ... endpoint & headers sama ... */ );
      setApiResponse(response.data.summary);
    } catch (error) {
        console.error("Error upload file:", error);
        setApiResponse(`❌ Gagal: ${error.response?.data?.error || 'Terjadi masalah koneksi atau server.'}\n\n Pastikan file audio Anda valid dan coba lagi.`);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Navbar hanya tampil jika user ada */}
      <UserNavbar user={user} onLogout={onLogout} />

      {/* Bagian Hero/Judul */}
      <section style={styles.heroSection}>
          <h1>Dapatkan Intisari Rapat & Kuliah Anda</h1>
          <p style={styles.subtitle}>
              Unggah rekaman audio, dapatkan transkrip akurat dan ringkasan poin-per-poin secara otomatis. Fokus pada diskusi, bukan mencatat. 📝✨
          </p>
      </section>

      {/* Form Upload */}
      <section style={styles.uploadSection}>
          {/* ... Tampilan form upload sama ... */}
           <h4>Mulai Sekarang</h4>
           <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.95em' }}>Pilih file audio Anda (MP3, WAV):</p>
           <div style={styles.uploadBox}>
               <label htmlFor="audio-upload" style={styles.fileInputLabel}>
                   {fileName} {/* State fileName sekarang berisi instruksi/nama file */}
               </label>
               <input id="audio-upload" type="file" onChange={handleFileChange} accept=".mp3,.wav,audio/*" style={{ display: 'none' }} />
               <button onClick={handleUpload} style={styles.summarizeButton} disabled={isProcessing}>
                    {/* Tombol selalu aktif, pengecekan login di dalam handleUpload */}
                   {isProcessing ? 'Memproses...' : '▶️ Buat Ringkasan'}
               </button>
           </div>
      </section>

      {/* Area Hasil */}
      {apiResponse && (
          <section className="markdown-result" style={styles.resultsArea}>
            {/* ... Tampilan hasil sama ... */}
          </section>
      )}

      {/* Footer opsional */}
      {/* <footer style={styles.footer}>...</footer> */}
    </>
  );
}

// Salin objek 'styles' dari App.jsx sebelumnya ke sini
const styles = { /* ... styling hero, upload, hasil, dll ... */ };

export default HomePage;