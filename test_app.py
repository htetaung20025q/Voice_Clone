import os
import sys
import unittest
# pyrefly: ignore [missing-import]
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.text_processor import MyanmarTextProcessor
from services.audio_effects import AudioProcessor
from services.tts_engine import MyanmarTTSEngine
from config import VOICE_PROFILES

class TestMyanmarTTS(unittest.TestCase):

    def test_unicode_normalization(self):
        sample = "မင်္ဂလာပါ\u200Bခင်ဗျာ။။"
        normalized = MyanmarTextProcessor.normalize_unicode(sample)
        self.assertNotIn("\u200B", normalized)
        self.assertNotIn("။။", normalized)
        self.assertTrue(normalized.startswith("မင်္ဂလာပါ"))

    def test_syllable_segmentation(self):
        sample = "မင်္ဂလာပါ မြန်မာနိုင်ငံ"
        sylls = MyanmarTextProcessor.segment_syllables(sample)
        self.assertGreater(len(sylls), 3)
        self.assertIn("မင်္ဂ", sylls[0])

    def test_text_chunking(self):
        long_text = "ပထမစာကြောင်း ဖြစ်ပါသည်။ " * 10
        chunks = MyanmarTextProcessor.chunk_text(long_text, max_chunk_chars=100)
        self.assertGreaterEqual(len(chunks), 2)

    def test_audio_effects_wav_conversion(self):
        sample_rate = 16000
        # 1-second sine wave
        t = np.linspace(0, 1.0, sample_rate, False)
        sine = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

        wav_bytes = AudioProcessor.to_wav_bytes(sine, sample_rate=sample_rate)
        self.assertIsInstance(wav_bytes, bytes)
        self.assertTrue(wav_bytes.startswith(b"RIFF"))
        self.assertIn(b"WAVE", wav_bytes[:16])

    def test_speed_and_pitch(self):
        sample_rate = 16000
        t = np.linspace(0, 0.5, int(0.5 * sample_rate), False)
        audio = (0.5 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)

        # Time stretch
        stretched = AudioProcessor.apply_speed(audio, speed=1.5, sample_rate=sample_rate)
        self.assertLess(len(stretched), len(audio))

        # Pitch shift
        shifted = AudioProcessor.apply_pitch_shift(audio, pitch_factor=1.2, sample_rate=sample_rate)
        self.assertGreater(len(shifted), 0)

    def test_tts_engine_synthesis(self):
        engine = MyanmarTTSEngine.get_instance()
        text = "မင်္ဂလာပါ"
        for voice_id in VOICE_PROFILES.keys():
            wav_bytes, metadata = engine.synthesize(text, voice_id=voice_id, speed=1.0)
            self.assertTrue(wav_bytes.startswith(b"RIFF"))
            self.assertGreater(metadata["duration_seconds"], 0.1)
            self.assertEqual(metadata["syllable_count"], MyanmarTextProcessor.count_syllables(text))

if __name__ == "__main__":
    unittest.main()
