package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	speech "cloud.google.com/go/speech/apiv1"
	"cloud.google.com/go/speech/apiv1/speechpb"
	"cloud.google.com/go/storage"
	"github.com/google/generative-ai-go/genai"
)

type SummarizeService struct {
	speechClient  *speech.Client
	geminiModel   *genai.GenerativeModel
	storageClient *storage.Client // <-- FIELD BARU
	bucketName    string          // <-- FIELD BARU
}

// NewSummarizeService membuat instance baru dari SummarizeService.
// <-- SIGNATURE DIPERBARUI
func NewSummarizeService(
	speechClient *speech.Client,
	geminiModel *genai.GenerativeModel,
	storageClient *storage.Client,
	bucketName string,
) *SummarizeService {
	return &SummarizeService{
		speechClient:  speechClient,
		geminiModel:   geminiModel,
		storageClient: storageClient, // <-- SET FIELD BARU
		bucketName:    bucketName,    // <-- SET FIELD BARU
	}
}

// uploadToGCS adalah fungsi helper baru untuk mengupload file ke GCS
func (s *SummarizeService) uploadToGCS(ctx context.Context, fileData []byte, fileName string) (string, error) {
	// Buat nama file unik agar tidak bentrok
	objectName := fmt.Sprintf("uploads/%d-%s", time.Now().UnixNano(), fileName)

	// Set timeout untuk konteks upload
	uploadCtx, cancel := context.WithTimeout(ctx, time.Second*60) // 60 detik timeout upload
	defer cancel()

	wc := s.storageClient.Bucket(s.bucketName).Object(objectName).NewWriter(uploadCtx)
	if _, err := wc.Write(fileData); err != nil {
		return "", fmt.Errorf("gagal menulis data ke GCS: %w", err)
	}
	if err := wc.Close(); err != nil {
		return "", fmt.Errorf("gagal menutup GCS writer: %w", err)
	}

	gcsURI := fmt.Sprintf("gs://%s/%s", s.bucketName, objectName)
	log.Printf("File berhasil diupload ke: %s", gcsURI)
	return gcsURI, nil
}

// TranscribeAndSummarize melakukan transkripsi dan peringkasan audio.
// <-- FUNGSI INI DIPERBARUI
func (s *SummarizeService) TranscribeAndSummarize(ctx context.Context, fileData []byte, fileName string) (map[string]string, error) {

	// 1. Upload file ke GCS dulu
	gcsURI, err := s.uploadToGCS(ctx, fileData, fileName)
	if err != nil {
		return nil, fmt.Errorf("gagal upload ke GCS: %w", err)
	}

	// 2. (Opsional tapi disarankan) Jadwalkan penghapusan file dari GCS setelah selesai
	defer func() {
		log.Printf("Menjadwalkan penghapusan file dari GCS: %s", gcsURI)
		objectName := strings.TrimPrefix(gcsURI, fmt.Sprintf("gs://%s/", s.bucketName))
		// Gunakan context baru (Background) untuk delete, agar tetap berjalan
		// meskipun context request aslinya (c) sudah selesai/timeout.
		deleteCtx, cancel := context.WithTimeout(context.Background(), time.Second*30)
		defer cancel()
		if err := s.storageClient.Bucket(s.bucketName).Object(objectName).Delete(deleteCtx); err != nil {
			log.Printf("Peringatan: Gagal menghapus file dari GCS: %s, error: %v", gcsURI, err)
		} else {
			log.Printf("Berhasil menghapus file dari GCS: %s", gcsURI)
		}
	}()

	// 3. Panggil fungsi transkrip asinkron yang baru
	transcript, err := s.transcribeAudioAsync(ctx, gcsURI)
	if err != nil {
		return nil, fmt.Errorf("gagal mentranskrip audio (async): %w", err)
	}

	// 4. Peringkasan (tetap sama)
	summary, err := s.summarizeText(ctx, transcript)
	if err != nil {
		return nil, fmt.Errorf("gagal membuat ringkasan: %w", err)
	}

	// 5. Kembalikan hasil
	result := map[string]string{
		"transcript": transcript,
		"summary":    summary,
	}
	return result, nil
}

