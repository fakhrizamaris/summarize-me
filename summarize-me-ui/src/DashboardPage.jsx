// src/DashboardPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// --- Komponen Navbar ---
function UserNavbar({ user, onLogout }) {
  if (!user) return null;
  return (
    <div style={styles.navbar}> {/* Gunakan style object */}
      <img src={user.photoURL} alt="Foto Profil" style={styles.navbarAvatar} referrerPolicy="no-referrer" />
      <span style={styles.navbarName}>{user.displayName}</span>
      <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
    </div>
  );
}

// --- Komponen Halaman Dashboard ---
function DashboardPage({ user, onLogout }) {
  const [apiResponse, setApiResponse] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("Belum ada file dipilih"); // State nama file
  const [isProcessing, setIsProcessing] = useState(false); // State loading

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setSelectedFile(file);
        setFileName(file.name); // Tampilkan nama file
        setApiResponse("");
    } else {
        setSelectedFile(null);
        setFileName("Belum ada file dipilih");
    }
  };

  const handleUpload = async () => {
    if (!user) { alert("Sesi tidak valid, silakan login ulang."); return; }
    if (!selectedFile) { alert("Silakan pilih file audio terlebih dahulu!"); return; }

    setIsProcessing(true); // Mulai loading
    setApiResponse("⏳ Sedang memproses audio Anda..."); // Pesan loading awal

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("audioFile", selectedFile);

      const response = await axios.post(
        "http://localhost:8080/api/summarize",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApiResponse(response.data.summary);
    } catch (error) {
      console.error("Error upload file:", error);
      setApiResponse(`❌ Gagal: ${error.response?.data?.error || 'Terjadi masalah koneksi atau server.'}\n\n Pastikan file audio Anda valid dan coba lagi.`);
    } finally {
        setIsProcessing(false); // Selesai loading (baik sukses maupun gagal)
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <UserNavbar user={user} onLogout={onLogout} />

      {/* --- Area Upload --- */}
      <section style={styles.uploadArea}>
        <h2>Upload Rekaman Anda</h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '1em' }}>
          Pilih file audio (MP3 atau WAV) yang ingin Anda ringkas.
        </p>

        {/* Input file yang lebih stylish (custom) */}
        <label htmlFor="audio-upload" style={styles.fileInputLabel}>
          {fileName} {/* Tampilkan nama file di sini */}
        </label>
        <input
            id="audio-upload"
            type="file"
            onChange={handleFileChange}
            accept=".mp3,.wav,audio/*"
            style={{ display: 'none' }} // Sembunyikan input asli
        />

        <button onClick={handleUpload} style={styles.summarizeButton} disabled={isProcessing || !selectedFile}>
          {isProcessing ? 'Memproses...' : 'Buat Ringkasan'}
        </button>
      </section>

      {/* Garis Pemisah */}
      {apiResponse && <hr style={styles.separator} />}

      {/* --- Area Hasil --- */}
      {apiResponse && (
        <section className="markdown-result" style={styles.resultsArea}>
            {isProcessing && apiResponse === "⏳ Sedang memproses audio Anda..." ? (
                <p><i>{apiResponse}</i></p> // Tampilkan status loading awal
            ) : (
                // Tambahkan judul di atas hasil
                <>
                    <h3>Hasil Ringkasan:</h3>
                    <ReactMarkdown>{apiResponse}</ReactMarkdown>
                </>
            )}
        </section>
      )}
    </div>
  );
}

// --- Styling untuk Dashboard ---
const styles = {
    dashboardContainer: { width: '100%', maxWidth: '900px', margin: '0 auto' },
    navbar: { backgroundColor: 'rgba(30, 30, 50, 0.8)', padding: '10px 20px', borderRadius: '8px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' },
    navbarAvatar: { borderRadius: '50%', width: '30px', height: '30px', marginRight: '10px' },
    navbarName: { marginRight: 'auto', fontSize: '0.9em', opacity: 0.9, fontWeight: 500 },
    logoutButton: { padding: '0.4em 0.8em', fontSize: '0.9em', backgroundColor: '#444', border: '1px solid #666' },
    uploadArea: { backgroundColor: 'rgba(40, 40, 60, 0.5)', padding: '2rem 2.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', marginBottom: '2.5rem' },
    fileInputLabel: {
        display: 'block', // Agar memenuhi lebar
        padding: '12px 20px',
        border: '2px dashed #667', // Border lebih jelas
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        textAlign: 'center',
        color: '#bbb',
        marginBottom: '1rem',
        overflow: 'hidden', // Cegah teks panjang meluber
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'border-color 0.2s, background-color 0.2s',
    },
    // ':hover': { borderColor: '#8c8cff', backgroundColor: 'rgba(140, 140, 255, 0.1)' }, // Efek hover (perlu CSS)
    summarizeButton: {
        padding: '0.8em 2em',
        fontSize: '1.05em',
        backgroundColor: '#8c8cff',
        color: '#1a1a2e',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        // disabled style (bisa juga pakai :disabled di CSS)
        // opacity: isProcessing || !selectedFile ? 0.6 : 1,
        // cursor: isProcessing || !selectedFile ? 'not-allowed' : 'pointer',
    },
    separator: {
        border: 'none',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        margin: '2.5rem 0',
    },
    resultsArea: {
        // Styling markdown-result sudah ada di index.css atau di bawah
        minHeight: '100px',
        backgroundColor: 'rgba(20, 20, 30, 0.7)',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left',
        whiteSpace: 'pre-wrap',
        maxHeight: '500px',
        overflowY: 'auto',
    },
     // Salin styling .markdown-result dari index.css ke sini jika perlu
    // markdownResultH3: { color: '#a0a0ff', marginTop: '0', marginBottom: '1em' },
};

export default DashboardPage;