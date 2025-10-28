// src/HomePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { auth } from './config/firebaseConfig';

// Komponen untuk Floating Shapes (Background 3D Elements)
function FloatingShapes() {
  return (
    <div style={styles.floatingContainer}>
      <div style={{...styles.shape, ...styles.shape1}}></div>
      <div style={{...styles.shape, ...styles.shape2}}></div>
      <div style={{...styles.shape, ...styles.shape3}}></div>
      <div style={{...styles.shape, ...styles.shape4}}></div>
    </div>
  );
}

// Komponen Navbar yang Modern
function UserNavbar({ user, onLogout }) {
  if (!user) return null;
  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✨</span>
          <span style={styles.logoText}>SummarizeMe</span>
        </div>
        <div style={styles.navRight}>
          <img 
            src={user.photoURL} 
            alt="Profile" 
            style={styles.navAvatar} 
            referrerPolicy="no-referrer" 
          />
          <span style={styles.navName}>{user.displayName}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// Komponen Feature Card
function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div style={{...styles.featureCard, background: gradient}}>
      <div style={styles.featureIconBox}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{description}</p>
    </div>
  );
}

// Komponen Step Card
function StepCard({ number, title, description }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNumber}>{number}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDesc}>{description}</p>
      {number < 3 && <div style={styles.stepArrow}>→</div>}
    </div>
  );
}

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
      setApiResponse("");
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
    if (file && (file.type.includes('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
      setSelectedFile(file);
      setFileName(file.name);
      setApiResponse("");
    } else {
      alert("Harap upload file audio (MP3 atau WAV)");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Silakan pilih file audio terlebih dahulu!");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setApiResponse("⏳ Sedang memproses audio Anda...");

    try {
      const token = await currentUser.getIdToken();
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
      setApiResponse(`❌ Gagal: ${error.response?.data?.error || 'Terjadi masalah koneksi atau server.'}\n\nPastikan file audio Anda valid dan coba lagi.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <FloatingShapes />
      <UserNavbar user={user} onLogout={onLogout} />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeIcon}>🚀</span>
            <span>Powered by AI</span>
          </div>
          <h1 style={styles.heroTitle}>
            Ubah Rekaman Audio Menjadi
            <br />
            <span style={styles.gradientText}>Catatan Ringkas</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Teknologi AI terdepan untuk mentranskrip dan meringkas rapat, kuliah, 
            atau wawancara Anda secara otomatis. Hemat waktu hingga 80%.
          </p>
          
          {/* Stats */}
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>99%</div>
              <div style={styles.statLabel}>Akurasi</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>5x</div>
              <div style={styles.statLabel}>Lebih Cepat</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>24/7</div>
              <div style={styles.statLabel}>Tersedia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section style={styles.uploadSection}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.titleIcon}>🎯</span>
          Mulai Sekarang
        </h2>
        <div 
          style={{
            ...styles.uploadBox,
            ...(isDragging ? styles.uploadBoxDrag : {}),
            ...(selectedFile ? styles.uploadBoxActive : {})
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="audio-upload"
            type="file"
            onChange={handleFileChange}
            accept=".mp3,.wav,audio/*"
            style={styles.fileInput}
          />
          
          {!selectedFile ? (
            <label htmlFor="audio-upload" style={styles.uploadLabel}>
              <div style={styles.uploadIcon}>📁</div>
              <div style={styles.uploadText}>
                <strong>Klik untuk upload</strong> atau drag & drop
              </div>
              <div style={styles.uploadHint}>MP3, WAV (Max 100MB)</div>
            </label>
          ) : (
            <div style={styles.fileSelected}>
              <div style={styles.fileIcon}>🎵</div>
              <div style={styles.fileInfo}>
                <div style={styles.fileNameDisplay}>{fileName}</div>
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setFileName("");
                  }}
                  style={styles.removeFileBtn}
                >
                  ✕ Hapus
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleUpload} 
          style={{
            ...styles.processBtn,
            ...(isProcessing || !selectedFile ? styles.processBtnDisabled : {})
          }}
          disabled={isProcessing || !selectedFile}
        >
          {isProcessing ? (
            <>
              <span style={styles.spinner}></span>
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
        <section style={styles.resultsSection}>
          <h3 style={styles.resultsTitle}>
            <span style={styles.titleIcon}>📄</span>
            Hasil Ringkasan
          </h3>
          <div className="markdown-result" style={styles.resultsBox}>
            {isProcessing && apiResponse === "⏳ Sedang memproses audio Anda..." ? (
              <div style={styles.loadingText}>
                <div style={styles.loadingSpinner}></div>
                <p>{apiResponse}</p>
              </div>
            ) : (
              <ReactMarkdown>{apiResponse}</ReactMarkdown>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.titleIcon}>⚡</span>
          Fitur Unggulan
        </h2>
        <div style={styles.featuresGrid}>
          <FeatureCard
            icon="🤖"
            title="AI Canggih"
            description="Teknologi speech-to-text dan NLP terkini untuk hasil maksimal"
            gradient="linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))"
          />
          <FeatureCard
            icon="⚡"
            title="Super Cepat"
            description="Proses audio 60 menit hanya dalam hitungan detik"
            gradient="linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1))"
          />
          <FeatureCard
            icon="🎯"
            title="Akurat"
            description="Tingkat akurasi 99% dengan dukungan bahasa Indonesia"
            gradient="linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1))"
          />
          <FeatureCard
            icon="🔒"
            title="Aman & Privat"
            description="Data Anda terenkripsi dan tidak dibagikan ke pihak ketiga"
            gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))"
          />
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.stepsSection}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.titleIcon}>🔄</span>
          Cara Kerja
        </h2>
        <div style={styles.stepsGrid}>
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
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Siap Meningkatkan Produktivitas?</h2>
          <p style={styles.ctaText}>
            Bergabung dengan ribuan profesional yang sudah menghemat waktu mereka
          </p>
          {!user && (
            <button onClick={() => navigate('/login')} style={styles.ctaButton}>
              <span>🚀</span>
              Mulai Gratis Sekarang
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 SummarizeMe. Dibuat dengan ❤️ untuk meningkatkan produktivitas Anda.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  floatingContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(60px)',
    opacity: 0.4,
    animation: 'float 20s infinite ease-in-out',
  },
  shape1: {
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent)',
    top: '10%',
    left: '10%',
    animationDelay: '0s',
  },
  shape2: {
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent)',
    top: '50%',
    right: '10%',
    animationDelay: '5s',
  },
  shape3: {
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(34, 211, 238, 0.3), transparent)',
    bottom: '20%',
    left: '20%',
    animationDelay: '10s',
  },
  shape4: {
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent)',
    top: '30%',
    right: '30%',
    animationDelay: '15s',
  },
  navbar: {
    position: 'relative',
    zIndex: 100,
    backgroundColor: 'rgba(30, 30, 50, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '12px 24px',
    marginBottom: '40px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  navContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
  logoIcon: {
    fontSize: '1.5em',
  },
  logoText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.2)',
  },
  navName: {
    fontSize: '0.95em',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: '0.9em',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  hero: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '60px 0 80px',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '50px',
    fontSize: '0.9em',
    marginBottom: '24px',
  },
  badgeIcon: {
    fontSize: '1.2em',
  },
  heroTitle: {
    fontSize: '3.5em',
    fontWeight: '800',
    lineHeight: '1.2',
    marginBottom: '24px',
    letterSpacing: '-0.02em',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25em',
    lineHeight: '1.6',
    opacity: 0.8,
    marginBottom: '48px',
    maxWidth: '700px',
    margin: '0 auto 48px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    marginTop: '48px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2.5em',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9em',
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: '2.5em',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  titleIcon: {
    fontSize: '1em',
  },
  uploadSection: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '700px',
    margin: '0 auto 80px',
  },
  uploadBox: {
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    padding: '48px',
    marginBottom: '24px',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  uploadBoxDrag: {
    borderColor: 'rgba(99, 102, 241, 0.6)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    transform: 'scale(1.02)',
  },
  uploadBoxActive: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: '4em',
    marginBottom: '16px',
    opacity: 0.6,
  },
  uploadText: {
    fontSize: '1.1em',
    marginBottom: '8px',
  },
  uploadHint: {
    fontSize: '0.9em',
    opacity: 0.6,
  },
  fileSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fileIcon: {
    fontSize: '3em',
  },
  fileInfo: {
    flex: 1,
    textAlign: 'left',
  },
  fileNameDisplay: {
    fontSize: '1.1em',
    marginBottom: '8px',
    fontWeight: '500',
  },
  removeFileBtn: {
    padding: '6px 12px',
    fontSize: '0.9em',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    color: '#fca5a5',
    cursor: 'pointer',
  },
  processBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '1.1em',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
  },
  processBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  resultsSection: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '80px',
  },
  resultsTitle: {
    fontSize: '2em',
    fontWeight: '600',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  resultsBox: {
    backgroundColor: 'rgba(20, 20, 30, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    maxHeight: '600px',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '40px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  featuresSection: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '80px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  featureIconBox: {
    fontSize: '3em',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '1.3em',
    fontWeight: '600',
    marginBottom: '12px',
  },
  featureDesc: {
    opacity: 0.8,
    lineHeight: '1.6',
  },
  stepsSection: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '80px',
  },
  stepsGrid: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  stepCard: {
    position: 'relative',
    flex: '1',
    minWidth: '250px',
    maxWidth: '300px',
    padding: '32px',
    backgroundColor: 'rgba(40, 40, 60, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2em',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
  },
  stepTitle: {
    fontSize: '1.3em',
    fontWeight: '600',
    marginBottom: '12px',
  },
  stepDesc: {
    opacity: 0.8',
    lineHeight: '1.6',
  },
  stepArrow: {
    position: 'absolute',
    right: '-30px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '2em',
    opacity: 0.3,
  },
  ctaSection: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '80px 40px',
    marginBottom: '60px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '2.5em',
    fontWeight: '700',
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '1.2em',
    opacity: 0.8,
    marginBottom: '32px',
  },
  ctaButton: {
    padding: '16px 48px',
    fontSize: '1.2em',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
  },
  footer: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '40px 0',
    opacity: 0.6,
    fontSize: '0.9em',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

// CSS untuk animasi (tambahkan ke index.css)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(10px, 10px) rotate(5deg); }
    50% { transform: translate(0, 20px) rotate(10deg); }
    75% { transform: translate(-10px, 10px) rotate(5deg); }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .featureCard:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  
  .processBtn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(102, 126, 234