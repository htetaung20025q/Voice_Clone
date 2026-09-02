import os
import io
import json
import base64
import logging
import urllib.parse
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Body, BackgroundTasks
from fastapi.responses import Response, FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import (
    APP_TITLE,
    APP_VERSION,
    VOICE_PROFILES,
    SAMPLE_PROMPTS,
    SAMPLE_RATE,
    MAX_TEXT_LENGTH
)
try:
    from services.text_processor import MyanmarTextProcessor
    from services.tts_engine import MyanmarTTSEngine
except (ImportError, ModuleNotFoundError):
    import sys
    from pathlib import Path
    backend_dir = str(Path(__file__).resolve().parent / "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from app.main import app as modern_app
    app = modern_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("burmavoice.app")

# Lifecycle: Prewarm model in background
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BurmaVoice server...")
    engine = MyanmarTTSEngine.get_instance()
    # Attempt background model loading
    import threading
    threading.Thread(target=engine.load_model, daemon=True).start()
    yield
    logger.info("Shutting down BurmaVoice server...")

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="BurmaVoice - Fast & Natural Myanmar Text-to-Speech API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Request / Response Schemas
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH, description="Myanmar Unicode text to synthesize")
    voice_id: str = Field(default="thiri", description="Voice profile ID (thiri, kyaw_thu, may_hnin, min_khant)")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier (0.5 to 2.0)")
    pitch: Optional[float] = Field(default=None, ge=0.7, le=1.4, description="Custom pitch multiplier")
    return_base64: bool = Field(default=False, description="Whether to return audio as base64 in JSON response")

class PreprocessRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH, description="Myanmar text for syllable segmentation and analysis")

# ----------------- API Endpoints ----------------- #

@app.get("/")
async def serve_index():
    """Serves the main BurmaVoice web UI dashboard."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "BurmaVoice API is running. Index UI not found in static folder."})

@app.get("/api/health")
async def health_check():
    """Returns server and TTS model health status."""
    engine = MyanmarTTSEngine.get_instance()
    return {
        "status": "healthy",
        "app_title": APP_TITLE,
        "version": APP_VERSION,
        "model_loaded": engine.is_loaded,
        "model_id": engine.model_id,
        "compute_device": engine.device,
        "sample_rate": SAMPLE_RATE,
        "load_error": engine.load_error
    }

@app.get("/api/voices")
async def get_voices():
    """Returns all available Myanmar voice profiles."""
    return {
        "success": True,
        "voices": list(VOICE_PROFILES.values()),
        "total_voices": len(VOICE_PROFILES)
    }

@app.get("/api/samples")
async def get_samples():
    """Returns preset Myanmar sample prompts."""
    return {
        "success": True,
        "samples": SAMPLE_PROMPTS
    }

@app.post("/api/preprocess")
async def preprocess_text(req: PreprocessRequest):
    """
    Normalizes Myanmar Unicode, counts syllables, and chunks text.
    """
    try:
        analysis = MyanmarTextProcessor.analyze_text(req.text)
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        logger.error(f"Preprocessing error: {e}")
        raise HTTPException(status_code=400, detail=f"Text processing error: {str(e)}")

@app.post("/api/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    """
    Synthesizes Myanmar Unicode text into natural audio speech.
    Returns binary WAV stream by default, or JSON with base64 data if return_base64=True.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty or only spaces.")

    if req.voice_id not in VOICE_PROFILES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid voice_id '{req.voice_id}'. Available voices: {list(VOICE_PROFILES.keys())}"
        )

    try:
        engine = MyanmarTTSEngine.get_instance()
        wav_bytes, metadata = engine.synthesize(
            text=req.text,
            voice_id=req.voice_id,
            speed=req.speed,
            pitch=req.pitch
        )

        if req.return_base64:
            b64_audio = base64.b64encode(wav_bytes).decode("utf-8")
            return {
                "success": True,
                "audio_base64": f"data:audio/wav;base64,{b64_audio}",
                "metadata": metadata
            }

        # Return audio streaming response with headers
        safe_voice = urllib.parse.quote(metadata["voice_id"])
        response_headers = {
            "Content-Type": "audio/wav",
            "Content-Disposition": f'inline; filename="burmavoice_{safe_voice}.wav"',
            "X-Audio-Duration": str(metadata["duration_seconds"]),
            "X-Inference-Time": str(metadata["inference_time_seconds"]),
            "X-Syllable-Count": str(metadata["syllable_count"]),
            "X-Character-Count": str(metadata["character_count"]),
            "X-Voice-ID": metadata["voice_id"],
            "Access-Control-Expose-Headers": "X-Audio-Duration, X-Inference-Time, X-Syllable-Count, X-Character-Count, X-Voice-ID"
        }

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers=response_headers
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception("Synthesis failed")
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")

class TTSGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LENGTH)
    speaker_id: Optional[str] = Field(default="female_soft")
    voice_id: Optional[str] = Field(default=None)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: Optional[float] = Field(default=None)

@app.post("/api/tts/generate")
async def generate_tts(req: TTSGenerateRequest):
    """
    Standard BurmaVoice compatibility endpoint accepting speaker_id and returning binary WAV audio.
    """
    speaker_map = {
        "female_soft": "thiri",
        "male_deep": "kyaw_thu",
        "female_news": "may_hnin",
        "male_casual": "min_khant",
        "thiri": "thiri",
        "kyaw_thu": "kyaw_thu",
        "may_hnin": "may_hnin",
        "min_khant": "min_khant"
    }
    raw_id = req.voice_id or req.speaker_id or "thiri"
    resolved_voice = speaker_map.get(raw_id, "thiri")
    
    synth_req = SynthesizeRequest(
        text=req.text,
        voice_id=resolved_voice,
        speed=req.speed,
        pitch=req.pitch,
        return_base64=False
    )
    return await synthesize_speech(synth_req)

@app.get("/api/synthesize/quick")
async def synthesize_quick(
    text: str = Query(..., description="Myanmar text to synthesize"),
    voice: str = Query("thiri", description="Voice profile ID"),
    speed: float = Query(1.0, ge=0.5, le=2.0, description="Speech rate")
):
    """
    Convenient GET endpoint for quick browser testing and direct audio tag playback.
    """
    req = SynthesizeRequest(text=text, voice_id=voice, speed=speed)
    return await synthesize_speech(req)

