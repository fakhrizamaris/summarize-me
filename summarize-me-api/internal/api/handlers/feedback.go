package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/sheets/v4"
)

// FeedbackHandler untuk dependensi (jika ada, saat ini kosong)
type FeedbackHandler struct {
	SheetID string
	Range   string
}

// NewFeedbackHandler membuat instance handler
func NewFeedbackHandler(sheetID string, sheetRange string) *FeedbackHandler {
	return &FeedbackHandler{
		SheetID: sheetID,
		Range:   sheetRange,
	}
}

// Struct untuk menampung data JSON dari frontend
type FeedbackRequest struct {
	Email   string `json:"email"`
	Comment string `json:"comment"`
}

// HandleSubmitFeedback menangani POST /api/feedback
func (h *FeedbackHandler) HandleSubmitFeedback(c *gin.Context) {
	var req FeedbackRequest

	// 1. Bind JSON body ke struct
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("WARN: Gagal bind JSON feedback: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	if req.Email == "" || req.Comment == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email dan comment tidak boleh kosong"})
		return
	}

	// 2. Dapatkan konteks dan userID (dari middleware)
	ctx := c.Request.Context()
	userID, _ := c.Get("userID")

	log.Printf("Menerima feedback dari userID: %s", userID)

	// 3. Inisialisasi Google Sheets Service
	// Ini akan otomatis menggunakan Application Default Credentials (ADC)
	// yang sudah terkonfigurasi di lingkungan Cloud Run Anda.
	sheetsService, err := sheets.NewService(ctx)
	if err != nil {
		log.Printf("ERROR: Gagal membuat Sheets service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal terhubung ke Google Sheets"})
		return
	}

	// 4. Siapkan data untuk dikirim
	row := &sheets.ValueRange{
		Values: [][]interface{}{
			{time.Now().Format(time.RFC3339), req.Email, req.Comment},
		},
	}

	// 5. Kirim data ke Google Sheet
	_, err = sheetsService.Spreadsheets.Values.Append(h.SheetID, h.Range, row).
		ValueInputOption("USER_ENTERED").
		InsertDataOption("INSERT_ROWS").
		Context(ctx).
		Do()

	if err != nil {
		log.Printf("ERROR: Gagal menulis ke Google Sheet: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan feedback"})
		return
	}

	log.Printf("Berhasil menyimpan feedback dari %s", req.Email)
	c.JSON(http.StatusOK, gin.H{"message": "Feedback submitted successfully"})
}