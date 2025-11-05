// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoMicOutline, IoSparklesOutline, IoDocumentTextOutline, IoRocketOutline, IoCheckmarkCircle, IoTimeOutline, IoShieldCheckmarkOutline, IoArrowForward, IoArrowDown } from 'react-icons/io5';
import styles from './LandingPage.module.css'; // ✅ Import CSS Module

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
    <div className={styles.container}>
      {/* Floating Background Shapes */}
      <div className={styles.backgroundShapes}>
        <div
          className={`${styles.shape} ${styles.shape1}`}
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        />
        <div
          className={`${styles.shape} ${styles.shape2}`}
          style={{
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
          }}
        />
        <div
          className={`${styles.shape} ${styles.shape3}`}
          style={{
            transform: `translate(${mousePosition.y}px, ${mousePosition.x}px)`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <IoRocketOutline className={styles.badgeIcon} />
          <span>Powered by Google AI</span>
        </div>

        <h1 className={styles.heroTitle}>
          Ubah Rekaman Audio Menjadi
          <br />
          <span className={styles.gradientText}>Catatan Ringkas & Akurat</span>
        </h1>

        <p className={styles.heroSubtitle}>Platform AI terdepan untuk mentranskrip dan meringkas meeting, kuliah, wawancara, atau podcast Anda. Hemat waktu hingga 80% dengan teknologi Google Cloud & Gemini AI.</p>

        <div className={styles.ctaButtons}>
          <Link to="/login" className={styles.primaryButton}>
            <span>Mulai Gratis</span>
            <IoArrowForward />
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsContainer}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 3D Animated Icon */}
        <div className={styles.heroIcon}>
          <div
            className={styles.iconCircle}
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.y * 2}deg) rotateY(${mousePosition.x * 2}deg)`,
            }}
          >
            <IoMicOutline className={styles.micIcon} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        data-animate
        className={styles.section}
        style={{
          opacity: isVisible.features ? 1 : 0,
          transform: isVisible.features ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <h2 className={styles.sectionTitle}>
          <IoSparklesOutline className={styles.titleIcon} />
          Fitur Unggulan
        </h2>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="steps"
        data-animate
        className={styles.section}
        style={{
          opacity: isVisible.steps ? 1 : 0,
          transform: isVisible.steps ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <h2 className={styles.sectionTitle}>Cara Kerja</h2>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>

              {index < steps.length - 1 && <div className={styles.stepArrow}>{isMobile ? <IoArrowDown /> : '→'}</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        data-animate
        className={styles.section}
        style={{
          opacity: isVisible.benefits ? 1 : 0,
          transform: isVisible.benefits ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        <div className={styles.benefitsContainer}>
          <div className={styles.benefitsContent}>
            <h2 className={styles.benefitsTitle}>Mengapa Memilih SummarizeMe?</h2>
            <div className={styles.benefitsList}>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Teknologi Google Cloud Speech-to-Text terpercaya</span>
              </div>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Google Gemini 2.5 Flash untuk summarization cerdas</span>
              </div>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Penyimpanan cloud aman dengan Firebase</span>
              </div>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Ekspor hasil ke PDF atau teks</span>
              </div>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Riwayat tersimpan dan dapat diakses kapan saja</span>
              </div>
              <div className={styles.benefitItem}>
                <IoCheckmarkCircle className={styles.checkIcon} />
                <span>Tidak ada batasan file size (hingga 100MB)</span>
              </div>
            </div>
          </div>
          <div className={styles.benefitsVisual}>
            <div className={styles.floatingCard}>
              <IoShieldCheckmarkOutline className={styles.shieldIcon} />
              <p>100% Aman & Terpercaya</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Siap Meningkatkan Produktivitas?</h2>
        <p className={styles.ctaText}>Bergabung dengan ribuan profesional yang menghemat waktu mereka</p>
        <Link to="/login" className={styles.ctaButton}>
          <IoRocketOutline />
          <span>Mulai Gratis Sekarang</span>
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
