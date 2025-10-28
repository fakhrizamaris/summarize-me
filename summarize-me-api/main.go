package main

import (
	"context"
	"fmt"
	"io/ioutil" // <-- Impor baru untuk baca file
	"log"
	"net/http"
	"os"
	"strings"

	speech "cloud.google.com/go/speech/apiv1"
	"cloud.google.com/go/speech/apiv1/speechpb"
	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai" 
	"github.com/joho/godotenv"              
	"google.golang.org/api/option"
)

func init() {
	// Muat variabel dari file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("File .env tidak ditemukan, membaca dari environment system")
	}
}

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
		c.Set("userID", token.UID)
		c.Next()
	}
}

func transcribeAudio(ctx context.Context, speechClient *speech.Client, fileData []byte) (string, error) {
	log.Println("Mengirim audio ke Google Speech-to-Text API...")

	req := &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:        speechpb.RecognitionConfig_LINEAR16, // Asumsi format .wav, bisa diubah
			SampleRateHertz: 16000,                              // Sesuaikan jika perlu
			LanguageCode:    "id-ID",                            // Bahasa Indonesia
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: fileData},
		},
	}

	resp, err := speechClient.Recognize(ctx, req)
	if err != nil {
		return "", fmt.Errorf("gagal Recognize: %v", err)
	}

	var transcript strings.Builder
	for _, result := range resp.Results {
		transcript.WriteString(result.Alternatives[0].Transcript)
	}

	if transcript.String() == "" {
		return "", fmt.Errorf("tidak ada teks yang terdeteksi di audio")
	}

	log.Println("Transkrip berhasil dibuat.")
	return transcript.String(), nil
}

func summarizeText(ctx context.Context, genaiClient *genai.GenerativeModel, textToSummarize string) (string, error) {
	log.Println("Mengirim transkrip ke Gemini API untuk diringkas...")

	prompt := fmt.Sprintf(`Tolong buatkan ringkasan, poin-poin penting, dan action items (jika ada) dari transkrip rapat berikut ini. Gunakan format Markdown yang rapi.
	
	TRANSKRIP:
	"%s"
	`, textToSummarize)

	resp, err := genaiClient.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("gagal GenerateContent: %v", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gagal mendapatkan respons dari AI")
	}

	part := resp.Candidates[0].Content.Parts[0]
	if txt, ok := part.(genai.Text); ok {
		log.Println("Ringkasan berhasil dibuat.")
		return string(txt), nil
	}

	return "", fmt.Errorf("respons AI bukan teks")
}

func summarizeHandler(speechClient *speech.Client, genaiClient *genai.GenerativeModel) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil ID Pengguna (dari "Satpam")
		userID, _ := c.Get("userID")
		log.Printf("Menerima request upload dari userID: %s", userID)

		// 2. Ambil file dari request
		file, err := c.FormFile("audioFile")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan di request"})
			return
		}

		// 3. Buka dan baca file
		openedFile, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file"})
			return
		}
		defer openedFile.Close() // Tutup file setelah selesai

		fileData, err := ioutil.ReadAll(openedFile)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca file"})
			return
		}
		log.Printf("Berhasil menerima file: %s (Ukuran: %d bytes)", file.Filename, len(fileData))
		
		ctx := context.Background()

		// 4. PANGGIL AI 1: Transkrip Audio
		transcript, err := transcribeAudio(ctx, speechClient, fileData)
		if err != nil {
			log.Printf("Error Speech-to-Text: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mentranskrip audio"})
			return
		}

		// 5. PANGGIL AI 2: Ringkas Teks
		summary, err := summarizeText(ctx, genaiClient, transcript)
		if err != nil {
			log.Printf("Error Gemini: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat ringkasan"})
			return
		}

		// 6. KIRIM BALASAN ASLI ke React!
		c.JSON(http.StatusOK, gin.H{
			"summary": summary, // Ini berisi ringkasan asli dari Gemini
		})
	}
}

func main() {
	ctx := context.Background()

	credPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if credPath == "" {
		log.Fatal("GOOGLE_APPLICATION_CREDENTIALS tidak ditemukan di environment variable")
	}

	opt := option.WithCredentialsFile(credPath)

	
	speechClient, err := speech.NewClient(ctx, opt)
	if err != nil {
		log.Fatalf("Gagal membuat Speech Client: %v", err)
	}
	defer speechClient.Close()
	
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		log.Fatalf("GEMINI_API_KEY tidak ditemukan. Pastikan file .env sudah benar.")
	}
	
	genaiClient, err := genai.NewClient(ctx, option.WithAPIKey(geminiAPIKey))
	if err != nil {
		log.Fatalf("Gagal membuat GenAI Client: %v", err)
	}
	defer genaiClient.Close()

	genaiModel := genaiClient.GenerativeModel("gemini-1.5-flash")

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Error inisialisasi Firebase App: %v\n", err)
	}
	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Error inisialisasi Firebase Auth: %v\n", err)
	}

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"} 
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	config.AllowHeaders = []string{"Authorization", "Content-Type"}
	r.Use(cors.New(config))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	api := r.Group("/api")
	api.Use(authMiddleware(authClient))
	{
		api.POST("/summarize", summarizeHandler(speechClient, genaiModel))
	}

	log.Println("Server Golang (dengan AI) berjalan di http://localhost:8080")
	r.Run(":8080")
}