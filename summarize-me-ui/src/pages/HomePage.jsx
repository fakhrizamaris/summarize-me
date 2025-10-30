// src/pages/HomePage.jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebaseConfig'; // Pastikan db di-impor
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import fungsi Firestore
import { jsPDF } from "jspdf"; // Import jsPDF

// Import komponen
import FloatingShapes from '../components/FloatingShapes/FloatingShapes';
import UserNavbar from '../components/UserNavbar/UserNavbar';
import FeatureCard from '../components/FeatureCard/FeatureCard';
import StepCard from '../components/StepCard/StepCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

// Import service API
import { summarizeAudio } from '../services/summarizeApi';
// Import CSS Module
import styles from './HomePage.module.css';

// Ambil appId dari global variable (jika ada)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

function HomePage({ user, onLogout }) {
  const [apiResponse, setApiResponse] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copyText, setCopyText] = useState("Salin Teks"); // State untuk tombol copy
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse(""); // Reset response saat file baru dipilih
      setCopyText("Salin Teks");
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
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    
    if (file && (allowedTypes.includes(file.type) || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse("");
      setCopyText("Salin Teks");
    } else {
      setApiResponse("⚠️ Format file tidak didukung. Harap upload MP3 atau WAV.");
    }
  };

  // Fungsi untuk menyimpan history ke Firestore
  const saveSummaryToHistory = async (summary, originalFileName, userId) => {
    if (!db || !userId) {
        console.warn("Firestore DB atau User ID tidak tersedia, history tidak disimpan.");
        return;
    }

    try {
      // Path koleksi private user: artifacts/{appId}/users/{userId}/summaries
      const historyCollectionRef = collection(db, "artifacts", appId, "users", userId, "summaries");
      
      await addDoc(historyCollectionRef, {
        fileName: originalFileName,
        summary: summary,
        createdAt: serverTimestamp() // Gunakan timestamp server
      });
      console.log("Ringkasan berhasil disimpan ke history Firestore.");

    } catch (error) {
      console.error("Gagal menyimpan history ke Firestore: ", error);
      // Tidak perlu menampilkan error ini ke user, cukup log di console
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setApiResponse("⚠️ Silakan pilih file audio terlebih dahulu!");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("User not logged in, redirecting to login.");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setApiResponse("⏳ Sedang memproses audio Anda...");
    setFileName(selectedFile.name);
    setCopyText("Salin Teks");

    try {
      // Panggil service API
      const summaryResult = await summarizeAudio(selectedFile);
      setApiResponse(summaryResult);

      // Simpan ke history (tanpa 'await' agar tidak memblokir UI)
      saveSummaryToHistory(summaryResult, selectedFile.name, currentUser.uid);

    } catch (error) {
      console.error("Error during summarization:", error);
      setApiResponse(`❌ ${error.message}\n\nPastikan file audio Anda valid dan coba lagi.`);
      if (error.message.includes("User not authenticated")) {
        navigate('/login');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Fungsi untuk menyalin teks ke clipboard
  const handleCopy = () => {
    if (!apiResponse || isProcessing) return;

    const textArea = document.createElement('textarea');
    textArea.value = apiResponse; // Salin teks Markdown mentah
    textArea.style.position = "fixed";  // Hindari scroll jump
    textArea.style.top = "0";
    textArea.style.left = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      setCopyText("✅ Tersalin!");
    } catch (err) {
      console.error('Gagal menyalin teks: ', err);
      setCopyText("Gagal salin");
    }

    document.body.removeChild(textArea);

    setTimeout(() => {
      setCopyText("Salin Teks");
    }, 2000);
  };

  // Fungsi untuk download PDF
  const handleDownloadPDF = () => {
    if (!apiResponse || isProcessing) return;

    const doc = new jsPDF();
    
    doc.setFont("helvetica", "normal");
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7; // Ketinggian baris (sesuaikan dengan font size)
    let cursorY = margin;

    // Fungsi untuk menambah halaman jika perlu
    const checkPageBreak = () => {
        if (cursorY + lineHeight > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    // Judul
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Audio", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 15;
    
    // Info File
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100); // Abu-abu
    doc.text(`File: ${fileName}`, margin, cursorY);
    cursorY += 10;

    // Reset font untuk konten
    doc.setFontSize(11); // Sedikit lebih kecil agar muat
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0); // Hitam

    const lines = apiResponse.split('\n');
    
    lines.forEach(line => {
      // Ganti **text** menjadi text (dan set bold)
      // Ganti ### Text menjadi Text (dan set bold/besar)
      let isBold = false;
      let isHeader = false;
      let processedLine = line;

      if (processedLine.startsWith('### ')) {
        isHeader = true;
        processedLine = processedLine.substring(4);
      } else if (processedLine.startsWith('**') && processedLine.endsWith('**')) {
        isBold = true;
        processedLine = processedLine.substring(2, processedLine.length - 2);
      } else if (processedLine.startsWith('* ') || processedLine.startsWith('- ')) {
        processedLine = `  • ${processedLine.substring(2)}`;
      }
      
      // splitTextToSize akan otomatis melakukan word-wrap
      const splitLines = doc.splitTextToSize(processedLine, maxLineWidth);

      splitLines.forEach(textLine => {
        checkPageBreak(); // Cek sebelum menulis
        
        if (isHeader) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
        } else if (isBold) {
            doc.setFont("helvetica", "bold");
        }

        doc.text(textLine, margin, cursorY);
        cursorY += lineHeight;

        // Reset font
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
      });
      
      // Tambah spasi antar paragraf (jika baris asli kosong)
      if (line.trim() === "") {
          cursorY += (lineHeight / 2);
      }
    });

    const safeFileName = fileName.replace(/\.[^/.]+$/, "") || "summary";
    doc.save(`${safeFileName}_summary.pdf`);
  };

  // Cek apakah ada hasil (bukan error atau pesan loading)
  const hasValidResult = apiResponse && !isProcessing && !apiResponse.startsWith("⏳") && !apiResponse.startsWith("⚠️") && !apiResponse.startsWith("❌");


  return (
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
          <span className={styles['title-icon']}>🎯</span>
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
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
            className={styles['file-input']}
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
                    setApiResponse("");
                    setCopyText("Salin Teks");
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
              <span className={styles.spinner}></span>
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
          <div className={styles['results-header']}>
            <h3 className={styles['results-title']}>
              <span className={styles['title-icon']}>📄</span>
              Hasil Ringkasan
            </h3>
            {/* Tampilkan tombol hanya jika hasil valid */}
            {hasValidResult && (
              <div className={styles['results-actions']}>
                <button 
                  onClick={handleCopy} 
                  className={`${styles['action-btn']} ${styles['btn-copy']}`}
                  disabled={isProcessing}
                >
                  📋 <span>{copyText}</span>
                </button>
                <button 
                  onClick={handleDownloadPDF} 
                  className={`${styles['action-btn']} ${styles['btn-pdf']}`}
                  disabled={isProcessing}
                >
                  📄 <span>Download PDF</span>
                </button>
              </div>
            )}
          </div>
          
          <div className={`markdown-result ${styles['results-box']}`}>
            {isProcessing && apiResponse === "⏳ Sedang memproses audio Anda..." ? (
              <div className={styles['loading-text']}>
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
          <span className={styles['title-icon']}>⚡</span>
          Fitur Unggulan
        </h2>
        <div className={styles['features-grid']}>
          <FeatureCard
            icon="🤖"
            title="AI Canggih"
            description="Teknologi speech-to-text dan NLP terkini untuk hasil maksimal."
            gradientStyle="linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))"
          />
          <FeatureCard
            icon="🗣️"
            title="Deteksi Pembicara"
            description="Secara otomatis mengenali dan melabeli siapa yang berbicara."
            gradientStyle="linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1))"
          />
          <FeatureCard
            icon="📄"
            title="Ekspor PDF & Teks"
            description="Simpan dan bagikan ringkasan Anda dengan mudah."
            gradientStyle="linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))"
          />
           <FeatureCard
            icon="🗂️"
            title="Riwayat Tersimpan"
            description="Akses kembali semua ringkasan Anda kapan saja melalui akun Anda."
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
        <div className={styles['steps-grid']}>
          <StepCard
            number="1"
            title="Upload Audio"
            description="Pilih file rekaman (MP3, WAV) dari perangkat Anda."
          />
          <StepCard
            number="2"
            title="AI Bekerja"
            description="Mentranskrip audio dan mengenali pembicara."
          />
          <StepCard
            number="3"
            title="Dapatkan Hasil"
            description="Terima ringkasan, poin penting, dan action items."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-content']}>
          <h2 className={styles['cta-title']}>Siap Meningkatkan Produktivitas?</h2>
          <p className={styles['cta-text']}>
            Bergabung dengan ribuan profesional yang sudah menghemat waktu mereka.
          </p>
          {!user && (
            <button onClick={() => navigate('/login')} className={styles['cta-button']}>
              <span>🚀</span>
              Mulai Gratis Sekarang
            </button>
          )}
        </div>
      </section>

    </div>
  );
}

export default HomePage;