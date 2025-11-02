export async function convertToWAV(audioFile, onProgress = null) {
  return new Promise((resolve, reject) => {
    // Validasi input
    if (!audioFile || !(audioFile instanceof File)) {
      reject(new Error('File audio tidak valid'));
      return;
    }

    // Cek ukuran file (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      reject(new Error('Ukuran file terlalu besar. Maksimal 100MB'));
      return;
    }

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 50; // 50% untuk reading
        onProgress(progress, 'Membaca file...');
      }
    };

    reader.onload = async (event) => {
      try {
        // Progress: 50% - mulai decode
        if (onProgress) onProgress(50, 'Mendekode audio...');

        // Buat audio context
        const audioContext = new (window.AudioContext || window.AudioContext)({
          sampleRate: 16000, // Optimal untuk speech-to-text
        });

        const arrayBuffer = event.target.result;

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Progress: 75% - mulai konversi
        if (onProgress) onProgress(75, 'Mengkonversi ke WAV...');

        // Convert to WAV
        const wavBlob = audioBufferToWav(audioBuffer);

        // Progress: 90% - membuat file
        if (onProgress) onProgress(90, 'Menyelesaikan...');

        // Generate filename
        const originalName = audioFile.name.replace(/\.[^/.]+$/, '');
        const timestamp = Date.now();
        const newFileName = `${originalName}_converted_${timestamp}.wav`;

        // Create new File object
        const wavFile = new File([wavBlob], newFileName, {
          type: 'audio/wav',
          lastModified: Date.now(),
        });

        // Progress: 100% - selesai
        if (onProgress) onProgress(100, 'Selesai!');

        // Log info
        console.log('Audio conversion successful:', {
          original: {
            name: audioFile.name,
            size: formatFileSize(audioFile.size),
            type: audioFile.type,
          },
          converted: {
            name: wavFile.name,
            size: formatFileSize(wavFile.size),
            type: wavFile.type,
            duration: audioBuffer.duration.toFixed(2) + 's',
            sampleRate: audioBuffer.sampleRate + 'Hz',
            channels: audioBuffer.numberOfChannels,
          },
        });

        // Clean up
        audioContext.close();

        resolve(wavFile);
      } catch (error) {
        console.error('Audio conversion error:', error);

        let errorMessage = 'Gagal mengkonversi audio';

        if (error.name === 'EncodingError') {
          errorMessage = 'Format audio tidak didukung atau file corrupt';
        } else if (error.message.includes('decodeAudioData')) {
          errorMessage = 'Gagal mendekode audio. Pastikan file tidak corrupt';
        } else if (error.message.includes('NotSupportedError')) {
          errorMessage = 'Browser Anda tidak mendukung format audio ini';
        }

        reject(new Error(`${errorMessage}: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file audio. Silakan coba lagi.'));
    };

    // Start reading
    reader.readAsArrayBuffer(audioFile);
  });
}

function audioBufferToWav(audioBuffer) {
  const originalNumberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 1; 
  const format = 1; 
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample; // Ini akan menjadi 1 * 2 = 2

  let monoChannelData;

  if (originalNumberOfChannels === 1) {
    monoChannelData = audioBuffer.getChannelData(0);
  } else {
    const leftChannel = audioBuffer.getChannelData(0);
    // Cek jika ada channel kanan, jika tidak, salin saja channel kiri
    const rightChannel = originalNumberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
    const length = leftChannel.length;
    monoChannelData = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      // Rata-ratakan channel kiri dan kanan
      monoChannelData[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
    }
  }

  const interleavedData = monoChannelData;
  const dataLength = interleavedData.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // Write fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numberOfChannels, true); 
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate (Mono)
  view.setUint16(32, blockAlign, true); // BlockAlign (Mono)
  view.setUint16(34, bitDepth, true);

  // Write data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  floatTo16BitPCM(view, 44, interleavedData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function interleaveChannels(channelData) {
  const length = channelData[0].length;
  const numberOfChannels = channelData.length;
  const result = new Float32Array(length * numberOfChannels);

  let outputIndex = 0;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      result[outputIndex++] = channelData[channel][i];
    }
  }

  return result;
}

/**
 * Write string to DataView
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert Float32 samples to 16-bit PCM
 */
function floatTo16BitPCM(view, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    // Clamp to [-1, 1] range
    const sample = Math.max(-1, Math.min(1, input[i]));

    // Convert to 16-bit integer
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, value, true);
  }
}

/**
 * Cek apakah file perlu dikonversi
 * @param {File} file
 * @returns {boolean}
 */
export function needsConversion(file) {
  if (!file) return false;

  // Daftar MIME types yang perlu konversi
  const conversionTypes = [
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/aacp',
    'audio/mp4',
    'audio/x-m4p',
    'video/mp4', // Kadang audio M4A dideteksi sebagai video/mp4
  ];

  // Daftar ekstensi yang perlu konversi
  const conversionExtensions = ['.m4a', '.aac', '.mp4', '.m4p'];

  // Cek MIME type
  if (conversionTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Cek ekstensi file
  const fileName = file.name.toLowerCase();
  return conversionExtensions.some((ext) => fileName.endsWith(ext));
}

/**
 * Validasi file audio
 * @param {File} file
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateAudioFile(file) {
  // Cek apakah file ada
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan' };
  }

  // Cek tipe file
  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/mp4'];

  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac'];

  const isValidType = allowedTypes.includes(file.type.toLowerCase());
  const isValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidType && !isValidExtension) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan MP3, WAV, M4A, atau AAC',
    };
  }

  // Cek ukuran file (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Ukuran file terlalu besar. Maksimal 100MB',
    };
  }

  // Cek ukuran minimum (min 1KB)
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'File terlalu kecil atau corrupt',
    };
  }

  return { valid: true, error: null };
}

/**
 * Format ukuran file untuk ditampilkan
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Estimasi durasi konversi (dalam detik)
 * @param {number} fileSize - ukuran file dalam bytes
 * @returns {number} - estimasi durasi dalam detik
 */
export function estimateConversionTime(fileSize) {
  // Asumsi: 1MB = ~1 detik konversi (bisa bervariasi tergantung device)
  const mb = fileSize / (1024 * 1024);
  return Math.ceil(mb * 1.5);
}

/**
 * Cek apakah browser mendukung Web Audio API
 * @returns {boolean}
 */
export function isWebAudioSupported() {
  return !!(window.AudioContext || window.AudioContext);
}

// Export semua utilities
export default {
  convertToWAV,
  needsConversion,
  validateAudioFile,
  formatFileSize,
  estimateConversionTime,
  isWebAudioSupported,
};
