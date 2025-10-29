package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

// FirebaseAuthMiddleware membuat middleware Gin untuk verifikasi token Firebase.
func FirebaseAuthMiddleware(client *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header dibutuhkan"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader { // Jika tidak ada prefix "Bearer "
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format Authorization header salah (harus 'Bearer <token>')"})
			c.Abort()
			return
		}

		token, err := client.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			log.Printf("Error verifikasi token: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau expired"})
			c.Abort()
			return
		}

		// Simpan userID di context Gin
		c.Set("userID", token.UID)
		c.Next()
	}
}