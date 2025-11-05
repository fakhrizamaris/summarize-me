// src/services/summarizeApi.js
import axios from 'axios';
import { auth } from '../config/firebaseConfig'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const summarizeAudio = async (selectedFile) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated");
  }

  try {
    const token = await currentUser.getIdToken();
    const formData = new FormData();
    formData.append("audioFile", selectedFile);

    const apiUrl = `${API_BASE_URL}/api/summarize`;
   

    const response = await axios.post(apiUrl, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("[API Call] Success:", response.data);
    // === PERBAIKAN: Kembalikan seluruh objek (summary & transcript) ===
    return response.data; 

  } catch (error) {
    console.error("[API Call] Error:", error.response || error.request || error.message);
    const errorMessage = error.response?.data?.error || error.message || 'Terjadi masalah koneksi atau server.';
    throw new Error(`Gagal memproses audio: ${errorMessage}`);
  }
};