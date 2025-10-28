import React, { useState } from 'react';
import { auth, googleProvider } from './config/firebaseConfig';
import { signInWithPopup, signOut } from 'firebase/auth';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null); 
  const [apiResponse, setApiResponse] = useState(""); 
  
  // --- TAMBAHAN: 'Memori' untuk menyimpan file yang dipilih pengguna ---
  const [selectedFile, setSelectedFile] = useState(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setApiResponse(""); 
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setApiResponse(""); 
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // --- TAMBAHAN: Fungsi untuk mencatat file yang dipilih ---
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]); // Ambil file pertama
    setApiResponse(""); // Bersihkan respons lama
  };

  // -----------------------------------------------------------------
  // --- UBAH: Ini adalah FUNGSI UTAMA kita sekarang (menggantikan handleTestApi)
  // -----------------------------------------------------------------
  const handleUpload = async () => {
    if (!user) {
      alert("Anda harus login terlebih dahulu!");
      return;
    }
    if (!selectedFile) {
      alert("Silakan pilih file audio terlebih dahulu!");
      return;
    }

    try {
      // 1. Ambil "Tiket" (ID Token)
      const token = await user.getIdToken();

      // 2. Siapkan "Paket" untuk kirim file
      // Kita HARUS pakai 'FormData' untuk mengirim file
      const formData = new FormData();
      // "audioFile" adalah "kunci" yang akan dibaca Go
      // selectedFile adalah "nilai" (filenya itu sendiri)
      formData.append("audioFile", selectedFile); 

      setApiResponse("Mengunggah dan memproses file...");

      // 3. Kirim "Paket" ke Go pakai 'axios.post'
      const response = await axios.post(
        "http://localhost:8080/api/summarize", // <-- UBAH: Alamat API baru
        formData, // <-- UBAH: Kirim 'FormData', bukan JSON
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            // 'Content-Type' akan di-set otomatis oleh axios
            // saat kita menggunakan FormData
          }
        }
      );

      // 4. Tampilkan balasan "dummy" dari Go
      setApiResponse(response.data.summary); // Kita akan buat JSON { "summary": "..." }

    } catch (error) {
      console.error("Error upload file:", error);
      setApiResponse(`Gagal: ${error.response?.data?.error || error.message}`); 
    }
  };

  // --- Tampilan (HTML) ---
  return (
    <div className='App'>
      <header className='App-header'>
        <h1>SummarizeMe 🚀</h1>

        {
          user ? (
            // --- TAMPILAN JIKA SUDAH LOGIN ---
            <div>
              <h3>Selamat Datang, {user.displayName}!</h3>
              <img 
                src={user.photoURL} 
                alt="Foto Profil" 
                style={{ borderRadius: '50%', width: '50px', height: '50px' }}
                referrerPolicy="no-referrer"
              />
              <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
              
              {/* --- UBAH: Form Upload --- */}
              <div style={{ marginTop: '30px' }}>
                <h4>Upload Rekaman Rapat (.mp3, .wav)</h4>
                
                {/* 1. Tombol Pilih File */}
                <input type="file" onChange={handleFileChange} accept="audio/*" />
                
                {/* 2. Tombol Kirim */}
                <button onClick={handleUpload} style={{ marginTop: '10px' }}>
                  Buat Ringkasan
                </button>
                
                {/* 3. Area Balasan */}
                {apiResponse && (
                  <p style={{ fontSize: '14px', background: '#333', padding: '10px', borderRadius: '5px', marginTop: '15px' }}>
                    <strong>{apiResponse}</strong>
                  </p>
                )}
              </div>
              
            </div>
          ) : (
            // --- TAMPILAN JIKA BELUM LOGIN ---
            <div>
              <h3>Silakan Login untuk Melanjutkan</h3>
              <button onClick={handleLogin}>Login dengan Google</button>
            </div>
          )
        }
      </header>
    </div>
  );
}

export default App;