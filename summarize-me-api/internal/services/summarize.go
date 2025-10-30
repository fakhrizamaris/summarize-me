package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	speech "cloud.google.com/go/speech/apiv1"
	"cloud.google.com/go/speech/apiv1/speechpb"
	"github.com/google/generative-ai-go/genai"
)

// SummarizeService menampung dependensi untuk layanan ringkasan.
type SummarizeService struct {
	speechClient *speech.Client
	geminiModel  *genai.GenerativeModel
}

// NewSummarizeService membuat instance baru dari SummarizeService.
func NewSummarizeService(speechClient *speech.Client, geminiModel *genai.GenerativeModel) *SummarizeService {
	return &SummarizeService{
		speechClient: speechClient,
		geminiModel:  geminiModel,
	}
}

// TranscribeAndSummarize melakukan transkripsi dan peringkasan audio.
func (s *SummarizeService) TranscribeAndSummarize(ctx context.Context, fileData []byte, fileName string) (string, error) {
	// 1. Transkripsi (kirim fileName)
	transcript, err := s.transcribeAudio(ctx, fileData, fileName)
	if err != nil {
		return "", fmt.Errorf("gagal mentranskrip audio: %w", err)
	}

	// 2. Peringkasan (tetap sama)
	summary, err := s.summarizeText(ctx, transcript)
	if err != nil {
		return "", fmt.Errorf("gagal membuat ringkasan: %w", err)
	}

	return summary, nil
}

// transcribeAudio (sekarang menjadi method private di dalam service)
// UBAH TANDA TANGAN: Tambahkan fileName
func (s *SummarizeService) transcribeAudio(ctx context.Context, fileData []byte, fileName string) (string, error) {
	log.Println("Mengirim audio ke Google Speech-to-Text API (dengan Diarization)...")

	// Konfigurasi request transkripsi
	config := &speechpb.RecognitionConfig{
		LanguageCode:    "id-ID",
		EnableAutomaticPunctuation: true,
		DiarizationConfig: &speechpb.SpeakerDiarizationConfig{
			EnableSpeakerDiarization: true,
			MinSpeakerCount:          2,
			MaxSpeakerCount:          6,
		},
	}

	// --- LOGIKA BARU UNTUK DETEKSI TIPE FILE ---
	if strings.HasSuffix(strings.ToLower(fileName), ".wav") {
		log.Println("Deteksi file WAV. Menggunakan encoding LINEAR16.")
		config.Encoding = speechpb.RecognitionConfig_LINEAR16
		// PENTING: LINEAR16 (WAV) membutuhkan SampleRateHertz yang akurat.
		// Asumsi 16000 adalah tebakan; jika file WAV-mu punya rate beda (misal 44100Hz), ini akan GAGAL.
		// Solusi ideal adalah membaca header WAV, tapi untuk sekarang kita coba asumsi 16000.
		config.SampleRateHertz = 16000 
	} else {
		log.Println("Deteksi file non-WAV (asumsi MP3). Menggunakan encoding MP3.")
		config.Encoding = speechpb.RecognitionConfig_MP3
		// MP3 bisa mendeteksi SampleRateHertz dari header filenya,
		// tapi kita bisa set 16000 sebagai petunjuk.
		config.SampleRateHertz = 16000
	}
	// ----------------------------------------

	req := &speechpb.RecognizeRequest{
		Config: config, // Gunakan config dinamis
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: fileData},
		},
	}

	resp, err := s.speechClient.Recognize(ctx, req)
	if err != nil {
		// Ini akan mencetak error dari Google ke terminal backend-mu
		return "", fmt.Errorf("gagal Recognize API: %w", err)
	}

	// ... (Sisa fungsi untuk memproses hasil transkripsi tetap sama) ...
	if len(resp.Results) > 0 && len(resp.Results[len(resp.Results)-1].Alternatives[0].Words) > 0 {
		var transcriptWithSpeakers strings.Builder
		currentSpeakerTag := int32(-1)
		result := resp.Results[len(resp.Results)-1]
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
		if transcriptWithSpeakers.Len() > 0 {
			log.Println("Transkrip dengan pembicara berhasil dibuat.")
			return transcriptWithSpeakers.String(), nil
		}
	}

	log.Println("Diarization gagal atau tidak ada info kata, membuat transkrip biasa.")
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

// summarizeText (sekarang menjadi method private di dalam service)
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