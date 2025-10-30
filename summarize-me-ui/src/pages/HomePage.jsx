// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react'; // <-- PERBAIKAN 1: Impor useEffect
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
import HistorySidebar from '../components/HistorySidebar/HistorySIdebar'; // <-- IMPORT BARU

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
  const [copyText, setCopyText] = useState("Salin Teks");
  
  // --- PERBAIKAN: State baru untuk history ---
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const navigate = useNavigate();

  // --- PERBAIKAN 2: Tambahkan useEffect ini ---
  // Efek ini akan berjalan setiap kali prop 'user' berubah.
  useEffect(() => {
    // Jika user berubah menjadi 'null' (artinya baru saja logout)
    if (!user) {
      // Bersihkan semua state yang berisi data pengguna
      setApiResponse("");
      setSelectedFile(null);
      setFileName("");
      setSelectedHistoryItem(null);
      setIsProcessing(false); // Hentikan loading jika sedang proses
      setCopyText("Salin Teks"); // Reset tombol copy
    }
  }, [user]); // <-- 'user' adalah dependensi

  // --- PERBAIKAN: Fungsi untuk kembali ke mode upload ---
  const handleShowUpload = () => {
    setSelectedHistoryItem(null); // Hapus item history yang dipilih
    setApiResponse(""); // Bersihkan respons API lama
    setSelectedFile(null); // Bersihkan file
    setFileName("");
    setCopyText("Salin Teks");
  };

  const handleFileChange = (event) => {
    // PERBAIKAN (Request 2): Jangan lakukan apapun jika tidak login
    if (!user) return; 
    
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse(""); 
      setCopyText("Salin Teks");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    // PERBAIKAN (Request 2): Jangan drag jika tidak login
    if (!user) return; 
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    // PERBAIKAN (Request 2): Jangan drop jika tidak login
    if (!user) return; 

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

  // Fungsi untuk menyimpan history ke Firestore (Tetap sama)
  const saveSummaryToHistory = async (summary, originalFileName, userId) => {
    if (!db || !userId) {
        console.warn("Firestore DB atau User ID tidak tersedia, history tidak disimpan.");
        return;
    }
    try {
      const historyCollectionRef = collection(db, "artifacts", appId, "users", userId, "summaries");
      await addDoc(historyCollectionRef, {
        fileName: originalFileName,
        summary: summary,
        createdAt: serverTimestamp()
      });
      console.log("Ringkasan berhasil disimpan ke history Firestore.");
    } catch (error) {
      console.error("Gagal menyimpan history ke Firestore: ", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setApiResponse("⚠️ Silakan pilih file audio terlebih dahulu!");
      return;
    }
    
    // Cek user sudah ada (meski tombol upload hanya tampil jika login)
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
      const summaryResult = await summarizeAudio(selectedFile);
      setApiResponse(summaryResult);
      // Simpan ke history
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

  // PERBAIKAN: Fungsi Copy disesuaikan untuk history
  const handleCopy = () => {
    // Tentukan teks mana yang akan disalin
    const textToCopy = selectedHistoryItem ? selectedHistoryItem.summary : apiResponse;
    if (!textToCopy || isProcessing) return;

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy; // Salin teks dari state yang relevan
    textArea.style.position = "fixed";
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
    setTimeout(() => { setCopyText("Salin Teks"); }, 2000);
  };

  // PERBAIKAN: Fungsi PDF disesuaikan untuk history
  const handleDownloadPDF = () => {
    // Tentukan data mana yang akan dipakai
    const textToRender = selectedHistoryItem ? selectedHistoryItem.summary : apiResponse;
    const fileToName = selectedHistoryItem ? selectedHistoryItem.fileName : fileName;

    if (!textToRender || isProcessing) return;

    const doc = new jsPDF();
    
    doc.setFont("helvetica", "normal");
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let cursorY = margin;

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
    
    // Info File (gunakan nama file yang relevan)
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100); 
    doc.text(`File: ${fileToName}`, margin, cursorY);
    cursorY += 10;

    // Reset font untuk konten
    doc.setFontSize(11); 
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0); 

    const lines = textToRender.split('\n'); // Render teks yang relevan
    
    lines.forEach(line => {
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
      
      const splitLines = doc.splitTextToSize(processedLine, maxLineWidth);

      splitLines.forEach(textLine => {
        checkPageBreak(); 
        
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
      
      if (line.trim() === "") {
          cursorY += (lineHeight / 2);
      }
    });

    const safeFileName = fileToName.replace(/\.[^/.]+$/, "") || "summary";
    doc.save(`${safeFileName}_summary.pdf`);
  };

  // PERBAIKAN: Tentukan teks yang akan ditampilkan di result box
  const currentResultText = selectedHistoryItem ? selectedHistoryItem.summary : apiResponse;
  
  // Cek apakah ada hasil (bukan error atau pesan loading)
  const hasValidResult = currentResultText && !isProcessing && !currentResultText.startsWith("⏳") && !currentResultText.startsWith("⚠️") && !currentResultText.startsWith("❌");

  // --- RENDER KONTEN UTAMA ---
  // Ini adalah konten yang akan dilihat user (baik login/logout)
  // atau konten di sebelah kanan sidebar (jika login)
  const MainContent = () => (
    <>
      {/* Hero Section (Hanya tampil jika BELUM login) */}
      {!user && (
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
      )}

      {/* === PERBAIKAN LOGIC UPLOAD & HISTORY VIEW === */}
      
      {/* Jika user login DAN memilih history, tampilkan tombol "New Summary" */}
      {user && selectedHistoryItem && (
        <button onClick={handleShowUpload} className={styles.newSummaryButton}>
          + Buat Ringkasan Baru
        </button>
      )}

      {/* Upload Section (Tampil jika user logout ATAU (login DAN tidak memilih history)) */}
      {(!user || (user && !selectedHistoryItem)) && (
        <section className={styles['upload-section']}>
          <h2 className={styles['section-title']}>
            <span className={styles['title-icon']}>🎯</span>
            {/* Judul dinamis berdasarkan status login */}
            {user ? 'Upload Audio Anda' : 'Mulai Sekarang'}
          </h2>
          <div
            className={`${styles['upload-box']} ${isDragging ? styles['upload-box-drag'] : ''} ${selectedFile ? styles['upload-box-active'] : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Input file asli (hanya ada jika user login) */}
            {user && (
              <input
                id="audio-upload"
                type="file"
                onChange={handleFileChange}
                accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
                className={styles['file-input']}
              />
            )}

            {/* === PERBAIKAN UI/UX (REQUEST 2) === */}
            {!user ? (
              // Tampilan jika user BELUM LOGIN
              <button className={styles.loginPromptButton} onClick={() => navigate('/login')}>
                <div className={styles['upload-icon']}>🔒</div>
                <div className={styles['upload-text']}>
                  <strong>Login untuk Mulai</strong>
                </div>
                <div className={styles['upload-hint']}>Gratis untuk memulai</div>
              </button>
            ) : !selectedFile ? (
              // Tampilan jika user SUDAH LOGIN & Belum pilih file
              <label htmlFor="audio-upload" className={styles['upload-label']}>
                <div className={styles['upload-icon']}>📁</div>
                <div className={styles['upload-text']}>
                  <strong>Klik untuk upload</strong> atau drag & drop
                </div>
                <div className={styles['upload-hint']}>MP3, WAV (Max 100MB)</div>
              </label>
            ) : (
              // Tampilan jika user SUDAH LOGIN & SUDAH pilih file
              <div className={styles['file-selected']}>
                <div className={styles['file-icon']}>🎵</div>
                <div className={styles['file-info']}>
                  <div className={styles['file-name-display']}>{fileName}</div>
                  <button
                    onClick={handleShowUpload} // Reset
                    className={styles['remove-file-btn']}
                  >
                    ✕ Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tombol proses (Hanya tampil jika user login) */}
          {user && (
            <button
              onClick={handleUpload}
              className={`${styles['process-btn']} ${(isProcessing || !selectedFile) ? styles['process-btn-disabled'] : ''}`}
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner variant="default" size="small" />
                  Memproses...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Buat Ringkasan
                </>
              )}
            </button>
          )}
        </section>
      )}
      {/* === AKHIR PERBAIKAN LOGIC UPLOAD === */}


      {/* Results (Tampilkan jika ada apiResponse ATAU selectedHistoryItem) */}
      {currentResultText && (
        <section className={styles['results-section']}>
          <div className={styles['results-header']}>
            <h3 className={styles['results-title']}>
              <span className={styles['title-icon']}>📄</span>
              {/* Judul dinamis berdasarkan konteks */}
              {selectedHistoryItem ? 'Ringkasan dari History' : 'Hasil Ringkasan'}
            </h3>
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
                <LoadingSpinner variant="gradient" size="large" text="Memproses audio Anda..." />
                <p>{apiResponse}</p>
              </div>
            ) : (
              // Tampilkan hasil dari history atau API
              <ReactMarkdown>{currentResultText}</ReactMarkdown>
            )}
          </div>
        </section>
      )}

      {/* Features Section (Hanya tampil jika BELUM login) */}
      {!user && (
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
      )}

      {/* How It Works (Hanya tampil jika BELUM login) */}
      {!user && (
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
      )}

      {/* CTA Section (Hanya tampil jika BELUM login) */}
      {!user && (
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
      )}
    </>
  );


  // --- RENDER UTAMA ---
  return (
    <div className={styles.container}>
      <FloatingShapes />
      {/* Navbar akan tampil jika user login, dan sembunyi jika tidak */}
      <UserNavbar user={user} onLogout={onLogout} /> 

      {/* === PERBAIKAN: Layout Halaman === */}
      <div className={styles.pageContent}>
        
        {/* Tampilkan Sidebar HANYA jika user login */}
        {user && (
          <HistorySidebar 
            user={user} 
            onSelectSummary={setSelectedHistoryItem} 
          />
        )}

        {/* Konten Utama (Upload/Landing/Results) */}
        <main className={styles.mainContent}>
          <MainContent />
        </main>

      </div>
    </div>
  );
}

export default HomePage;