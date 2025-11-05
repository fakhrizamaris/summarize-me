// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { IoCloudUploadOutline, IoSparklesOutline, IoCopyOutline, IoDownloadOutline, IoFolderOutline, IoMusicalNoteOutline, IoCloseCircleOutline, IoAdd } from 'react-icons/io5';
import { convertToWAV, needsConversion } from '../utils/audioConverter';

// Import komponen
import FloatingShapes from '../components/FloatingShapes/FloatingShapes';
import UserNavbar from '../components/UserNavbar/UserNavbar';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import FullPageLoader from '../components/FullPageLoader/FullPageLoader';
import HistorySidebar from '../components/HistorySidebar/HistorySIdebar';

// Import service API
import { summarizeAudio } from '../services/summarizeApi';

// Import CSS Module
import styles from './HomePage.module.css';

// ❌ HAPUS INI - JANGAN IMPORT useAuth DI SINI!
// import { useAuth } from '../hooks/useAuth';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ✅ TERIMA user SEBAGAI PROP dari App.jsx
function HomePage({ isSidebarOpen, onToggleSidebar, user }) {
  const navigate = useNavigate();

  // ❌ HAPUS BARIS INI - user sudah dari props
  // const { user } = useAuth();

  // State management
  const [apiResponse, setApiResponse] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copyText, setCopyText] = useState('Salin Teks');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [historyKey, setHistoryKey] = useState(0);

  // Efek untuk membersihkan state saat logout
  useEffect(() => {
    if (!user) {
      setApiResponse(null);
      setSelectedFile(null);
      setFileName('');
      setSelectedHistoryItem(null);
      setIsProcessing(false);
      setCopyText('Salin Teks');
      setActiveTab('summary');
    }
  }, [user]);

  // Redirect ke landing jika belum login
  useEffect(() => {
    if (!user && !isNavigating) {
      navigate('/');
    }
  }, [user, navigate, isNavigating]);

  // ... (sisa kode tetap sama)
  // Fungsi untuk kembali ke mode upload baru
  const handleShowUpload = () => {
    setSelectedHistoryItem(null);
    setApiResponse(null);
    setSelectedFile(null);
    setFileName('');
    setCopyText('Salin Teks');
    setActiveTab('summary');
  };

  const handleSelectHistory = (item, isDeleteOrRename = false) => {
    if (isDeleteOrRename) {
      if (selectedHistoryItem && selectedHistoryItem.id === item.id) {
        handleShowUpload();
      }
      return;
    } else if (item) {
      setSelectedHistoryItem(item);
      setApiResponse(null);
      setActiveTab('summary');
      setCopyText('Salin Teks');
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
      setCopyText('Salin Teks');
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
      setCopyText('Salin Teks');
    } else {
      setApiResponse({ error: '⚠️ Format file tidak didukung. Harap upload MP3 atau WAV.' });
    }
  };

  const saveSummaryToHistory = async (summary, transcript, originalFileName, userId) => {
    if (!db || !userId) {
      console.warn('Firestore DB atau User ID tidak tersedia, history tidak disimpan.');
      return;
    }
    try {
      const historyCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'summaries');
      await addDoc(historyCollectionRef, {
        fileName: originalFileName,
        summary: summary,
        transcript: transcript,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Gagal menyimpan history ke Firestore: ', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setApiResponse({ error: '⚠️ Silakan pilih file audio terlebih dahulu!' });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('User not logged in, redirecting to login.');
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setFileName(selectedFile.name);
    setCopyText('Salin Teks');
    setActiveTab('summary');

    try {
      let fileToUpload = selectedFile;

      if (needsConversion(selectedFile)) {
        setApiResponse({
          processing: '🔄 Mengkonversi format audio ke WAV...',
        });

        try {
          fileToUpload = await convertToWAV(selectedFile);
          console.log('Audio berhasil dikonversi ke WAV');
        } catch (conversionError) {
          throw new Error(`Gagal mengkonversi audio: ${conversionError.message}. Silakan konversi file Anda ke format MP3 atau WAV secara manual.`);
        }
      }

      setApiResponse({});

      const summaryResult = await summarizeAudio(fileToUpload);
      setApiResponse(summaryResult);

      await saveSummaryToHistory(summaryResult.summary, summaryResult.transcript, selectedFile.name, currentUser.uid);

      setHistoryKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error('Error during summarization:', error);
      setApiResponse({
        error: `❌ ${error.message}\n\nPastikan file audio Anda valid dan coba lagi.`,
      });
      if (error.message.includes('User not authenticated')) {
        navigate('/login');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  let textToDisplay = '';
  let currentTitle = 'Hasil';

  const activeData = selectedHistoryItem || apiResponse;
  const hasValidResult = !!(activeData && activeData.summary && !isProcessing);

  if (isProcessing && activeData?.processing) {
    textToDisplay = activeData.processing;
    currentTitle = 'Memproses...';
  } else if (activeData?.error) {
    textToDisplay = activeData.error;
    currentTitle = 'Error';
  } else if (hasValidResult) {
    textToDisplay = activeTab === 'summary' ? activeData.summary : activeData.transcript || 'Transkrip tidak tersedia.';
    currentTitle = selectedHistoryItem ? 'Riwayat Ringkasan' : 'Hasil Ringkasan';
  }

  const handleCopy = () => {
    if (!hasValidResult) return;
    const textToCopy = textToDisplay;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          setCopyText('✅ Tersalin!');
          setTimeout(() => setCopyText('Salin Teks'), 2000);
        },
        (err) => {
          console.warn('Gagal menyalin (modern): ', err);
          fallbackCopy(textToCopy);
        }
      );
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      setCopyText('✅ Tersalin!');
      document.body.removeChild(textArea);
      setTimeout(() => setCopyText('Salin Teks'), 2000);
    } catch (fallbackErr) {
      console.error('Fallback copy gagal: ', fallbackErr);
      setCopyText('Gagal salin');
    }
  };

  const handleDownloadPDF = () => {
    if (!hasValidResult) return;

    const textToRender = textToDisplay;
    const fileToName = selectedHistoryItem ? selectedHistoryItem.fileName : fileName || 'untitled';

    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
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

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(activeTab === 'summary' ? 'Ringkasan Audio' : 'Transkrip Penuh', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(`File: ${fileToName}`, margin, cursorY);
    cursorY += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const lines = textToDisplay.split('\n');

    lines.forEach((line) => {
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

      splitLines.forEach((textLine) => {
        checkPageBreak();
        if (isHeader) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
        } else if (isBold) {
          doc.setFont('helvetica', 'bold');
        }
        doc.text(textLine, margin, cursorY);
        cursorY += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      });

      if (line.trim() === '') {
        cursorY += lineHeight / 2;
      }
    });

    const safeFileName = (fileToName || 'file').replace(/\.[^/.]+$/, '');
    doc.save(`${safeFileName}_${activeTab}.pdf`);
  };

  const handleLogoutWrapper = async () => {
    setIsNavigating(true);
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  if (!user) {
    return <FullPageLoader text="Mengarahkan..." variant="dual" />;
  }

  return (
    <div className={styles.homeContainer}>
      <FloatingShapes />

      <UserNavbar user={user} onLogout={handleLogoutWrapper} onToggleSidebar={onToggleSidebar} isSidebarOpen={isSidebarOpen} />

      <>
        <div className={`${styles.sidebarBackdrop} ${isSidebarOpen ? styles.open : ''}`} onClick={onToggleSidebar} aria-hidden="true" />
        <HistorySidebar key={historyKey} user={user} onSelectSummary={handleSelectHistory} isSidebarOpen={isSidebarOpen} onToggle={onToggleSidebar} />
      </>

      <main className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.contentInnerWrapper}>
          {isNavigating ? (
            <FullPageLoader text="Membuka halaman..." variant="dual" />
          ) : (
            <>
              {selectedHistoryItem && (
                <button onClick={handleShowUpload} className={styles.newSummaryButton}>
                  <IoAdd /> Buat Ringkasan Baru
                </button>
              )}

              {!selectedHistoryItem && (
                <section className={styles['upload-section']}>
                  <h2 className={styles['section-title']}>
                    <span className={styles['title-icon']}>
                      <IoCloudUploadOutline />
                    </span>
                    Upload Audio Anda
                  </h2>

                  <input id="audio-upload" type="file" onChange={handleFileChange} accept=".mp3,.wav,.m4a,.aac,audio/*" className={styles['file-input']} />

                  <div
                    className={`
                      ${styles['upload-box']} 
                      ${isDragging ? styles['upload-box-drag'] : ''} 
                      ${selectedFile ? styles['upload-box-active'] : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {!selectedFile ? (
                      <label htmlFor="audio-upload" className={styles['upload-label']}>
                        <div className={styles['upload-icon']}>
                          <IoFolderOutline />
                        </div>
                        <div className={styles['upload-text']}>
                          <strong>Klik untuk upload</strong> atau drag & drop
                        </div>
                        <div className={styles['upload-hint']}>MP3, WAV, M4A, AAC (Max 100MB)</div>
                      </label>
                    ) : (
                      <div className={styles['file-selected']}>
                        <div className={styles['file-icon']}>
                          <IoMusicalNoteOutline />
                        </div>
                        <div className={styles['file-info']}>
                          <div className={styles['file-name-display']}>{fileName}</div>
                          <button onClick={handleShowUpload} className={styles['remove-file-btn']}>
                            <IoCloseCircleOutline /> Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleUpload} className={styles.summarizeButton} disabled={isProcessing || !selectedFile}>
                    {isProcessing ? (
                      <>
                        <LoadingSpinner variant="default" size="small" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <IoCloudUploadOutline />
                        <span>Ringkas Sekarang</span>
                      </>
                    )}
                  </button>
                </section>
              )}

              {activeData && (
                <section className={styles['results-section']}>
                  <div className={styles['results-header']}>
                    <h3 className={styles['section-title']}>
                      <span className={styles['title-icon']}>
                        <IoSparklesOutline />
                      </span>
                      {currentTitle}
                    </h3>
                    {hasValidResult && (
                      <div className={styles['results-actions']}>
                        <button onClick={handleCopy} className={`${styles['action-btn']} ${styles['btn-copy']}`} disabled={isProcessing}>
                          <IoCopyOutline />
                          <span>{copyText}</span>
                        </button>
                        <button onClick={handleDownloadPDF} className={`${styles['action-btn']} ${styles['btn-pdf']}`} disabled={isProcessing}>
                          <IoDownloadOutline />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {hasValidResult && (
                    <div className={styles.resultTabs}>
                      <button className={`${styles.tabButton} ${activeTab === 'summary' ? styles.active : ''}`} onClick={() => setActiveTab('summary')}>
                        Ringkasan
                      </button>
                      <button className={`${styles.tabButton} ${activeTab === 'transcript' ? styles.active : ''}`} onClick={() => setActiveTab('transcript')}>
                        Transkrip Penuh
                      </button>
                    </div>
                  )}

                  <div
                    className={`
                    markdown-result 
                    ${styles['results-box']}
                    ${activeTab === 'summary' ? styles['results-box-summary-active'] : ''}
                    ${activeTab === 'transcript' ? styles['results-box-transcript-active'] : ''}
                  `}
                  >
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
