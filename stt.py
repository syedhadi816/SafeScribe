import numpy as np
from scipy import signal
from faster_whisper import WhisperModel

WHISPER_SAMPLERATE = 16000


class WhisperSTT:
    def __init__(self):
        print("Loading Whisper model...")
        self.model = WhisperModel(
            "base",           # change model here
            compute_type="int8"  # use float16 if running on GPU
        )
        print("Whisper model loaded.")

    def transcribe(self, audio, samplerate=WHISPER_SAMPLERATE):
        # Pass numpy directly to avoid temp file I/O (faster on Pi)
        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:
            audio = audio.squeeze()
        if audio.dtype == np.int16:
            audio = audio.astype(np.float32) / 32768.0
        elif audio.dtype != np.float32:
            audio = audio.astype(np.float32)

        # Resample to 16 kHz if needed (Whisper expects 16k)
        if samplerate != WHISPER_SAMPLERATE:
            num_samples = int(len(audio) * WHISPER_SAMPLERATE / samplerate)
            audio = signal.resample(audio, num_samples).astype(np.float32)

        segments, _ = self.model.transcribe(audio, language="en", task="transcribe")
        return " ".join(s.text for s in segments)

