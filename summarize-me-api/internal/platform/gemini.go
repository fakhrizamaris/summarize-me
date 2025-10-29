package platform

import (
	"context"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// InitGeminiClient menginisialisasi Google Gemini client.
func InitGeminiClient(ctx context.Context, apiKey string) (*genai.Client, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("gagal membuat GenAI (Gemini) Client: %w", err)
	}
	log.Println("Google Gemini client berhasil diinisialisasi.")
	return client, nil
}