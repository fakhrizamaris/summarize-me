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

// SetupRouter mengkonfigurasi dan mengembalikan Gin engine.
func SetupRouter(cfg *config.Config, authClient *auth.Client, summarizeService *services.SummarizeService) *gin.Engine {
	r := gin.Default()

	// Setup CORS
	corsConfig := cors.DefaultConfig()
	// Mengizinkan origin dari FrontendURL dan localhost (untuk development)
	corsConfig.AllowOrigins = []string{"http://localhost:5173", cfg.FrontendURL}
	corsConfig.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Authorization", "Content-Type", "Origin"} // Tambahkan Origin
	corsConfig.AllowCredentials = true // Izinkan credentials jika diperlukan
	r.Use(cors.New(corsConfig))

	// Rute publik untuk health check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Buat instance handler
	summarizeHandler := handlers.NewSummarizeHandler(summarizeService)

	// Grup rute API yang memerlukan autentikasi
	api := r.Group("/api")
	api.Use(middleware.FirebaseAuthMiddleware(authClient)) // Terapkan middleware auth
	{
		api.POST("/summarize", summarizeHandler.HandleSummarize)
		// Tambahkan rute API lain di sini jika ada
	}

	return r
}