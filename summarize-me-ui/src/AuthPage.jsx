// src/AuthPage.jsx
import React, { useState, useEffect } from 'react'; // Tambah useEffect
import { auth, googleProvider } from './config/firebaseConfig'; //
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth'; //
import { useNavigate, Link } from 'react-router-dom'; // Import Link

// Terima prop 'mode' ("login" atau "register")
function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  // Tentukan mode awal berdasarkan prop 'mode'
  const [isLoginView, setIsLoginView] = useState(mode === 'login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Loading khusus Google

  // Efek untuk mengubah mode jika prop 'mode' berubah (misal user navigasi)
  useEffect(() => {
    setIsLoginView(mode === 'login');
    setError(''); // Reset error saat mode berubah
    setEmail(''); setPassword(''); setConfirmPassword(''); // Reset input
  }, [mode]); // Jalankan efek ini jika 'mode' berubah

  const handleEmailPasswordSubmit = async (event) => {
    event.preventDefault(); // Mencegah form refresh halaman
    setError(''); // Bersihkan error lama
    setIsLoading(true);

    try {
      if (isLoginView) {
        // --- Proses Login ---
        // Atur persistence SEBELUM login
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        // Lanjutkan login
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/'); // Redirect ke home setelah sukses
      } else {
        // --- Proses Register ---
        // Validasi konfirmasi password
        if (password !== confirmPassword) {
          setError("Konfirmasi password tidak cocok.");
          setIsLoading(false);
          return; // Hentikan jika tidak cocok
        }
        // Jika cocok, lanjutkan register
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase otomatis login setelah register
        navigate('/'); // Redirect ke home setelah sukses
        // Opsional: Simpan data user tambahan ke Firestore di sini jika perlu
        // Contoh: const user = auth.currentUser; if (user) { /* simpan ke Firestore */ }
      }
    } catch (err) {
      console.error("Firebase Auth Error:", err.code, err.message);
      // Terjemahkan kode error Firebase ke pesan yang lebih ramah
      let friendlyMessage = "Terjadi kesalahan. Silakan coba lagi.";
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Format email tidak valid.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = "Email atau password salah.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Email ini sudah terdaftar. Silakan login.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Password terlalu lemah (minimal 6 karakter).";
      }
      setError(friendlyMessage);
    } finally {
        setIsLoading(false);
    }
  };

  // --- Fungsi Login dengan Google ---
  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true); // Gunakan state loading terpisah
    try {
      // Untuk Google, persistence biasanya diatur secara default (local)
      await signInWithPopup(auth, googleProvider); //
      navigate('/');
    } catch (err) {
      console.error("Google Login Error:", err);
       // Hanya tampilkan error jika bukan pembatalan oleh user
      if (err.code !== 'auth/popup-closed-by-user') {
        setError("Gagal login dengan Google. Silakan coba lagi.");
      }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || isGoogleLoading; // Tombol disable jika salah satu loading

  return (
    <div style={styles.authContainer}>
      {/* Judul dinamis */}
      <h2>{isLoginView ? 'Login ke SummarizeMe' : 'Buat Akun Baru'}</h2>

      {/* --- Form Email/Password --- */}
      <form onSubmit={handleEmailPasswordSubmit} style={styles.form}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Alamat Email"
          required
          style={styles.input}
          disabled={isSubmitDisabled} // Nonaktifkan saat loading
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" // Hapus hint min. 6 karakter agar lebih bersih
          required
          style={styles.input}
          disabled={isSubmitDisabled} // Nonaktifkan saat loading
        />

        {/* --- Input Konfirmasi Password (Hanya Muncul Saat Register) --- */}
        {!isLoginView && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Konfirmasi Password"
            required
            style={styles.input}
            disabled={isSubmitDisabled} // Nonaktifkan saat loading
          />
        )}

        {/* --- Opsi (Ingat Saya / Lupa Password) - Hanya Muncul Saat Login --- */}
        {isLoginView && (
            <div style={styles.optionsContainer}>
                <div style={styles.rememberMeContainer}>
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={styles.checkbox}
                        disabled={isSubmitDisabled}
                    />
                    <label htmlFor="rememberMe" style={styles.checkboxLabel}>
                        Ingat Saya
                    </label>
                </div>
                 {/* Tambahkan link Lupa Password (implementasi nanti jika perlu) */}
                {/* <a href="#" style={styles.forgotPassword}>Lupa Password?</a> */}
            </div>
        )}

        {error && <p style={styles.errorMessage}>{error}</p>}

        <button type="submit" style={{...styles.submitButton, opacity: isLoading ? 0.7 : 1}} disabled={isSubmitDisabled}>
          {isLoading ? 'Memproses...' : (isLoginView ? 'Login' : 'Daftar Akun')}
        </button>
      </form>

      {/* --- Link Navigasi antara Login/Register --- */}
      <p style={styles.switchText}>
        {isLoginView ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <Link to={isLoginView ? '/register' : '/login'} style={styles.switchLink}>
          {isLoginView ? 'Daftar di sini' : 'Login di sini'}
        </Link>
      </p>
      {/* ----------------------------------------------- */}


      {/* --- Pemisah "atau" --- */}
      <div style={styles.divider}>
        <span style={styles.dividerLine}></span> {/* Garis kiri */}
        <span style={styles.dividerText}>atau</span>
        <span style={styles.dividerLine}></span> {/* Garis kanan */}
      </div>

      {/* --- Tombol Login Google --- */}
      <button onClick={handleGoogleLogin} style={{...styles.googleButton, opacity: isSubmitDisabled ? 0.7 : 1}} disabled={isSubmitDisabled}>
        {isGoogleLoading ? (
            <span style={styles.buttonSpinner}></span> // Spinner kecil
        ) : (
            <svg style={styles.googleIcon} viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.8v3.8h5.5c-.3 1.3-1.6 3.2-5.5 3.2-3.3 0-6-2.7-6-6s2.7-6 6-6c1.8 0 3 .8 3.8 1.5l2.9-2.9C18.1 1.6 15.3 0 11.55 0 5.15 0 0 5.15 0 11.55S5.15 23.1 11.55 23.1c6.1 0 10.9-4.2 10.9-11.1 0-.6-.1-1-.2-1.2z"></path></svg>
        )}
        Lanjutkan dengan Google
      </button>

    </div>
  );
}