// transcribeAudioAsync menggantikan transcribeAudio lama
// <-- INI FUNGSI BARU YANG UTAMA
func (s *SummarizeService) transcribeAudioAsync(ctx context.Context, gcsURI string) (string, error) {
	log.Println("Mengirim audio ke Google Speech-to-Text API (Asynchronous)...")

	// Konfigurasi request transkripsi
	config := &speechpb.RecognitionConfig{
		LanguageCode:               "id-ID", //
		EnableAutomaticPunctuation: true,    //
		// DiarizationConfig: &speechpb.SpeakerDiarizationConfig{ //
		// 	EnableSpeakerDiarization: true, //
		// 	MinSpeakerCount:          2,    //
		// 	MaxSpeakerCount:          6,    //
		// },
		// TIDAK PERLU Encoding
		// TIDAK PERLU SampleRateHertz
		// Google akan mendeteksinya secara otomatis dari file di GCS
	}

	req := &speechpb.LongRunningRecognizeRequest{
		Config: config,
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Uri{Uri: gcsURI}, // <-- Gunakan GCS URI
		},
	}

	op, err := s.speechClient.LongRunningRecognize(ctx, req)
	if err != nil {
		return "", fmt.Errorf("gagal memulai LongRunningRecognize: %w", err)
	}

	log.Println("Menunggu proses transkripsi asinkron selesai...")
	resp, err := op.Wait(ctx) // <-- Menunggu hingga proses selesai
	if err != nil {
		return "", fmt.Errorf("gagal menunggu operasi transkripsi: %w", err)
	}

	// Proses hasil (mirip seperti sebelumnya, tapi kita loop semua 'results')
	var transcriptWithSpeakers strings.Builder
	currentSpeakerTag := int32(-1)
	hasDiarizationWords := false

	for _, result := range resp.Results {
		if len(result.Alternatives) == 0 || len(result.Alternatives[0].Words) == 0 {
			continue
		}
		
		hasDiarizationWords = true
		for _, wordInfo := range result.Alternatives[0].Words {
			if wordInfo.SpeakerTag != currentSpeakerTag {
				if transcriptWithSpeakers.Len() > 0 {
					transcriptWithSpeakers.WriteString("\n\n")
				}
				currentSpeakerTag = wordInfo.SpeakerTag
				transcriptWithSpeakers.WriteString("Pembicara " + strconv.Itoa(int(currentSpeakerTag)) + ":")
			}
			if transcriptWithSpeakers.Len() > 0 && wordInfo.SpeakerTag == currentSpeakerTag {
				transcriptWithSpeakers.WriteString(" ")
			}
			transcriptWithSpeakers.WriteString(wordInfo.Word)
		}
	}


	if hasDiarizationWords && transcriptWithSpeakers.Len() > 0 {
		log.Println("Transkrip dengan pembicara berhasil dibuat (async).")
		return transcriptWithSpeakers.String(), nil
	}

	// Fallback jika diarization gagal atau tidak ada info kata
	log.Println("Diarization gagal atau tidak ada info kata, membuat transkrip biasa (async).")
	var fallbackTranscript strings.Builder
	for _, result := range resp.Results {
		if len(result.Alternatives) > 0 {
			fallbackTranscript.WriteString(result.Alternatives[0].Transcript + " ")
		}
	}
	finalTranscript := strings.TrimSpace(fallbackTranscript.String())
	if finalTranscript == "" {
		return "", fmt.Errorf("tidak ada teks yang terdeteksi di audio")
	}
	return finalTranscript, nil
}

// summarizeText (Fungsi ini tidak diubah, hanya disalin dari file Anda)
func (s *SummarizeService) summarizeText(ctx context.Context, textToSummarize string) (string, error) {
	log.Println("Mengirim transkrip ke Gemini API untuk diringkas...")

	prompt := fmt.Sprintf(`Tolong buatkan ringkasan, poin-poin penting, dan action items (jika ada) dari transkrip rapat berikut. Perhatikan label "Pembicara X:" untuk mengidentifikasi siapa yang berbicara. Jika memungkinkan, sebutkan pembicara (misalnya "[Pembicara 1]") saat merangkum poin penting atau action item. Gunakan format Markdown yang rapi dan informatif.

	TRANSKRIP:
	"%s"
	`, textToSummarize)

	resp, err := s.geminiModel.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("gagal GenerateContent Gemini: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason != genai.FinishReasonStop {
			return "", fmt.Errorf("gagal mendapatkan respons AI: %s", resp.Candidates[0].FinishReason)
		}
		return "", fmt.Errorf("gagal mendapatkan respons dari AI (kandidat/parts kosong)")
	}

	part := resp.Candidates[0].Content.Parts[0]
	if txt, ok := part.(genai.Text); ok {
		log.Println("Ringkasan berhasil dibuat oleh Gemini.")
		return string(txt), nil
	}

	return "", fmt.Errorf("respons AI bukan format teks yang diharapkan")
}