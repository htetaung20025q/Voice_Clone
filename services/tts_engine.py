import os
import time
import logging
import threading
import numpy as np
from typing import Optional, Dict, Any, Tuple

from config import MODEL_ID, SAMPLE_RATE, VOICE_PROFILES, CACHE_DIR
from services.text_processor import MyanmarTextProcessor
from services.audio_effects import AudioProcessor

logger = logging.getLogger("burmavoice.tts")
logging.basicConfig(level=logging.INFO)

class MyanmarTTSEngine:
    """
    Production-grade Myanmar Text-to-Speech Engine utilizing Hugging Face MMS-TTS VITS.
    Features lazy loading, multi-chunk synthesis, voice profile customization, and fallback resilience.
    """

    _instance: Optional["MyanmarTTSEngine"] = None
    _lock = threading.Lock()

    def __init__(self):
        self.model_id = MODEL_ID
        self.sample_rate = SAMPLE_RATE
        self.tokenizer = None
        self.model = None
        self.device = "cpu"
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self._init_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "MyanmarTTSEngine":
        """Singleton accessor for the TTS Engine."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = MyanmarTTSEngine()
            return cls._instance

    def load_model(self, force_reload: bool = False) -> bool:
        """
        Loads the Hugging Face MMS VITS Myanmar model and tokenizer into memory.
        Thread-safe and supports CPU or CUDA GPU acceleration.
        """
        with self._init_lock:
            if self.is_loaded and not force_reload:
                return True

            logger.info(f"Loading Myanmar TTS Model: {self.model_id}...")
            start_time = time.time()

            try:
                import torch
                from transformers import VitsModel, AutoTokenizer

                # Device selection
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                logger.info(f"Using compute device: {self.device}")

                os.makedirs(CACHE_DIR, exist_ok=True)

                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_id,
                    cache_dir=CACHE_DIR
                )
                self.model = VitsModel.from_pretrained(
                    self.model_id,
                    cache_dir=CACHE_DIR
                ).to(self.device)

                self.model.eval()
                self.is_loaded = True
                self.load_error = None
                
                elapsed = time.time() - start_time
                logger.info(f"Myanmar TTS Model successfully loaded in {elapsed:.2f}s on {self.device}.")
                return True

            except Exception as e:
                self.is_loaded = False
                self.load_error = str(e)
                logger.warning(f"Unable to load Hugging Face model ({self.model_id}): {e}. Fallback engine will be active.")
                return False

    def synthesize(
        self,
        text: str,
        voice_id: str = "thiri",
        speed: float = 1.0,
        pitch: Optional[float] = None
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Synthesizes Myanmar text into natural speech audio.
        
        Args:
            text: Myanmar Unicode text
            voice_id: Key from config.VOICE_PROFILES (thiri, kyaw_thu, may_hnin, min_khant)
            speed: Playback speed multiplier (0.5 to 2.0)
            pitch: Custom pitch multiplier (optional override)
            
        Returns:
            Tuple of (WAV audio bytes, synthesis metadata)
        """
        start_time = time.time()
        
        # 1. Voice Profile Resolution
        profile = VOICE_PROFILES.get(voice_id, VOICE_PROFILES["thiri"])
        target_pitch = pitch if pitch is not None else profile.get("pitch_shift", 1.0)
        target_speed = speed * profile.get("speed_factor", 1.0)
        warmth = profile.get("warmth", 1.0)

        # 2. Myanmar Text Normalization & Chunking
        analysis = MyanmarTextProcessor.analyze_text(text)
        chunks = analysis["chunks"]
        cleaned_text = analysis["cleaned_text"]

        if not chunks or not cleaned_text:
            raise ValueError("Input text cannot be empty or contain only non-Burmese whitespace.")

        # 3. Model Inference or Fallback
        if not self.is_loaded:
            self.load_model()

        audio_chunks = []
        silence_between = AudioProcessor.create_silence(duration_sec=0.18, sample_rate=self.sample_rate)

        for chunk in chunks:
            chunk_audio = self._synthesize_chunk(chunk)
            if chunk_audio is not None and len(chunk_audio) > 0:
                audio_chunks.append(chunk_audio)
                audio_chunks.append(silence_between)

        # Remove trailing silence if present
        if audio_chunks and np.array_equal(audio_chunks[-1], silence_between):
            audio_chunks.pop()

        if not audio_chunks:
            # Generate minimal fallback tone if empty
            combined_audio = AudioProcessor.create_silence(0.5, self.sample_rate)
        else:
            combined_audio = np.concatenate(audio_chunks)

        # 4. Audio DSP Post-processing (Voice persona modulation)
        # Apply pitch shifting for voice persona (male/female characteristics)
        if abs(target_pitch - 1.0) > 0.02:
            combined_audio = AudioProcessor.apply_pitch_shift(
                combined_audio,
                pitch_factor=target_pitch,
                sample_rate=self.sample_rate
            )

        # Apply speed adjustment
        if abs(target_speed - 1.0) > 0.02:
            combined_audio = AudioProcessor.apply_speed(
                combined_audio,
                speed=target_speed,
                sample_rate=self.sample_rate
            )

        # Apply broadcast warmth and studio high-pass filter
        combined_audio = AudioProcessor.apply_warmth_and_eq(
            combined_audio,
            sample_rate=self.sample_rate,
            warmth=warmth
        )

        # Peak normalization
        combined_audio = AudioProcessor.normalize_peak(combined_audio, target_peak=0.95)

        # 5. Encode to WAV byte buffer
        wav_bytes = AudioProcessor.to_wav_bytes(combined_audio, sample_rate=self.sample_rate)
        
        elapsed = time.time() - start_time
        audio_duration_sec = len(combined_audio) / float(self.sample_rate)

        metadata = {
            "voice": profile["name"],
            "voice_id": voice_id,
            "gender": profile["gender"],
            "speed": round(speed, 2),
            "pitch": round(target_pitch, 2),
            "character_count": len(cleaned_text),
            "syllable_count": analysis["syllable_count"],
            "chunk_count": len(chunks),
            "sample_rate": self.sample_rate,
            "duration_seconds": round(audio_duration_sec, 2),
            "inference_time_seconds": round(elapsed, 3),
            "rtf": round(elapsed / max(audio_duration_sec, 0.01), 3),
            "model_used": self.model_id if self.is_loaded else "fallback_acoustic_synth"
        }

        logger.info(
            f"Synthesized {metadata['character_count']} chars ({metadata['syllable_count']} syllables) "
            f"in {elapsed:.2f}s (Audio Duration: {audio_duration_sec:.2f}s, RTF: {metadata['rtf']})."
        )

        return wav_bytes, metadata

    def _synthesize_chunk(self, text_chunk: str) -> np.ndarray:
        """Synthesizes a single chunk using VITS model or acoustic fallback."""
        if self.is_loaded and self.model is not None and self.tokenizer is not None:
            try:
                import torch
                inputs = self.tokenizer(text_chunk, return_tensors="pt")
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    output = self.model(**inputs)
                    waveform = output.waveform[0].cpu().float().numpy()
                    return waveform
            except Exception as e:
                logger.warning(f"Error during VITS inference for chunk '{text_chunk[:20]}...': {e}")
                return self._fallback_acoustic_synthesis(text_chunk)
        else:
            return self._fallback_acoustic_synthesis(text_chunk)

    def _fallback_acoustic_synthesis(self, text: str) -> np.ndarray:
        """
        Acoustic harmonic formant fallback synthesizer for Myanmar syllables.
        Used when downloading model or in strictly offline mode without PyTorch models.
        Produces smooth vocalized speech-like melodic carrier signals.
        """
        syllables = MyanmarTextProcessor.segment_syllables(text)
        if not syllables:
            return AudioProcessor.create_silence(0.1, self.sample_rate)

        # Base formant frequencies for Myanmar vowel timbres
        syllable_duration = 0.22  # ~220ms per syllable
        t_syllable = np.linspace(0, syllable_duration, int(syllable_duration * self.sample_rate), False)
        
        full_signal = []

        # Pitch contour frequencies (Hz) for standard Myanmar tones
        base_f0 = 175.0  # Burmese neutral pitch
        
        for idx, syll in enumerate(syllables):
            # Tone modulation based on tone marks (း = high falling, ့ = creaky/short)
            if "း" in syll:
                f0 = base_f0 * 1.15
            elif "့" in syll:
                f0 = base_f0 * 0.92
            else:
                f0 = base_f0

            # Formant synthesis (F1 = 500Hz, F2 = 1500Hz, F3 = 2500Hz)
            f1, f2, f3 = 520.0, 1480.0, 2450.0
            
            # Harmonic voice source with gentle vibrato and smooth ADSR envelope
            vibrato = 1.0 + 0.015 * np.sin(2 * np.pi * 5.5 * t_syllable)
            phase = 2 * np.pi * np.cumsum(f0 * vibrato) / self.sample_rate
            
            harmonics = (
                1.0 * np.sin(phase) +
                0.5 * np.sin(2 * phase) +
                0.25 * np.sin(3 * phase) +
                0.12 * np.sin(4 * phase)
            )

            # Resonators (formant shaping)
            formant_signal = (
                harmonics * np.sin(2 * np.pi * f1 * t_syllable) * 0.5 +
                harmonics * np.sin(2 * np.pi * f2 * t_syllable) * 0.3 +
                harmonics * np.sin(2 * np.pi * f3 * t_syllable) * 0.1
            )

            # Smooth Hann-like window envelope to prevent clicking
            envelope = np.sin(np.pi * np.linspace(0, 1, len(t_syllable))) ** 1.5
            syllable_wave = formant_signal * envelope

            full_signal.append(syllable_wave)
            # Brief inter-syllable transition
            full_signal.append(np.zeros(int(0.02 * self.sample_rate)))

        combined = np.concatenate(full_signal).astype(np.float32)
        return AudioProcessor.normalize_peak(combined, 0.9)
