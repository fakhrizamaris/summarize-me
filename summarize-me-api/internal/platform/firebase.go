package platform

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
)

// InitFirebaseAuth menginisialisasi Firebase Auth client.
func InitFirebaseAuth(ctx context.Context, projectID string) (*auth.Client, error) {
	conf := &firebase.Config{ProjectID: projectID}
	app, err := firebase.NewApp(ctx, conf)
	if err != nil {
		return nil, fmt.Errorf("error inisialisasi Firebase App (pastikan Project ID benar '%s' dan ADC terkonfigurasi): %w", projectID, err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("error inisialisasi Firebase Auth: %w", err)
	}
	log.Println("Firebase Auth client berhasil diinisialisasi.")
	return authClient, nil
}