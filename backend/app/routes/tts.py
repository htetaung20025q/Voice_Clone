"""
API Endpoints for Myanmar Text-to-Speech synthesis, voices, and styles.
Supports both /api/v1 and /api routes.
"""

import base64
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, status

from app.config import SUPPORTED_VOICES, SUPPORTED_STYLES, settings
from app.schemas.tts import (
    TTSRequest,
    TTSJsonResponse,
    TTSResponseMetadata,
    VoiceInfo,
    StyleInfo,
    HealthResponse
)
from app.services.gemini_tts import tts_service

logger = logging.getLogger("burmavoice.routes")
router = APIRouter(tags=["Myanmar Text-to-Speech"])


@router.get(
    "/api/health",
    response_model=HealthResponse,
    summary="Health Check"
)
@router.get(
    "/api/v1/health",
    response_model=HealthResponse,
    summary="Health Check (v1)"
)
async def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        gemini_configured=tts_service.is_configured(),
        model=settings.GEMINI_MODEL,
        environment=settings.ENVIRONMENT
    )


@router.get(
    "/api/voices",
    response_model=List[VoiceInfo],
    summary="Get Available Myanmar Voices"
)
@router.get(
    "/api/v1/voices",
    response_model=List[VoiceInfo],
    summary="Get Available Myanmar Voices (v1)"
)
async def get_voices():
    return SUPPORTED_VOICES


@router.get(
    "/api/styles",
    response_model=List[StyleInfo],
    summary="Get Available Speaking Styles"
)
@router.get(
    "/api/v1/styles",
    response_model=List[StyleInfo],
    summary="Get Available Speaking Styles (v1)"
)
async def get_styles():
    return SUPPORTED_STYLES


@router.post(
    "/api/tts",
    summary="Synthesize Myanmar Speech"
)
@router.post(
    "/api/v1/tts",
    summary="Synthesize Myanmar Speech (v1)"
)
async def synthesize_speech(
    request: TTSRequest,
    format: Optional[str] = Query(
        default="audio",
        description="Response format: 'audio' (direct WAV stream) or 'json' (base64 + metadata)"
    )
):
    try:
        wav_bytes, metadata = await tts_service.synthesize(
            text=request.text,
            voice=request.voice,
            style=request.style or "natural",
            language=request.language or "myanmar",
            speed=request.speed or 1.0,
            pitch=request.pitch or 0.0
        )

        if format.lower() == "json":
            encoded_audio = base64.b64encode(wav_bytes).decode("utf-8")
            return TTSJsonResponse(
                audio_base64=encoded_audio,
                mime_type="audio/wav",
                filename=f"speech_{request.voice.lower()}_{int(metadata['duration_seconds'])}s.wav",
                metadata=TTSResponseMetadata(**metadata)
            )

        # Binary audio/wav streaming response
        headers = {
            "Content-Type": "audio/wav",
            "Content-Disposition": f'inline; filename="speech_{request.voice.lower()}.wav"',
            "X-Audio-Duration": str(metadata["duration_seconds"]),
            "X-Audio-Latency-Ms": str(metadata["latency_ms"]),
            "X-Audio-Voice": metadata["voice"],
            "X-Audio-Voice-Name": metadata["voice_name"],
            "X-Audio-Style": metadata["style"],
            "X-Audio-Language": metadata["language"],
            "X-Audio-Mock": str(metadata.get("is_mock", False)).lower(),
            "Access-Control-Expose-Headers": "X-Audio-Duration, X-Audio-Latency-Ms, X-Audio-Voice, X-Audio-Voice-Name, X-Audio-Style, X-Audio-Language, X-Audio-Mock"
        }
        return Response(content=wav_bytes, media_type="audio/wav", headers=headers)

    except ValueError as val_err:
        logger.warning(f"Validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        err_str = str(run_err)
        logger.error(f"Runtime error during synthesis: {err_str}")
        if "QUOTA_EXCEEDED" in err_str:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini API rate limit or quota exceeded. Please wait a moment and try again."
            )
        elif "NOT_CONFIGURED" in err_str:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is not configured on the backend. Please verify GEMINI_API_KEY in backend/.env."
            )
        elif "AUTH_ERROR" in err_str:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini API authentication failed. Please verify the API key."
            )
        elif "MODEL_UNAVAILABLE" in err_str:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The requested Gemini TTS model is currently unavailable."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't generate the voice. Please try again."
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't generate the voice. Please try again."
        )