// Styling diperbarui untuk form dan opsi
const styles = {
    authContainer: {
        maxWidth: '400px',
        margin: '10vh auto',
        padding: '2.5rem 3rem', // Padding lebih lebar
        backgroundColor: 'rgba(30, 30, 50, 0.9)', // Lebih solid
        borderRadius: '16px', // Lebih bulat
        border: '1px solid rgba(255, 255, 255, 0.15)',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)', // Shadow lebih dramatis
        backdropFilter: 'blur(10px)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem', // Jarak antar input sedikit lebih besar
        marginBottom: '1rem',
    },
    input: {
        padding: '14px 18px', // Input lebih tinggi
        borderRadius: '10px', // Sudut lebih bulat
        border: '1px solid #4a4a6a', // Border lebih kontras
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#eee',
        fontSize: '1em',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    errorMessage: {
        color: '#ff9a9a', // Warna error lebih lembut
        fontSize: '0.9em',
        marginTop: '-0.8rem', // Lebih dekat
        marginBottom: '0.5rem',
        textAlign: 'left',
    },
    optionsContainer: { // Container untuk Ingat Saya & Lupa Password
        display: 'flex',
        justifyContent: 'space-between', // Pisahkan ke ujung
        alignItems: 'center',
        marginTop: '-0.5rem',
        marginBottom: '1rem',
    },
    rememberMeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    checkbox: {
        margin: 0,
        width: '15px', // Sedikit lebih kecil
        height: '15px',
        cursor: 'pointer',
    },
    checkboxLabel: {
        fontSize: '0.9em',
        color: '#bbb', // Lebih terang sedikit
        cursor: 'pointer',
        userSelect: 'none',
    },
    forgotPassword: { // Styling link Lupa Password (jika ditambahkan)
        fontSize: '0.9em',
        color: '#aaa',
        textDecoration: 'none',
    },
    submitButton: {
        padding: '14px', // Lebih tinggi
        fontSize: '1.05em',
        backgroundColor: '#7a7aff',
        color: '#fff',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '10px', // Lebih bulat
        cursor: 'pointer',
        marginTop: '0.5rem',
        transition: 'background-color 0.2s, opacity 0.2s',
    },
    switchText: {
        marginTop: '1.5rem', // Beri jarak setelah form
        fontSize: '0.9em',
        color: '#ccc',
    },
    switchLink: {
        color: '#b0b0ff', // Warna link
        fontWeight: '500',
        textDecoration: 'underline',
        cursor: 'pointer',
    },
    divider: {
        margin: '2rem 0', // Jarak lebih besar
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        color: '#777', // Warna lebih gelap
    },
    dividerLine: {
        flex: 1,
        borderBottom: '1px solid #444', // Garis lebih gelap
    },
    dividerText: {
        padding: '0 1em',
        fontSize: '0.85em',
        fontWeight: '500', // Sedikit bold
        textTransform: 'uppercase', // Huruf besar
    },
    googleButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px', // Jarak ikon & teks
        width: '100%',
        padding: '12px',
        fontSize: '1em',
        backgroundColor: '#fff',
        color: '#333',
        border: '1px solid #ccc', // Border lebih jelas
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'background-color 0.2s, opacity 0.2s',
        fontWeight: '500', // Sedikit bold
    },
    googleIcon: {
        width: '20px', // Ikon lebih besar
        height: '20px',
    },
    buttonSpinner: { // Spinner kecil untuk tombol Google
        width: '18px',
        height: '18px',
        border: '2px solid rgba(0, 0, 0, 0.2)',
        borderTopColor: '#555',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite', // Pastikan animasi 'spin' ada di index.css
    }
};

export default AuthPage;