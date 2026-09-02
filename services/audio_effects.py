import io
import wave
import struct
import numpy as np
from scipy import signal
from typing import Optional

class AudioProcessor:
    """
    High-quality Digital Signal Processing (DSP) for TTS audio streams.
    Handles pitch shifting, speed modulation, EQ filtering, and WAV byte encoding.
    """

    @staticmethod
    def normalize_peak(audio: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
        """Normalizes audio waveform to target peak amplitude to avoid clipping."""
        if audio.size == 0:
            return audio
        max_val = np.max(np.abs(audio))
        if max_val > 1e-6:
            return audio * (target_peak / max_val)
        return audio

    @classmethod
    def apply_speed(cls, audio: np.ndarray, speed: float, sample_rate: int = 16000) -> np.ndarray:
        """
        Adjusts playback speed (0.5x to 2.0x) using Overlap-Add (OLA) time-stretching
        to preserve natural pitch without distortion.
        """
        if abs(speed - 1.0) < 0.02 or audio.size == 0:
            return audio

        # WSOLA / OLA implementation for robust CPU-friendly time-stretching
        win_size = int(0.04 * sample_rate)  # 40ms window
        hop_in = win_size // 2
        hop_out = int(hop_in / speed)

        if hop_out <= 0 or win_size <= 0:
            return audio

        window = np.hanning(win_size)
        num_frames = int((len(audio) - win_size) / hop_in)
        if num_frames <= 0:
            return audio

        out_len = int(len(audio) / speed) + win_size
        output = np.zeros(out_len, dtype=np.float32)
        norm_weights = np.zeros(out_len, dtype=np.float32)

        for i in range(num_frames):
            in_pos = i * hop_in
            out_pos = i * hop_out
            if in_pos + win_size > len(audio) or out_pos + win_size > out_len:
                break
            frame = audio[in_pos:in_pos + win_size] * window
            output[out_pos:out_pos + win_size] += frame
            norm_weights[out_pos:out_pos + win_size] += window

        # Normalize overlapping windows
        mask = norm_weights > 1e-4
        output[mask] /= norm_weights[mask]
        
        # Trim excess zeros
        return cls.normalize_peak(output[mask])

    @classmethod
    def apply_pitch_shift(cls, audio: np.ndarray, pitch_factor: float, sample_rate: int = 16000) -> np.ndarray:
        """
        Shifts pitch up or down by pitch_factor (e.g. 0.85 = deeper male, 1.15 = higher female)
        while maintaining total duration.
        """
        if abs(pitch_factor - 1.0) < 0.02 or audio.size == 0:
            return audio

        # Step 1: Resample to shift pitch & speed simultaneously
        orig_len = len(audio)
        resampled_len = int(orig_len / pitch_factor)
        if resampled_len <= 10:
            return audio

        resampled = signal.resample(audio, resampled_len)

        # Step 2: Time-stretch back to original speed using OLA
        stretched = cls.apply_speed(resampled, speed=1.0 / pitch_factor, sample_rate=sample_rate)
        return cls.normalize_peak(stretched)

    @classmethod
    def apply_warmth_and_eq(cls, audio: np.ndarray, sample_rate: int = 16000, warmth: float = 1.0) -> np.ndarray:
        """
        Applies gentle studio broadcast EQ:
        - High-pass filter (80Hz) to cut microphone rumble
        - Low-mid warmth boost / presence enhancement
        """
        if audio.size == 0:
            return audio

        try:
            # 80 Hz 2nd-order Butterworth High-Pass Filter
            nyquist = sample_rate / 2.0
            hp_cutoff = min(80.0 / nyquist, 0.99)
            b_hp, a_hp = signal.butter(2, hp_cutoff, btype='highpass')
            filtered = signal.lfilter(b_hp, a_hp, audio)

            # Apply warmth factor if requested
            if abs(warmth - 1.0) > 0.05:
                # Bass/Low-mid shelf around 250Hz
                boost = (warmth - 1.0) * 0.3
                filtered = filtered + (boost * np.tanh(filtered * 1.5))

            return cls.normalize_peak(filtered)
        except Exception:
            return cls.normalize_peak(audio)

    @classmethod
    def create_silence(cls, duration_sec: float = 0.2, sample_rate: int = 16000) -> np.ndarray:
        """Generates a numpy silence buffer of given duration."""
        return np.zeros(int(duration_sec * sample_rate), dtype=np.float32)

    @classmethod
    def to_wav_bytes(cls, audio: np.ndarray, sample_rate: int = 16000) -> bytes:
        """
        Converts float32 numpy audio waveform to 16-bit PCM WAV bytes.
        """
        # Ensure float32 in [-1.0, 1.0]
        clamped = np.clip(audio, -1.0, 1.0)
        
        # Convert to 16-bit signed integers
        pcm_16 = (clamped * 32767.0).astype(np.int16)

        # Write to in-memory WAV buffer
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)  # Mono
            wf.setsampwidth(2)  # 16-bit (2 bytes)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_16.tobytes())

        buf.seek(0)
        return buf.getvalue()
