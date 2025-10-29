package handlers

import (
	// "fmt"
	"io/ioutil"
	"log"
	"net/http"
	"summarize-me-api/internal/services" // Import service

	"github.com/gin-gonic/gin"
)

// SummarizeHandler menampung dependensi untuk handler ringkasan.
type SummarizeHandler struct {
	service *services.SummarizeService
}

// NewSummarizeHandler membuat instance baru dari SummarizeHandler.
func NewSummarizeHandler(s *services.SummarizeService) *SummarizeHandler {
	return &SummarizeHandler{service: s}
}

// HandleSummarize menangani request POST /api/summarize.
func (h *SummarizeHandler) HandleSummarize(c *gin.Context) {
	// 1. Ambil userID dari middleware
	userID, exists := c.Get("userID")
	if !exists {
		log.Println("ERROR: userID tidak ditemukan di context") // Lebih jelas
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Autentikasi gagal (internal server error)"})
		return
	}
	log.Printf("Menerima request /api/summarize dari userID: %s", userID)

	// 2. Ambil file dari form multipart
	file, err := c.FormFile("audioFile")
	if err != nil {
		log.Printf("WARN: Gagal mengambil file dari form: %v", err) // Log sebagai warning
		c.JSON(http.StatusBadRequest, gin.H{"error": "File 'audioFile' tidak ditemukan atau request tidak valid"})
		return
	}

	// 3. Buka dan baca file
	openedFile, err := file.Open()
	if err != nil {
		log.Printf("ERROR: Gagal membuka file upload: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file upload (tidak bisa dibuka)"})
		return
	}
	defer openedFile.Close()

	fileData, err := ioutil.ReadAll(openedFile)
	if err != nil {
		log.Printf("ERROR: Gagal membaca file upload: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file upload (tidak bisa dibaca)"})
		return
	}
	log.Printf("Berhasil menerima file: %s (Ukuran: %d bytes) dari userID: %s", file.Filename, len(fileData), userID)

	// 4. Panggil service untuk transkripsi dan ringkasan
	summary, err := h.service.TranscribeAndSummarize(c.Request.Context(), fileData) // Gunakan context request
	if err != nil {
		log.Printf("ERROR: Gagal TranscribeAndSummarize untuk userID %s: %v", userID, err)
		// Kirim error yang lebih umum ke user, detail di log server
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan saat memproses audio Anda."})
		return
	}

	// 5. Kirim hasil
	log.Printf("Berhasil membuat ringkasan untuk userID: %s", userID)
	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
	})
}