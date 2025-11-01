package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"summarize-me-api/internal/api/router"
	"summarize-me-api/internal/config"
	"summarize-me-api/internal/platform"
	"summarize-me-api/internal/services"

	"cloud.google.com/go/storage" // <-- TAMBAHKAN IMPORT INI
	"github.com/joho/godotenv"
)

// !!! PENTING: Ganti nilai ini dengan nama GCS Bucket Anda !!!
const GCS_BUCKET_NAME = "summarizeme_bucket"

func main() {
	// Muat variabel dari .env HANYA jika file ada (untuk development lokal)
	// Di Cloud Run, file .env tidak akan ada, jadi ini akan di-skip.
	err := godotenv.Load()
	if err != nil && !os.IsNotExist(err) { // Hanya log error jika BUKAN karena file tidak ada
		log.Printf("Peringatan: Tidak dapat memuat file .env: %v", err)
	} else if err == nil {
		log.Println("File .env ditemukan dan dimuat untuk development lokal.")
	}

	// Load Konfigurasi
	cfg := config.LoadConfig()

	ctx := context.Background()

	// --- Inisialisasi Klien Eksternal ---
	authClient, err := platform.InitFirebaseAuth(ctx, cfg.FirebaseProjectID)
	if err != nil {
		log.Fatalf("Gagal inisialisasi Firebase Auth: %v", err)
	}
	
	speechClient, err := platform.InitSpeechClient(ctx)
    if err != nil {
        log.Fatalf("Gagal inisialisasi Speech Client: %v", err)
    }
    defer speechClient.Close()

    geminiClient, err := platform.InitGeminiClient(ctx, cfg.GeminiAPIKey)
    if err != nil {
        log.Fatalf("Gagal inisialisasi Gemini Client: %v", err)
    }
    defer geminiClient.Close()

    geminiModel := geminiClient.GenerativeModel("gemini-1.5-flash") // Anda bisa ganti modelnya jika perlu

	// --- Inisialisasi Storage Client (BARU) ---
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		log.Fatalf("Gagal inisialisasi Storage Client: %v", err)
	}
	// ----------------------------------------

	// --- Inisialisasi Service (DIPERBARUI) ---
	summarizeService := services.NewSummarizeService(
		speechClient,
		geminiModel,
		storageClient,
		GCS_BUCKET_NAME,
	)

	// --- Setup Router ---
	r := router.SetupRouter(cfg, authClient, summarizeService)

	// --- Jalankan Server ---
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}