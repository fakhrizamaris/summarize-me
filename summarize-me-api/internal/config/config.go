package config

import (
	"log"
	"os"
)

// Config menampung semua variabel konfigurasi aplikasi.
type Config struct {
	Port           string
	FirebaseProjectID string
	GeminiAPIKey   string
	FrontendURL    string
}

// LoadConfig memuat konfigurasi dari environment variables.
func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port jika tidak diset
	}

	firebaseProjectID := os.Getenv("FIREBASE_PROJECT_ID")
	if firebaseProjectID == "" {
		log.Fatal("Environment variable FIREBASE_PROJECT_ID tidak ditemukan.")
	}

	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		log.Fatal("Environment variable GEMINI_API_KEY tidak ditemukan.")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Default ke localhost untuk development
		log.Printf("WARN: Environment variable FRONTEND_URL tidak diset, menggunakan default: %s", frontendURL)
	}

	return &Config{
		Port:           port,
		FirebaseProjectID: firebaseProjectID,
		GeminiAPIKey:   geminiAPIKey,
		FrontendURL:    frontendURL,
	}
}