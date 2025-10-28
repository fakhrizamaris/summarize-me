package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os" // Dibutuhkan untuk Environment Variables (GEMINI_API_KEY, PORT)
	"strconv"
	"strings"

	speech "cloud.google.com/go/speech/apiv1" // Google Cloud Speech-to-Text client
	"cloud.google.com/go/speech/apiv1/speechpb" // Protobuf definitions for Speech API
	"firebase.google.com/go/v4"               // Firebase Admin SDK
	"firebase.google.com/go/v4/auth"        // Firebase Authentication client
	"github.com/gin-contrib/cors"           // CORS middleware for Gin
	"github.com/gin-gonic/gin"              // Gin web framework
	"github.com/google/generative-ai-go/genai" // Google Gemini client
	// "github.com/joho/godotenv" // Dihapus karena env vars diset oleh Cloud Run/Secret Manager
	"google.golang.org/api/option" // Untuk opsi klien Google API (digunakan oleh Gemini)
)

// Fungsi init() dihapus karena tidak lagi menggunakan godotenv

// --- Fungsi Middleware Autentikasi ---
// Memverifikasi token Firebase JWT yang dikirim di header Authorization
func authMiddleware(client *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Request butuh token (Authorization header)"})
			c.Abort()
			return
		}
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := client.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			log.Printf("Error verifikasi token: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}
		// Menyimpan userID di context Gin agar bisa diakses handler
		c.Set("userID", token.UID)
		c.Next()
	}
}

// --- Fungsi Transkripsi Audio dengan Speaker Diarization ---
// Mengirim data audio ke Google Cloud Speech-to-Text dan mendapatkan transkrip
func transcribeAudio(ctx context.Context, speechClient *speech.Client, fileData []byte) (string, error) {
	log.Println("Mengirim audio ke Google Speech-to-Text API (dengan Diarization)...")

	// Konfigurasi request transkripsi
	req := &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:        speechpb.RecognitionConfig_MP3, // Asumsikan MP3, sesuaikan jika perlu
			SampleRateHertz: 16000,                         // Sesuaikan jika format bukan MP3/kualitas diketahui
			LanguageCode:    "id-ID",                       // Bahasa Indonesia
			EnableAutomaticPunctuation: true,                // Aktifkan tanda baca otomatis

			// Konfigurasi Speaker Diarization menggunakan struct
			DiarizationConfig: &speechpb.SpeakerDiarizationConfig{
				EnableSpeakerDiarization: true, // Aktifkan fitur ini
				MinSpeakerCount:          2,    // Jumlah minimal pembicara yang diharapkan
				MaxSpeakerCount:          6,    // Jumlah maksimal pembicara (sesuaikan batas atasnya jika perlu)
			},
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: fileData},
		},
	}

	// Kirim request ke API
	resp, err := speechClient.Recognize(ctx, req)
	if err != nil {
		// Error saat memanggil API Speech
		return "", fmt.Errorf("gagal Recognize API: %v", err)
	}

	// --- Memproses hasil transkripsi ---
	// Cek apakah response mengandung detail kata (diperlukan untuk SpeakerTag)
	if len(resp.Results) > 0 && len(resp.Results[len(resp.Results)-1].Alternatives[0].Words) > 0 {
		var transcriptWithSpeakers strings.Builder
		currentSpeakerTag := int32(-1) // Tag awal, pastikan label pertama tercetak

		// Iterasi melalui kata-kata di hasil terakhir (biasanya yang paling lengkap)
		result := resp.Results[len(resp.Results)-1]
		for _, wordInfo := range result.Alternatives[0].Words {
			// Jika tag pembicara berubah
			if wordInfo.SpeakerTag != currentSpeakerTag {
				if transcriptWithSpeakers.Len() > 0 {
					transcriptWithSpeakers.WriteString("\n\n") // Tambah baris baru antar pembicara
				}
				currentSpeakerTag = wordInfo.SpeakerTag
				// Tambahkan label pembicara
				transcriptWithSpeakers.WriteString("Pembicara " + strconv.Itoa(int(currentSpeakerTag)) + ":")
			}
			// Tambahkan spasi sebelum kata (kecuali setelah label pembicara)
			if transcriptWithSpeakers.Len() > 0 && wordInfo.SpeakerTag == currentSpeakerTag {
				transcriptWithSpeakers.WriteString(" ")
			}
			transcriptWithSpeakers.WriteString(wordInfo.Word) // Tambahkan kata
		}

		// Jika berhasil membangun transkrip dengan pembicara
		if transcriptWithSpeakers.Len() > 0 {
				log.Println("Transkrip dengan pembicara berhasil dibuat.")
				return transcriptWithSpeakers.String(), nil
		}
	}

	// Fallback jika diarization gagal atau API tidak mengembalikan detail kata
	log.Println("Diarization gagal atau tidak ada info kata, membuat transkrip biasa.")
	var fallbackTranscript strings.Builder
	for _, result := range resp.Results {
		if len(result.Alternatives) > 0 {
			fallbackTranscript.WriteString(result.Alternatives[0].Transcript + " ") // Tambahkan spasi antar segmen
		}
	}

	// Bersihkan spasi ekstra di akhir
	finalTranscript := strings.TrimSpace(fallbackTranscript.String())

	if finalTranscript == "" {
		return "", fmt.Errorf("tidak ada teks yang terdeteksi di audio")
	}
	return finalTranscript, nil
}

