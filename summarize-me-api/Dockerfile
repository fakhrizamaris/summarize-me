    # --- Tahap 1: Build Binary ---
    FROM golang:1.24-alpine AS builder

    WORKDIR /app

    COPY go.mod go.sum ./
    RUN go mod download

    # Copy seluruh source code (sekarang terstruktur)
    COPY . .

    # Build aplikasi dari entry point baru
    RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /summarize-api ./cmd/server/main.go

    # --- Tahap 2: Final Image ---
    FROM alpine:latest

    WORKDIR /

    COPY --from=builder /summarize-api /summarize-api

    EXPOSE 8080

    # Jalankan binary
    CMD ["/summarize-api"]