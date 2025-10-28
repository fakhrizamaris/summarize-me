// src/LandingPage.jsx
import React from 'react';

// Komponen kecil untuk item fitur (bisa dipisah ke file sendiri nanti)
function FeatureItem({ icon, title, description }) {
  return (
    <div style={styles.featureItem}>
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDescription}>{description}</p>
    </div>
  );
}

function LandingPage({ onLoginClick }) {
  return (
    <div style={styles.landingContainer}>

      {/* ===== HERO SECTION ===== */}
      <section style={styles.heroSection}>
        <div style={styles.heroText}>
          <h1>Ubah Rekaman Audio Menjadi Catatan Ringkas</h1>
          <p style={styles.heroSubtitle}>
            Dapatkan transkrip akurat dan ringkasan poin-per-poin dari rapat, kuliah, atau wawancara Anda secara otomatis. Hemat waktu, pahami lebih cepat.
          </p>
          <button onClick={onLoginClick} style={styles.heroButton}>
            Mulai Gratis dengan Google
          </button>
          <p style={styles.heroSubtext}>Proses cepat, aman, dan mudah digunakan.</p>
        </div>
        <div style={styles.heroVisual}>
           {/* Ganti dengan ilustrasi profesional proses audio ke dokumen */}
           <div style={styles.visualPlaceholder}></div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Maksimalkan Produktivitas Anda</h2>
        <div style={styles.featuresGrid}>
          <FeatureItem
            icon="⏱️" // Placeholder icon
            title="Hemat Waktu & Tenaga"
            description="Fokus pada diskusi penting, biarkan kami yang menangani pencatatan dan peringkasan."
          />
          <FeatureItem
            icon="✅" // Placeholder icon
            title="Akurasi Tinggi"
            description="Transkrip dihasilkan dengan teknologi pengenalan suara terdepan untuk keandalan maksimal."
          />
          <FeatureItem
            icon="🎯" // Placeholder icon
            title="Intisari Cepat"
            description="Dapatkan poin-poin kunci dan ringkasan terstruktur untuk pemahaman yang efisien."
          />
          <FeatureItem
             icon="🔒" // Placeholder icon
            title="Aman & Terpercaya"
            description="Login mudah dan aman menggunakan akun Google Anda. Privasi data terjamin."
           />
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>Hanya 3 Langkah Mudah</h2>
        <div style={styles.stepsGrid}>
          {/* Visual Step 1 */}
          <div style={styles.stepItem}>
            <div style={styles.stepIcon}>⬆️</div> {/* Ganti dengan ikon upload */}
            <h3 style={styles.stepTitle}>1. Unggah Rekaman</h3>
            <p>Pilih file audio (MP3, WAV) dari perangkat Anda.</p>
          </div>
           {/* Visual Step 2 */}
          <div style={styles.stepItem}>
            <div style={styles.stepIcon}>⚙️</div> {/* Ganti dengan ikon proses */}
            <h3 style={styles.stepTitle}>2. Proses Otomatis</h3>
            <p>Sistem kami akan mentranskrip dan menganalisis audio.</p>
          </div>
           {/* Visual Step 3 */}
          <div style={styles.stepItem}>
            <div style={styles.stepIcon}>📄</div> {/* Ganti dengan ikon dokumen */}
            <h3 style={styles.stepTitle}>3. Dapatkan Hasil</h3>
            <p>Lihat transkrip lengkap dan ringkasan siap pakai.</p>
          </div>
        </div>
      </section>

      {/* ===== FINAL CALL TO ACTION ===== */}
      <section style={styles.ctaSection}>
        <h2>Mulai Ubah Audio Anda Sekarang</h2>
        <p style={styles.ctaText}>
          Tingkatkan efisiensi Anda hari ini. Coba SummarizeMe secara gratis.
        </p>
        <button onClick={onLoginClick} style={{ ...styles.heroButton, marginTop: '1rem' }}>
          Daftar / Masuk dengan Google
        </button>
      </section>

    </div>
  );
}

// --- Styling (Bisa dipindah ke CSS) ---
// (Menggunakan style dari respons sebelumnya, dengan sedikit penyesuaian)
const styles = {
    landingContainer: { width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }, // Padding horizontal
    heroSection: { display: 'flex', alignItems: 'center', marginBottom: '6rem', marginTop: '2rem', gap: '2rem', textAlign: 'left', },
    heroText: { flex: 1.2, }, // Beri lebih banyak ruang untuk teks
    heroSubtitle: { fontSize: '1.2em', opacity: 0.85, marginBottom: '2.5rem', marginTop: '1rem', lineHeight: 1.7, },
    heroButton: { padding: '0.9em 2em', fontSize: '1.1em', backgroundColor: '#8c8cff', color: '#1a1a2e', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
    // ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(140, 140, 255, 0.3)' } // Efek hover (perlu CSS)
    heroSubtext: { fontSize: '0.9em', opacity: 0.7, marginTop: '1rem' },
    heroVisual: { flex: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center', },
    visualPlaceholder: { width: '100%', height: '300px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255, 255, 255, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.9em' },
    sectionTitle: { fontSize: '2.2em', color: '#c0c0ff', marginBottom: '3rem', textAlign: 'center', },
    featuresSection: { marginBottom: '6rem', textAlign: 'center', },
    featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', },
    featureItem: { backgroundColor: 'rgba(40, 40, 60, 0.6)', padding: '1.8rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' },
    featureIcon: { fontSize: '2.8em', marginBottom: '1rem', },
    featureTitle: { fontSize: '1.3em', color: '#e0e0ff', marginBottom: '0.7rem', },
    featureDescription: { fontSize: '1em', opacity: 0.8, lineHeight: 1.6 },
    howItWorksSection: { marginBottom: '6rem', textAlign: 'center', backgroundColor: 'rgba(30, 30, 50, 0.5)', padding: '3rem 1rem', borderRadius: '12px' },
    stepsGrid: { display: 'flex', justifyContent: 'space-around', gap: '2rem', },
    stepItem: { flex: 1, textAlign: 'center', },
    stepIcon: { fontSize: '2.5em', marginBottom: '1rem', display: 'inline-block' },
    stepTitle: { fontSize: '1.2em', color: '#e0e0ff', marginBottom: '0.5rem', },
    ctaSection: { textAlign: 'center', padding: '3.5rem 1rem', marginTop: '3rem', marginBottom: '3rem', },
    ctaText: { fontSize: '1.15em', opacity: 0.85, maxWidth: '600px', margin: '0 auto 2rem auto', },
};


export default LandingPage;