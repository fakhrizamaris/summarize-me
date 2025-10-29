package platform

import (
	"context"
	"fmt"
	"log"

	speech "cloud.google.com/go/speech/apiv1"
)

// InitSpeechClient menginisialisasi Google Cloud Speech-to-Text client.
func InitSpeechClient(ctx context.Context) (*speech.Client, error) {
	client, err := speech.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat Speech Client: %w", err)
	}
	log.Println("Google Cloud Speech-to-Text client berhasil diinisialisasi.")
	return client, nil
}