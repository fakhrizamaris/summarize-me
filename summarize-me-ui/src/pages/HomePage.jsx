// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebaseConfig'; // .js DIHAPUS
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { FiUploadCloud } from 'react-icons/fi'; // Pastikan Anda sudah install (npm install react-icons)

// Import komponen (ekstensi .jsx dihapus)
import FloatingShapes from '../components/FloatingShapes/FloatingShapes';
import UserNavbar from '../components/UserNavbar/UserNavbar';
import FeatureCard from '../components/FeatureCard/FeatureCard';
import StepCard from '../components/StepCard/StepCard';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import FullPageLoader from '../components/FullPageLoader/FullPageLoader';
import HistorySidebar from '../components/HistorySidebar/HistorySIdebar';

// Import service API (.js dihapus)
import { summarizeAudio } from '../services/summarizeApi';
// Import CSS Module (tetap .css)
import styles from './HomePage.module.css';

// Import hook useAuth (.js dihapus)
import { useAuth } from '../hooks/useAuth';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Props (user, onLogout, dll) sekarang diambil dari useAuth dan state internal
function HomePage() {
  const { user } = useAuth(); // Mengambil user dari context
  const [apiResponse, setApiResponse] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copyText, setCopyText] = useState("Salin Teks");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const navigate = useNavigate();

  // Efek untuk membersihkan state saat logout
  useEffect(() => {
    if (!user) {
      setApiResponse(null);
      setSelectedFile(null);
      setFileName("");
      setSelectedHistoryItem(null);
      setIsProcessing(false); 
      setCopyText("Salin Teks");
      setActiveTab('summary');
      setIsSidebarOpen(false); // Selalu tutup sidebar saat logout
    }
  }, [user]); 

  // Fungsi untuk kembali ke mode upload baru
  const handleShowUpload = () => {
    setSelectedHistoryItem(null); 
    setApiResponse(null); 
    setSelectedFile(null); 
    setFileName("");
    setCopyText("Salin Teks");
    setActiveTab('summary');
  };
  
  // Fungsi baru untuk menangani klik history
  const handleSelectHistory = (item, isDeleteOrRename = false) => {
    if (isDeleteOrRename && selectedHistoryItem && selectedHistoryItem.id === item.id) {
      if (isDeleteOrRename) handleShowUpload();
    } 
    else if (item) {
      setSelectedHistoryItem(item);
      setApiResponse(null); // Bersihkan respons API lama
      setActiveTab('summary'); // Selalu reset ke tab summary
      setCopyText("Salin Teks");
    }
  };


  const handleFileChange = (event) => {
    if (!user) return; 
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse(null); 
      setSelectedHistoryItem(null); 
      setActiveTab('summary');
      setCopyText("Salin Teks");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!user) return; 
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!user) return; 

    const file = e.dataTransfer.files[0];
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    
    if (file && (allowedTypes.includes(file.type) || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse(null);
      setSelectedHistoryItem(null); 
      setActiveTab('summary');
      setCopyText("Salin Teks");
    } else {
      setApiResponse({ error: "⚠️ Format file tidak didukung. Harap upload MP3 atau WAV." });
    }
  };

  // Simpan 'transcript' juga ke Firestore
  const saveSummaryToHistory = async (summary, transcript, originalFileName, userId) => {
    if (!db || !userId) {
        console.warn("Firestore DB atau User ID tidak tersedia, history tidak disimpan.");
        return;
    }
    try {
      const historyCollectionRef = collection(db, "artifacts", appId, "users", userId, "summaries");
      await addDoc(historyCollectionRef, {
        fileName: originalFileName,
        summary: summary,
        transcript: transcript, // <-- SIMPAN TRANSKRIP
        createdAt: serverTimestamp() 
      });
      console.log("Ringkasan dan Transkrip berhasil disimpan.");
    } catch (error) {
      console.error("Gagal menyimpan history ke Firestore: ", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setApiResponse({ error: "⚠️ Silakan pilih file audio terlebih dahulu!" });
      return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("User not logged in, redirecting to login.");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setApiResponse({ processing: "⏳ Sedang memproses audio Anda..." }); 
    setFileName(selectedFile.name);
    setCopyText("Salin Teks");
    setActiveTab('summary'); 

    try {
      const summaryResult = await summarizeAudio(selectedFile);
      setApiResponse(summaryResult); 

      saveSummaryToHistory(summaryResult.summary, summaryResult.transcript, selectedFile.name, currentUser.uid);

    } catch (error) {
      console.error("Error during summarization:", error);
      setApiResponse({ error: `❌ ${error.message}\n\nPastikan file audio Anda valid dan coba lagi.` });
      if (error.message.includes("User not authenticated")) {
        navigate('/login');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  
  let textToDisplay = "";
  let currentTitle = "Hasil";
  
  const activeData = selectedHistoryItem || apiResponse;
  
  const hasValidResult = !!(activeData && activeData.summary && !isProcessing);

  if (isProcessing && activeData?.processing) {
    textToDisplay = activeData.processing;
    currentTitle = "Memproses...";
  } else if (activeData?.error) {
    textToDisplay = activeData.error;
    currentTitle = "Error";
  } else if (hasValidResult) {
    textToDisplay = activeTab === 'summary' ? activeData.summary : (activeData.transcript || "Transkrip tidak tersedia.");
    currentTitle = selectedHistoryItem ? 'Riwayat Ringkasan' : 'Hasil Ringkasan';
  }


  const handleCopy = () => {
    if (!hasValidResult) return;
    const textToCopy = textToDisplay; 

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyText("✅ Tersalin!");
        setTimeout(() => setCopyText("Salin Teks"), 2000);
      }, (err) => {
        console.warn('Gagal menyalin (modern): ', err);
        fallbackCopy(textToCopy); // Coba fallback jika gagal
      });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text; 
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      setCopyText("✅ Tersalin!");
      document.body.removeChild(textArea);
      setTimeout(() => setCopyText("Salin Teks"), 2000);
    } catch (fallbackErr) {
      console.error('Fallback copy gagal: ', fallbackErr);
      setCopyText("Gagal salin");
    }
  };


  const handleDownloadPDF = () => {
    if (!hasValidResult) return;
    
    const textToRender = textToDisplay; 
    const fileToName = selectedHistoryItem ? selectedHistoryItem.fileName : (fileName || 'untitled');

    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let cursorY = margin;

    const checkPageBreak = () => { if (cursorY + lineHeight > pageHeight - margin) { doc.addPage(); cursorY = margin; } };
    
    doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text(activeTab === 'summary' ? "Ringkasan Audio" : "Transkrip Penuh", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 15;
    
    doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.setTextColor(100); 
    doc.text(`File: ${fileToName}`, margin, cursorY);
    cursorY += 10;

    doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.setTextColor(0); 
    const lines = textToDisplay.split('\n'); 
    
    lines.forEach(line => {
      let isBold = false; let isHeader = false; let processedLine = line;
      if (processedLine.startsWith('### ')) { isHeader = true; processedLine = processedLine.substring(4); }
      else if (processedLine.startsWith('**') && processedLine.endsWith('**')) { isBold = true; processedLine = processedLine.substring(2, processedLine.length - 2); }
      else if (processedLine.startsWith('* ') || processedLine.startsWith('- ')) { processedLine = `  • ${processedLine.substring(2)}`; }
      
      const splitLines = doc.splitTextToSize(processedLine, maxLineWidth);

      splitLines.forEach(textLine => {
        checkPageBreak(); 
        if (isHeader) { doc.setFont("helvetica", "bold"); doc.setFontSize(14); }
        else if (isBold) { doc.setFont("helvetica", "bold"); }
        doc.text(textLine, margin, cursorY);
        cursorY += lineHeight;
        doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      });
      if (line.trim() === "") { cursorY += (lineHeight / 2); }
    });

    const safeFileName = (fileToName || 'file').replace(/\.[^/.]+$/, "");
    doc.save(`${safeFileName}_${activeTab}.pdf`);
  };

  const handleNavigateToLogin = () => {
    setIsNavigating(true); 
    setTimeout(() => { navigate('/login'); }, 1500); 
  };
  
  const handleLogoutWrapper = async () => {
    setIsNavigating(true); // Tampilkan loader saat logout
    try {
      await auth.signOut();
      // useAuth hook akan mendeteksi perubahan dan App.jsx akan redirect
      navigate('/login');
    } catch (error) {
      console.error("Gagal logout:", error);
    } finally {
      // setIsNavigating(false); // Biarkan FullPageLoader sampai halaman login dimuat
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- RENDER KONTEN UTAMA ---
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

      {/* Jika user login DAN memilih history, tampilkan tombol "New Summary" */}
      {user && selectedHistoryItem && (
        <button onClick={handleShowUpload} className={styles.newSummaryButton}>
          + Buat Ringkasan Baru
        </button>
      )}

      {/* Upload Section (Hanya tampil jika user login DAN tidak memilih history) */}
      {user && !selectedHistoryItem && (
        <section className={styles['upload-section']}>
          <h2 className={styles['section-title']}>
            <span className={styles['title-icon']}>🎯</span>
            Upload Audio Anda
          </h2>
          
          <input
            id="audio-upload"
            type="file"
            onChange={handleFileChange}
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
            className={styles['file-input']}
          />

          <div
            className={`${styles['upload-box']} ${isDragging ? styles['upload-box-drag'] : ''} ${selectedFile ? styles['upload-box-active'] : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
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
                    onClick={handleShowUpload} // Reset
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
            className={styles.summarizeButton}
            disabled={isProcessing || !selectedFile}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner variant="default" size="small" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <FiUploadCloud />
                <span>Ringkas Sekarang</span>
              </>
            )}
          </button>
        </section>
      )}

      {/* Results (Tampilkan jika ada data (apiResponse atau history)) */}
      {activeData && (
        <section className={styles['results-section']}>
          <div className={styles['results-header']}>
            <h3 className={styles['results-title']}>
              <span className={styles['title-icon']}>📄</span>
              {currentTitle}
            </h3>
            {hasValidResult && (
              <div className={styles['results-actions']}>
                <button 
                  onClick={handleCopy} 
                  className={`${styles['action-btn']} ${styles['btn-copy']}`}
                  disabled={isProcessing}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 1.5A1.5 1.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 0 0 1.5v3a.5.5 0 0 1-1 0v-3z"/>
                  </svg>
                  <span>{copyText}</span>
                </button>
                <button 
                  onClick={handleDownloadPDF} 
                  className={`${styles['action-btn']} ${styles['btn-pdf']}`}
                  disabled={isProcessing}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L6.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  <span>Download PDF</span>
                </button>
              </div>
            )}
          </div>

          {hasValidResult && (
            <div className={styles.resultTabs}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'summary' ? styles.active : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Ringkasan
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'transcript' ? styles.active : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                Transkrip Penuh
              </button>
            </div>
          )}
          
          <div className={`markdown-result ${styles['results-box']}`}>
            {isProcessing ? (
              <div className={styles['loading-text']}>
                <LoadingSpinner variant="dots" size="medium" text="Memproses audio Anda..." />
                <p>{textToDisplay}</p>
              </div>
            ) : (
              <ReactMarkdown>{textToDisplay}</ReactMarkdown>
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
              <button onClick={handleNavigateToLogin} className={styles['cta-button']}>
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
    <div className={styles.homeContainer}>
      <FloatingShapes />
      
      <UserNavbar 
        user={user} 
        onLogout={handleLogoutWrapper} 
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
      /> 

      {user && (
        <>
          <div 
            className={`${styles.sidebarBackdrop} ${isSidebarOpen ? styles.open : ''}`} 
            onClick={handleToggleSidebar} 
            aria-hidden="true"
          />
          <HistorySidebar 
            user={user} 
            onSelectSummary={handleSelectHistory} 
            isSidebarOpen={isSidebarOpen}
            onToggle={handleToggleSidebar}
          />
        </>
      )}

      <main className={`${styles.mainContent} ${user && isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.contentInnerWrapper}>
          {isNavigating ? (
            <FullPageLoader text="Membuka halaman login..." variant="dual" />
          ) : (
            <MainContent />
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;