// --- Fungsi Peringkasan Teks ---
// Mengirim transkrip ke Google Gemini API untuk diringkas
func summarizeText(ctx context.Context, genaiClient *genai.GenerativeModel, textToSummarize string) (string, error) {
	log.Println("Mengirim transkrip ke Gemini API untuk diringkas (dengan info pembicara)...")

	// Prompt yang meminta Gemini memperhatikan label pembicara
	prompt := fmt.Sprintf(`Tolong buatkan ringkasan, poin-poin penting, dan action items (jika ada) dari transkrip rapat berikut. Perhatikan label "Pembicara X:" untuk mengidentifikasi siapa yang berbicara. Jika memungkinkan, sebutkan pembicara (misalnya "[Pembicara 1]") saat merangkum poin penting atau action item. Gunakan format Markdown yang rapi dan informatif.

	TRANSKRIP:
	"%s"
	`, textToSummarize)

	// Kirim prompt ke Gemini
	resp, err := genaiClient.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("gagal GenerateContent Gemini: %v", err)
	}

	// Ekstrak teks dari respons Gemini
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		// Cek juga jika ada error karena safety settings atau lainnya
		if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason != genai.FinishReasonStop {
			return "", fmt.Errorf("gagal mendapatkan respons AI: %s", resp.Candidates[0].FinishReason)
		}
		return "", fmt.Errorf("gagal mendapatkan respons dari AI (kandidat kosong atau parts kosong)")
	}

	// Pastikan bagian pertama adalah teks
	part := resp.Candidates[0].Content.Parts[0]
	if txt, ok := part.(genai.Text); ok {
		log.Println("Ringkasan berhasil dibuat oleh Gemini.")
		return string(txt), nil
	}

	return "", fmt.Errorf("respons AI bukan format teks yang diharapkan")
}


// --- Handler untuk Endpoint /api/summarize ---
// Menerima upload file, memanggil transkripsi dan peringkasan, lalu mengirim hasil
func summarizeHandler(speechClient *speech.Client, genaiClient *genai.GenerativeModel) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil userID dari middleware
		userID, exists := c.Get("userID")
		if !exists {
			log.Println("Error: userID tidak ditemukan di context setelah middleware")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Autentikasi gagal (internal)"})
			return
		}
		log.Printf("Menerima request upload dari userID: %s", userID)

		// 2. Ambil file dari form multipart
		file, err := c.FormFile("audioFile")
		if err != nil {
			log.Printf("Error mengambil file dari form: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "File 'audioFile' tidak ditemukan di request"})
			return
		}

		// 3. Buka file yang diupload
		openedFile, err := file.Open()
		if err != nil {
			log.Printf("Error membuka file upload: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file upload (open)"})
			return
		}
		defer openedFile.Close() // Pastikan file ditutup

		// 4. Baca seluruh konten file ke memory
		fileData, err := ioutil.ReadAll(openedFile)
		if err != nil {
			log.Printf("Error membaca file upload: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file upload (read)"})
			return
		}
		log.Printf("Berhasil menerima file: %s (Ukuran: %d bytes)", file.Filename, len(fileData))

		// Buat context baru untuk pemanggilan API
		ctx := context.Background()

		// 5. Panggil fungsi transkripsi
		transcript, err := transcribeAudio(ctx, speechClient, fileData)
		if err != nil {
			log.Printf("Error dari transcribeAudio: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal mentranskrip audio: %v", err)})
			return
		}

		// 6. Panggil fungsi peringkasan
		summary, err := summarizeText(ctx, genaiClient, transcript)
		if err != nil {
			log.Printf("Error dari summarizeText: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal membuat ringkasan: %v", err)})
			return
		}

		// 7. Kirim hasil ringkasan ke client
		c.JSON(http.StatusOK, gin.H{
			"summary": summary,
		})
	}
}

