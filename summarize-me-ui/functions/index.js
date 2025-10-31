const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {google} = require("googleapis");
const logger = require("firebase-functions/logger");

initializeApp();

// !!! PENTING: GANTI DENGAN ID GOOGLE SHEET ANDA DARI LANGKAH 2 !!!
const SPREADSHEET_ID = "1JYNHzsm_EKBEVT_UFM1doFAWqX_bl6ziNlVtgMkURxo";

// Ini adalah nama sheet di dalam file Spreadsheet Anda (defaultnya 'Sheet1')
const SHEET_NAME = "Sheet1"; 

/**
 * Fungsi ini dipicu (trigger) setiap kali dokumen BARU dibuat di
 * koleksi /project_feedback/{docId}
 */
exports.writeFeedbackToSheet = onDocumentCreated("project_feedback/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("Tidak ada data, keluar.");
    return;
  }

  const data = snapshot.data();
  logger.log(`Feedback baru diterima dari ${data.userEmail}: ${data.comment}`);

  try {
    // 1. Autentikasi ke Google Sheets
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({version: "v4", auth});

    // 2. Format data untuk baris baru
    // Pastikan urutannya SAMA dengan header di Sheet Anda
    const newRow = [
      // Konversi Timestamp Firestore ke format yang bisa dibaca
      data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      data.userEmail || "Anonymous",
      data.comment || "",
      data.page || "N/A",
    ];

    // 3. Tambahkan baris baru ke Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`, // Menambahkan ke kolom A sampai D
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    logger.log("Feedback berhasil ditulis ke Google Sheet.");

  } catch (err) {
    // Catat errornya agar bisa Anda lihat di Firebase Console
    logger.error("Error menulis ke Google Sheet:", err);
  }
});
