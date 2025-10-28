# --- Tahap 1: Build Binary ---
# Gunakan image Go resmi sebagai basis build
FROM golang:1.24-alpine AS builder

# Set direktori kerja di dalam container
WORKDIR /app

# Copy file go.mod dan go.sum terlebih dahulu
# Ini memanfaatkan cache Docker jika dependensi tidak berubah
COPY go.mod go.sum ./
# Download dependensi
RUN go mod download

# Copy seluruh source code aplikasi
COPY . .

# Build aplikasi Go menjadi binary statis
# CGO_ENABLED=0 penting untuk build statis di Alpine
# -ldflags="-w -s" untuk mengecilkan ukuran binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /summarize-api ./main.go

# --- Tahap 2: Final Image ---
# Gunakan image Alpine yang sangat kecil sebagai basis akhir
FROM alpine:latest

# Set direktori kerja
WORKDIR /

# Copy HANYA binary yang sudah di-build dari tahap builder
COPY --from=builder /summarize-api /summarize-api

# (PENTING: Kita TIDAK copy serviceAccountKey.json atau .env ke dalam image)
# Rahasia akan dimasukkan via Environment Variables di Cloud Run

# Expose port yang digunakan oleh Gin (8080)
EXPOSE 8080

# Perintah untuk menjalankan aplikasi saat container start
CMD ["/summarize-api"]