// --- Fungsi Utama ---
// Inisialisasi klien API, setup router Gin, dan jalankan server
func main() {
	ctx := context.Background()

	// --- Setup Klien Google Cloud APIs (Speech-to-Text & Firebase Admin) ---
	// Menggunakan Application Default Credentials (ADC) yang disediakan Cloud Run
	// Pastikan service account Cloud Run memiliki role:
	// - Cloud Speech Service Agent (untuk Speech-to-Text)
	// - Firebase Admin SDK Administrator Service Agent atau role custom dengan izin yang cukup (untuk verifikasi token)

	// Inisialisasi Klien Speech-to-Text tanpa file kredensial
	speechClient, err := speech.NewClient(ctx)
	if err != nil {
		log.Fatalf("Gagal membuat Speech Client: %v", err)
	}
	defer speechClient.Close() // Tutup koneksi saat aplikasi berhenti

	// Inisialisasi Firebase Admin tanpa file kredensial, HANYA dengan Project ID
	// GANTI "YOUR_FIREBASE_PROJECT_ID" dengan Project ID Anda
	projectID := "summarizeme-project" // <--- GANTI INI
	if projectID == "YOUR_FIREBASE_PROJECT_ID" {
		log.Fatalf("Harap ganti YOUR_FIREBASE_PROJECT_ID di main.go dengan Project ID Firebase/Google Cloud Anda.")
	}
	conf := &firebase.Config{ ProjectID: projectID }
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		log.Fatalf("Error inisialisasi Firebase App (pastikan Project ID benar dan ADC terkonfigurasi): %v\n", err)
	}
	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Error inisialisasi Firebase Auth: %v\n", err)
	}
	// ----------------------------------------------------------------------


	// --- Setup Klien Gemini API ---
	// Ambil kunci API dari environment variable (akan diset di Cloud Run via Secret Manager atau Env Var)
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		log.Fatalf("Environment variable GEMINI_API_KEY tidak ditemukan.")
	}

	genaiClient, err := genai.NewClient(ctx, option.WithAPIKey(geminiAPIKey))
	if err != nil {
		log.Fatalf("Gagal membuat GenAI (Gemini) Client: %v", err)
	}
	defer genaiClient.Close() // Tutup koneksi Gemini

	// Pilih model Gemini yang akan digunakan
	genaiModel := genaiClient.GenerativeModel("gemini-2.5-flash") // Model stabil

	// --- Setup Server Gin ---
	r := gin.Default()

	// Setup CORS (Cross-Origin Resource Sharing)
	// Izinkan request dari frontend (lokal dan Vercel nanti)
	corsConfig := cors.DefaultConfig()
	// Ganti dengan URL Vercel Anda setelah deploy, atau gunakan "*" untuk pengembangan (kurang aman)
	vercelUrl := os.Getenv("FRONTEND_URL") // Idealnya baca dari env var
	if vercelUrl == "" {
		vercelUrl = "http://localhost:5173" // Default ke localhost jika env var tidak ada
		log.Printf("FRONTEND_URL tidak diset, hanya mengizinkan CORS dari %s", vercelUrl)
	} else {
        log.Printf("Mengizinkan CORS dari %s dan http://localhost:5173", vercelUrl)
    }
	corsConfig.AllowOrigins = []string{"http://localhost:5173", vercelUrl} // Izinkan lokal dan deployed frontend
	corsConfig.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Authorization", "Content-Type"}
	r.Use(cors.New(corsConfig))

	// Rute publik untuk health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Grup rute API yang memerlukan autentikasi
	api := r.Group("/api")
	api.Use(authMiddleware(authClient)) // Terapkan middleware auth ke semua rute /api
	{
		// Definisikan endpoint POST untuk proses ringkasan
		api.POST("/summarize", summarizeHandler(speechClient, genaiModel))
	}

	// Ambil PORT dari environment variable (disediakan oleh Cloud Run)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Gunakan port 8080 jika tidak ada env var PORT (untuk lokal)
	}
	log.Printf("Server Golang (siap Cloud Run) akan berjalan di port %s", port)

	    // Jalankan server
    log.Printf("Listening on port %s...", port)
    r.Run(":" + port)
}