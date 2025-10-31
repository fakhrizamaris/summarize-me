const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleAuth } = require('google-auth-library'); 
const { google } = require('googleapis'); 

// Set opsi global
setGlobalOptions({ maxInstances: 10 });

// ID Google Sheet Anda. GANTI DENGAN ID GOOGLE SHEET ANDA!
const SHEET_ID = "1JYNHzsm_EKBEVT_UFM1doFAWqX_bl6ziNlVtgMkURxo"; 
// RANGE disesuaikan untuk 3 kolom: A (Timestamp), B (Email), C (Comment)
// Ganti "Feedback" jika nama tab spreadsheet Anda berbeda.
const RANGE = "Sheet1!A:C"; 

exports.writeFeedbackToSheet = onRequest(
    { cors: true }, // Izinkan CORS
    async (request, response) => {
    
    // Hanya izinkan metode POST
    if (request.method !== 'POST') {
        logger.warn("Request method not POST", { method: request.method });
        return response.status(405).send('Method Not Allowed');
    }

    try {
        // Menerima input: email dan comment
        const { email, comment } = request.body;

        if (!email || !comment) {
            return response.status(400).send('Missing required fields: email and comment.');
        }

        // 1. Otentikasi: Menggunakan Akun Layanan default Cloud Functions
        const auth = new GoogleAuth({ // <--- INI PERUBAHANNYA
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // 2. Data yang akan dimasukkan (sesuai urutan kolom: Timestamp, Email, Comment)
        const values = [
            [
                new Date().toISOString(), // Kolom A: Timestamp otomatis
                email,                    // Kolom B: Email dari body request
                comment,                  // Kolom C: Comment dari body request
            ],
        ];

        // 3. Konfigurasi penulisan data
        const resource = { values };
        
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: resource,
        });

        logger.info('Feedback successfully written to sheet', { updates: result.data.updates });
        response.status(200).send({ message: 'Feedback submitted successfully' });

    } catch (error) {
        logger.error('Error writing feedback to sheet:', error);
        response.status(500).send('Failed to submit feedback due to an internal error.');
    }
});