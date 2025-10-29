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
func (s *SummarizeService) TranscribeAndSummarize(ctx context.Context, fileData []byte) (string, error) {
	// 1. Transkripsi
	transcript, err := s.transcribeAudio(ctx, fileData)
	if err != nil {
		// Gunakan error wrapping
		return "", fmt.Errorf("gagal mentranskrip audio: %w", err)
	}

	// 2. Peringkasan
	summary, err := s.summarizeText(ctx, transcript)
	if err != nil {
		return "", fmt.Errorf("gagal membuat ringkasan: %w", err)
	}

	return summary, nil
}

// transcribeAudio (sekarang menjadi method private di dalam service)
func (s *SummarizeService) transcribeAudio(ctx context.Context, fileData []byte) (string, error) {
	log.Println("Mengirim audio ke Google Speech-to-Text API (dengan Diarization)...")

	// Konfigurasi request transkripsi
	// TODO: Idealnya deteksi format audio (MP3/WAV) dan SampleRateHertz dari file
	req := &speechpb.RecognizeRequest{
		Config: &speechpb.RecognitionConfig{
			Encoding:        speechpb.RecognitionConfig_MP3, // Asumsi MP3
			SampleRateHertz: 16000,                         // Asumsi untuk MP3
			LanguageCode:    "id-ID",
			EnableAutomaticPunctuation: true,
			DiarizationConfig: &speechpb.SpeakerDiarizationConfig{
				EnableSpeakerDiarization: true,
				MinSpeakerCount:          2,
				MaxSpeakerCount:          6,
			},
		},
		Audio: &speechpb.RecognitionAudio{
			AudioSource: &speechpb.RecognitionAudio_Content{Content: fileData},
		},
	}

	resp, err := s.speechClient.Recognize(ctx, req)
	if err != nil {
		return "", fmt.Errorf("gagal Recognize API: %w", err)
	}

	// --- Memproses hasil transkripsi (Sama seperti sebelumnya) ---
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

	// Fallback jika diarization gagal
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