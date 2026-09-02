# BurmaVoice Services Package
# Lazy-friendly package definition

__all__ = ["MyanmarTextProcessor", "AudioProcessor", "MyanmarTTSEngine"]

def __getattr__(name):
    if name == "MyanmarTextProcessor":
        from .text_processor import MyanmarTextProcessor
        return MyanmarTextProcessor
    elif name == "AudioProcessor":
        from .audio_effects import AudioProcessor
        return AudioProcessor
    elif name == "MyanmarTTSEngine":
        from .tts_engine import MyanmarTTSEngine
        return MyanmarTTSEngine
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
