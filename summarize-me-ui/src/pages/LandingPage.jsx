import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {IoMicOutline, IoSparklesOutline, IoDocumentTextOutline, IoRocketOutline, IoCheckmarkCircle, IoTimeOutline, IoShieldCheckmarkOutline, IoArrowForward, IoArrowDown } from 'react-icons/io5';

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Deteksi ukuran layar
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <IoMicOutline />,
      title: 'Speech-to-Text Akurat',
      description: 'Teknologi Google Cloud Speech-to-Text dengan akurasi 99% untuk bahasa Indonesia dan internasional',
    },
    {
      icon: <IoSparklesOutline />,
      title: 'AI Summarization',
      description: 'Google Gemini 2.5 Flash menghasilkan ringkasan cerdas dengan poin-poin penting dan action items',
    },
    {
      icon: <IoDocumentTextOutline />,
      title: 'Deteksi Pembicara',
      description: 'Identifikasi otomatis berbagai pembicara dalam percakapan atau meeting Anda',
    },
    {
      icon: <IoTimeOutline />,
      title: 'Hemat Waktu 80%',
      description: 'Proses rekaman 1 jam hanya membutuhkan waktu beberapa menit untuk hasil lengkap',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Audio',
      description: 'Drag & drop file audio Anda (MP3, WAV) atau pilih dari perangkat',
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Sistem mentranskrip audio dan mengidentifikasi pembicara secara otomatis',
    },
    {
      number: '03',
      title: 'Dapatkan Hasil',
      description: 'Terima ringkasan, transkrip lengkap, dan ekspor ke PDF atau teks',
    },
  ];

  const stats = [
    { number: '90%', label: 'Akurasi Transkrip' },
    { number: '3x', label: 'Lebih Cepat' },
    { number: '24/7', label: 'Tersedia' },
  ];

  return (
    <div style={styles.container}>
      {/* Floating Background Shapes */}
      <div style={styles.backgroundShapes}>
        <div
          style={{
            ...styles.shape,
            ...styles.shape1,
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        />
        <div
          style={{
            ...styles.shape,
            ...styles.shape2,
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
          }}
        />
        <div
          style={{
            ...styles.shape,
            ...styles.shape3,
            transform: `translate(${mousePosition.y}px, ${mousePosition.x}px)`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          <IoRocketOutline style={styles.badgeIcon} />
          <span>Powered by Google AI</span>
        </div>

        <h1 style={styles.heroTitle}>
          Ubah Rekaman Audio Menjadi
          <br />
          <span style={styles.gradientText}>Catatan Ringkas & Akurat</span>
        </h1>

        <p style={styles.heroSubtitle}>Platform AI terdepan untuk mentranskrip dan meringkas meeting, kuliah, wawancara, atau podcast Anda. Hemat waktu hingga 80% dengan teknologi Google Cloud & Gemini AI.</p>

        <div style={styles.ctaButtons}>
          <Link to="/login" style={styles.primaryButton}>
            <span>Mulai Gratis</span>
            <IoArrowForward />
          </Link>
        </div>

        {/* Stats */}
        <div style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statItem}>
              <div style={styles.statNumber}>{stat.number}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 3D Animated Icon */}
        <div style={styles.heroIcon}>
          <div
            style={{
              ...styles.iconCircle,
              transform: `perspective(1000px) rotateX(${mousePosition.y * 2}deg) rotateY(${mousePosition.x * 2}deg)`,
            }}
          >
            <IoMicOutline style={styles.micIcon} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        data-animate
        style={{
          ...styles.section,
          opacity: isVisible.features ? 1 : 0,
          transform: isVisible.features ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <h2 style={styles.sectionTitle}>
          <IoSparklesOutline style={styles.titleIcon} />
          Fitur Unggulan
        </h2>

        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                ...styles.featureCard,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="steps"
        data-animate
        style={{
          ...styles.section,
          opacity: isVisible.steps ? 1 : 0,
          transform: isVisible.steps ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <h2 style={styles.sectionTitle}>Cara Kerja</h2>

        <div style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.number}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.description}</p>
              </div>
              
              {/* Panah responsif: horizontal di desktop, vertical di mobile */}
              {index < steps.length - 1 && (
                <div style={{
                  ...styles.stepArrow,
                  ...(isMobile ? styles.stepArrowMobile : styles.stepArrowDesktop)
                }}>
                  {isMobile ? <IoArrowDown /> : '→'}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        data-animate
        style={{
          ...styles.section,
          opacity: isVisible.benefits ? 1 : 0,
          transform: isVisible.benefits ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <div style={styles.benefitsContainer}>
          <div style={styles.benefitsContent}>
            <h2 style={styles.benefitsTitle}>Mengapa Memilih SummarizeMe?</h2>
            <div style={styles.benefitsList}>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Teknologi Google Cloud Speech-to-Text terpercaya</span>
              </div>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Google Gemini 2.5 Flash untuk summarization cerdas</span>
              </div>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Penyimpanan cloud aman dengan Firebase</span>
              </div>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Ekspor hasil ke PDF atau teks</span>
              </div>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Riwayat tersimpan dan dapat diakses kapan saja</span>
              </div>
              <div style={styles.benefitItem}>
                <IoCheckmarkCircle style={styles.checkIcon} />
                <span>Tidak ada batasan file size (hingga 100MB)</span>
              </div>
            </div>
          </div>
          <div style={styles.benefitsVisual}>
            <div style={styles.floatingCard}>
              <IoShieldCheckmarkOutline style={styles.shieldIcon} />
              <p>100% Aman & Terpercaya</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Siap Meningkatkan Produktivitas?</h2>
        <p style={styles.ctaText}>Bergabung dengan ribuan profesional yang menghemat waktu mereka</p>
        <Link to="/login" style={styles.ctaButton}>
          <IoRocketOutline />
          <span>Mulai Gratis Sekarang</span>
        </Link>
      </section>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  backgroundShapes: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.3,
    transition: 'transform 0.3s ease-out',
  },
  shape1: {
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent)',
    top: '10%',
    left: '10%',
  },
  shape2: {
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4), transparent)',
    top: '50%',
    right: '10%',
  },
  shape3: {
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(34, 211, 238, 0.4), transparent)',
    bottom: '10%',
    left: '20%',
  },
  hero: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '120px 20px 80px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '50px',
    fontSize: '0.9em',
    marginBottom: '24px',
    animation: 'fadeInDown 0.6s ease-out',
  },
  badgeIcon: {
    fontSize: '1.2em',
  },
  heroTitle: {
    fontSize: 'clamp(2em, 5vw, 3.5em)',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: '24px',
    animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  },
  heroSubtitle: {
    fontSize: 'clamp(1em, 2vw, 1.2em)',
    lineHeight: 1.6,
    opacity: 0.8,
    maxWidth: '700px',
    margin: '0 auto 48px',
    animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '60px',
    animation: 'fadeInUp 0.8s ease-out 0.6s backwards',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    fontSize: '1.1em',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '48px',
    flexWrap: 'wrap',
    animation: 'fadeInUp 0.8s ease-out 0.8s backwards',
  },
  statItem: {
    textAlign: 'center',
    minWidth: '100px',
  },
  statNumber: {
    fontSize: '2.5em',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '0.9em',
    opacity: 0.7,
  },
  heroIcon: {
    position: 'relative',
    marginTop: '60px',
    display: 'flex',
    justifyContent: 'center',
    animation: 'fadeIn 1s ease-out 1s backwards',
  },
  iconCircle: {
    width: '200px',
    height: '200px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4)',
    transition: 'transform 0.1s ease-out',
    animation: 'float 3s ease-in-out infinite',
  },
  micIcon: {
    fontSize: '80px',
    color: '#fff',
  },
  section: {
    position: 'relative',
    zIndex: 1,
    padding: '80px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8em, 4vw, 2.5em)',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  titleIcon: {
    fontSize: '1em',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    background: 'rgba(40, 40, 60, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s',
    animation: 'fadeInUp 0.6s ease-out backwards',
  },
  featureIcon: {
    fontSize: '3em',
    marginBottom: '16px',
    color: '#a0a0ff',
  },
  featureTitle: {
    fontSize: '1.3em',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#e0e0ff',
  },
  featureDesc: {
    opacity: 0.8,
    lineHeight: 1.6,
    color: '#c0c0cc',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    alignItems: 'center',
  },
  stepCard: {
    width: '100%',
    maxWidth: '500px',
    padding: '32px',
    background: 'rgba(40, 40, 60, 0.6)',
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
    fontSize: '1.5em',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
  },
  stepTitle: {
    fontSize: '1.3em',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#e0e0ff',
  },
  stepDesc: {
    opacity: 0.8,
    lineHeight: 1.6,
    color: '#c0c0cc',
  },
  stepArrow: {
    fontSize: '2em',
    opacity: 0.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepArrowMobile: {
    fontSize: '2.5em',
    margin: '16px 0',
  },
  stepArrowDesktop: {
    display: 'none', // Sembunyikan di mobile, tampilkan dengan media query
  },
  benefitsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '48px',
    alignItems: 'center',
  },
  benefitsContent: {},
  benefitsTitle: {
    fontSize: 'clamp(1.8em, 4vw, 2.5em)',
    fontWeight: 700,
    marginBottom: '32px',
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.1em',
  },
  checkIcon: {
    fontSize: '1.5em',
    color: '#4ade80',
    flexShrink: 0,
  },
  benefitsVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCard: {
    padding: '48px',
    background: 'rgba(40, 40, 60, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    animation: 'float 3s ease-in-out infinite',
  },
  shieldIcon: {
    fontSize: '80px',
    color: '#4ade80',
    marginBottom: '16px',
  },
  ctaSection: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '80px 20px',
    margin: '80px 20px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctaTitle: {
    fontSize: 'clamp(1.8em, 4vw, 2.5em)',
    fontWeight: 700,
    marginBottom: '16px',
  },
  ctaText: {
    fontSize: '1.2em',
    opacity: 0.8,
    marginBottom: '32px',
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 48px',
    fontSize: '1.2em',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
  },
};

// Tambahkan keyframes untuk animasi
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  button:hover, a[href*="/login"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5) !important;
  }

  /* Desktop: tampilkan panah horizontal */
  @media (min-width: 768px) {
    [style*="stepsContainer"] {
      flex-direction: row !important;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    [style*="stepArrowDesktop"] {
      display: flex !important;
      margin: 0 16px;
    }
    
    [style*="stepArrowMobile"] {
      display: none !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default LandingPage;