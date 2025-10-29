// src/services/summarizeApi.js
import axios from 'axios';
import { auth } from '../config/firebaseConfig'; // Pastikan path benar

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const summarizeAudio = async (selectedFile) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // Sebaiknya throw error spesifik atau return null/object error
    // agar bisa ditangani di komponen (misal redirect ke login)
    throw new Error("User not authenticated");
  }

  try {
    const token = await currentUser.getIdToken();
    const formData = new FormData();
    formData.append("audioFile", selectedFile);

    const apiUrl = `${API_BASE_URL}/api/summarize`;
    console.log(`[API Call] POST ${apiUrl}`); // Logging

    const response = await axios.post(apiUrl, formData, {
      headers: { Authorization: `Bearer ${token}` },
      // Pertimbangkan menambahkan timeout
      // timeout: 60000, // contoh 60 detik
    });

    console.log("[API Call] Success:", response.data);
    return response.data.summary; // Kembalikan hanya data summary

  } catch (error) {
    console.error("[API Call] Error:", error.response || error.request || error.message);

    // Rethrow error agar bisa ditangkap oleh komponen pemanggil
    // Bisa juga memproses error di sini dan mengembalikan pesan yang lebih baik
    const errorMessage = error.response?.data?.error || error.message || 'Terjadi masalah koneksi atau server.';
    throw new Error(`Gagal memproses audio: ${errorMessage}`);
  }
};

// Bisa tambahkan fungsi API lain di sini jika perlu