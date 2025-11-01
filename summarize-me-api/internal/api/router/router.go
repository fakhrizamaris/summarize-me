package router

import (
	"net/http"
	"summarize-me-api/internal/api/handlers"
	"summarize-me-api/internal/api/middleware"
	"summarize-me-api/internal/config"
	"summarize-me-api/internal/services"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Ambil ID Sheet dari environment variable
const SHEET_ID = "1JYNHzsm_EKBEVT_UFM1doFAWqX_bl6ziNlVtgMkURxo"
const RANGE = "Sheet1!A:C"

// SetupRouter mengkonfigurasi dan mengembalikan Gin engine.
func SetupRouter(cfg *config.Config, authClient *auth.Client, summarizeService *services.SummarizeService) *gin.Engine {
	r := gin.Default()

	// ... (Setup CORS Anda tetap sama) ...
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", cfg.FrontendURL, "https://summarizemeai.vercel.app"}
	corsConfig.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Authorization", "Content-Type", "Origin"} 
	corsConfig.AllowCredentials = true 
	r.Use(cors.New(corsConfig))


	// Rute publik untuk health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Buat instance handler
	summarizeHandler := handlers.NewSummarizeHandler(summarizeService)
	// --- TAMBAHKAN INI ---
	feedbackHandler := handlers.NewFeedbackHandler(SHEET_ID, RANGE)


	// Grup rute API yang memerlukan autentikasi
	api := r.Group("/api")
	api.Use(middleware.FirebaseAuthMiddleware(authClient)) // Terapkan middleware auth
	{
		api.POST("/summarize", summarizeHandler.HandleSummarize)
		// --- TAMBAHKAN RUTE INI ---
		api.POST("/feedback", feedbackHandler.HandleSubmitFeedback) 
	}

	return r
}