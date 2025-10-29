// src/pages/HomePage.jsx
import React, { useState } from 'react'; // Hapus useEffect jika tidak dipakai di sini
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebaseConfig'; // Path diupdate

// Import komponen yang sudah diekstrak
import FloatingShapes from '../components/FloatingShapes/FloatingShapes';
import UserNavbar from '../components/UserNavbar/UserNavbar';
import FeatureCard from '../components/FeatureCard/FeatureCard';
import StepCard from '../components/StepCard/StepCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner'; // Import spinner

// Import service API
import { summarizeAudio } from '../services/summarizeApi';
// Import CSS Module
import styles from './HomePage.module.css';

function HomePage({ user, onLogout }) {
  const [apiResponse, setApiResponse] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse(""); // Reset response saat file baru dipilih
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    // Validasi tipe file lebih ketat
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse("");
    } else {
      // Ganti alert dengan state
      setApiResponse("⚠️ Format file tidak didukung. Harap upload MP3 atau WAV.");
      console.warn("Invalid file type dropped:", file?.type);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      // Ganti alert dengan state
      setApiResponse("⚠️ Silakan pilih file audio terlebih dahulu!");
      return;
    }

    // Cek user sebelum panggil service
    if (!auth.currentUser) {
      console.warn("User not logged in, redirecting to login.");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setApiResponse("⏳ Sedang memproses audio Anda...");
    setFileName(selectedFile.name); // Pastikan nama file di state benar

    try {
      // Panggil service API
      const summaryResult = await summarizeAudio(selectedFile);
      setApiResponse(summaryResult);
    } catch (error) {
      console.error("Error during summarization:", error);
      // Tampilkan pesan error dari service
      setApiResponse(`❌ ${error.message}\n\nPastikan file audio Anda valid dan coba lagi.`);
       if (error.message.includes("User not authenticated")) {
           navigate('/login'); // Redirect jika error autentikasi dari service
       }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // Gunakan className dari CSS Module (dengan bracket notation karena kebab-case)
    <div className={styles.container}>
      <FloatingShapes />
      <UserNavbar user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles['hero-content']}>
          <div className={styles.badge}>
            <span className={styles['badge-icon']}>🚀</span>
            <span>Powered by AI</span>
          </div>
          <h1 className={styles['hero-title']}>
            Ubah Rekaman Audio Menjadi
            <br />
            <span className={styles['gradient-text']}>Catatan Ringkas</span>
          </h1>
          <p className={styles['hero-subtitle']}>
            Teknologi AI terdepan untuk mentranskrip dan meringkas rapat, kuliah,
            atau wawancara Anda secara otomatis. Hemat waktu hingga 80%.
          </p>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles['stat-item']}>
              <div className={styles['stat-number']}>99%</div>
              <div className={styles['stat-label']}>Akurasi</div>
            </div>
            <div className={styles['stat-item']}>
              <div className={styles['stat-number']}>5x</div>
              <div className={styles['stat-label']}>Lebih Cepat</div>
            </div>
            <div className={styles['stat-item']}>
              <div className={styles['stat-number']}>24/7</div>
              <div className={styles['stat-label']}>Tersedia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className={styles['upload-section']}>
        <h2 className={styles['section-title']}>
          Mulai Sekarang
        </h2>
        <div
          className={`${styles['upload-box']} ${isDragging ? styles['upload-box-drag'] : ''} ${selectedFile ? styles['upload-box-active'] : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="audio-upload"
            type="file"
            onChange={handleFileChange}
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" // Perjelas accept
            className={styles['file-input']} // Tetap pakai style untuk display:none
          />

          {!selectedFile ? (
            <label htmlFor="audio-upload" className={styles['upload-label']}>
              <div className={styles['upload-icon']}>📁</div>
              <div className={styles['upload-text']}>
                <strong>Klik untuk upload</strong> atau drag & drop
              </div>
              <div className={styles['upload-hint']}>MP3, WAV (Max 100MB)</div>
            </label>
          ) : (
            <div className={styles['file-selected']}>
              <div className={styles['file-icon']}>🎵</div>
              <div className={styles['file-info']}>
                <div className={styles['file-name-display']}>{fileName}</div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileName("");
                    setApiResponse(""); // Reset response juga saat hapus file
                  }}
                  className={styles['remove-file-btn']}
                >
                  ✕ Hapus
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          className={`${styles['process-btn']} ${(isProcessing || !selectedFile) ? styles['process-btn-disabled'] : ''}`}
          disabled={isProcessing || !selectedFile}
        >
          {isProcessing ? (
            <>
              <span className={styles.spinner}></span> {/* Class spinner */}
              Memproses...
            </>
          ) : (
            <>
              <span>✨</span>
              Buat Ringkasan
            </>
          )}
        </button>
      </section>

      {/* Results */}
      {apiResponse && (
        <section className={styles['results-section']}>
          <h3 className={styles['results-title']}>
            <span className={styles['title-icon']}>📄</span>
            Hasil Ringkasan
          </h3>
          {/* Tambahkan className global 'markdown-result' dan className module */}
          <div className={`markdown-result ${styles['results-box']}`}>
            {/* Tampilkan LoadingSpinner jika sedang proses DAN pesan = loading */}
            {isProcessing && apiResponse === "⏳ Sedang memproses audio Anda..." ? (
              <div className={styles['loading-text']}>
                 {/* Gunakan komponen LoadingSpinner */}
                <LoadingSpinner />
                <p>{apiResponse}</p>
              </div>
            ) : (
              <ReactMarkdown>{apiResponse}</ReactMarkdown>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className={styles['features-section']}>
        <h2 className={styles['section-title']}>
          Fitur Unggulan
        </h2>
        {/* Class untuk grid */}
        <div className={styles['features-grid']}>
          <FeatureCard
            icon="🤖"
            title="AI Canggih"
            description="Teknologi speech-to-text dan NLP terkini untuk hasil maksimal"
            gradientStyle="linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))"
          />
          <FeatureCard
            icon="⚡"
            title="Super Cepat"
            description="Proses audio 60 menit hanya dalam hitungan detik"
            gradientStyle="linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))"
          />
          <FeatureCard
            icon="🎯"
            title="Akurat"
            description="Tingkat akurasi 99% dengan dukungan bahasa Indonesia"
            gradientStyle="linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1))"
          />
          <FeatureCard
            icon="🔒"
            title="Aman & Privat"
            description="Data Anda terenkripsi dan tidak dibagikan ke pihak ketiga"
            gradientStyle="linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className={styles['steps-section']}>
        <h2 className={styles['section-title']}>
          <span className={styles['title-icon']}>🔄</span>
          Cara Kerja
        </h2>
        {/* Class untuk grid */}
        <div className={styles['steps-grid']}>
          <StepCard
            number="1"
            title="Upload Audio"
            description="Pilih file rekaman dari perangkat Anda"
          />
          <StepCard
            number="2"
            title="AI Bekerja"
            description="Sistem mentranskrip dan menganalisis isi audio"
          />
          <StepCard
            number="3"
            title="Dapatkan Hasil"
            description="Terima ringkasan lengkap siap pakai"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-content']}>
          <h2 className={styles['cta-title']}>Siap Meningkatkan Produktivitas?</h2>
          <p className={styles['cta-text']}>
            Bergabung dengan ribuan profesional yang sudah menghemat waktu mereka
          </p>
          {!user && (
            <button onClick={() => navigate('/login')} className={styles['cta-button']}>
              Mulai Gratis Sekarang
            </button>
          )}
        </div>
      </section>

      {/* Footer dipindah ke App.jsx */}
      {/* <footer className={styles.footer}>...</footer> */}
    </div>
  );
}


export default HomePage;
