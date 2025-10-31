const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const {google} = require("googleapis");

// Inisialisasi Firebase Admin
admin.initializeApp();

// Konfigurasi
const SPREADSHEET_ID = "1JYNHzsm_EKBEVT_UFM1doFAWqX_bl6ziNlVtgMkURxo";
const SHEET_NAME = "Sheet1";

/**
 * Fungsi yang dipicu saat dokumen baru di project_feedback
 */
exports.writeFeedbackToSheet = functions.firestore.onDocumentCreated(
  "project_feedback/{docId}",
  async (event) => {
    const snapshot = event.data;
    
    if (!snapshot) {
      console.log("No data");
      return;
    }

    const data = snapshot.data();
    console.log("New feedback:", data);

    try {
      // Auth ke Google Sheets
      const auth = await google.auth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      
      const sheets = google.sheets({version: "v4", auth});

      // Format timestamp
      let timestamp = new Date().toISOString();
      if (data.createdAt) {
        try {
          timestamp = data.createdAt.toDate().toISOString();
        } catch (e) {
          console.log("Cannot convert timestamp, using current time");
        }
      }

      // Data untuk sheet
      const newRow = [
        timestamp,
        data.userEmail || "Anonymous",
        data.comment || "",
        data.page || "N/A",
      ];

      // Append ke sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:D`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [newRow],
        },
      });

      console.log("Success writing to sheet");
      return;

    } catch (error) {
      console.error("Error:", error);
      return;
    }
  }
);