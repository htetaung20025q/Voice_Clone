"""
API Endpoints for Myanmar Text-to-Speech synthesis, voices, and styles.
Supports both /api/v1 and /api routes.
"""

import base64
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response, Depends, status
from fastapi.responses import FileResponse

from app.config import SUPPORTED_VOICES, SUPPORTED_STYLES, settings
from app.db.repository import Repository
from app.services.auth_service import get_current_user
from app.services.credit_service import calculate_required_credits
from app.schemas.tts import (
    TTSRequest,
    TTSJsonResponse,
    TTSResponseMetadata,
    VoiceInfo,
    StyleInfo,
    HealthResponse
)
from app.schemas.voice import ReplicatedTTSRequest
from app.services.gemini_tts import tts_service
from app.services.voice_replication import (
    replication_service,
    VoiceSessionNotFoundError,
    VoiceReplicationUnavailableError,
    VoiceReplicationAuthError,
    VoiceReplicationError
)

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
    "/api/voices/{voice_id}/preview",
    summary="Audition Voice Preview (Free)"
)
@router.get(
    "/api/v1/voices/{voice_id}/preview",
    summary="Audition Voice Preview (v1 Free)"
)
async def preview_voice(voice_id: str):
    """
    Public, credit-free endpoint to preview/audition any voice.
    Synthesizes the persona's pre-configured sample text.
    """
    voice_key = voice_id.strip().lower()
    voice_info = next(
        (v for v in SUPPORTED_VOICES if v["id"].lower() == voice_key or v["gemini_voice"].lower() == voice_key),
        None
    )
    if not voice_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VOICE_NOT_FOUND", "message": f"Voice '{voice_id}' not found."}
        )

    # 1. Check if pre-recorded high-fidelity human preview audio exists
    static_preview = Path(__file__).resolve().parent.parent / "static" / "previews" / f"{voice_info['id']}.mp3"
    if static_preview.is_file():
        return FileResponse(
            path=str(static_preview),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f'inline; filename="preview_{voice_info["id"]}.mp3"',
                "Cache-Control": "public, max-age=86400"
            }
        )

    # 2. Dynamic generation with human fallback
    sample_text = voice_info.get("sample_text", "မင်္ဂလာပါ ခင်ဗျာ။")

    try:
        audio_bytes, meta = await tts_service.synthesize(
            text=sample_text,
            voice=voice_info["id"],
            style="natural",
            language="myanmar",
            speed=1.0,
            pitch=0.0
        )
        duration_seconds = meta.get("duration_seconds", 2.0)
    except Exception as e:
        logger.warning(f"Live preview generation error for '{voice_id}' ({e}). Serving neural human fallback.")
        audio_bytes, meta = await tts_service._synthesize_human_fallback(
            text=sample_text,
            voice_info=voice_info,
            style_name="natural"
        )
        duration_seconds = meta.get("duration_seconds", 3.0)

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'inline; filename="preview_{voice_info["id"]}.wav"',
            "X-Audio-Duration": str(duration_seconds),
            "Cache-Control": "public, max-age=86400"
        }
    )


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
    ),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    is_admin = bool(current_user.get("is_admin", False))

    # 1. Resolve voice & check premium access control (Admins bypass premium restrictions)
    voice_key = request.voice.strip().lower()
    voice_info = next(
        (v for v in SUPPORTED_VOICES if v["id"].lower() == voice_key or v["gemini_voice"].lower() == voice_key),
        SUPPORTED_VOICES[0]
    )

    if voice_info.get("premium", False) and not is_admin and not current_user.get("is_premium", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PREMIUM_VOICE_REQUIRED",
                "message": f"'{voice_info['name']}' is a premium voice. Please purchase a credit package to unlock all premium voices."
            }
        )

    # 2. Calculate required credits (1 credit per 1,000 characters)
    required_credits = calculate_required_credits(request.text)

    # 3. Check user credit balance (Admins bypass insufficient credits block)
    current_balance = Repository.get_credit_balance(user_id)
    if not is_admin and current_balance < required_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": f"Not enough credits. You need {required_credits} credit(s) to generate this audio, but your current balance is {current_balance}."
            }
        )

    # 4. Create PENDING generation record
    generation_id = Repository.create_generation(
        user_id=user_id,
        voice=voice_info["id"],
        style=request.style or "natural",
        text=request.text,
        credits_used=required_credits,
        status="PENDING"
    )

    try:
        # 5. Synthesize TTS
        wav_bytes, metadata = await tts_service.synthesize(
            text=request.text,
            voice=request.voice,
            style=request.style or "natural",
            language=request.language or "myanmar",
            speed=request.speed or 1.0,
            pitch=request.pitch or 0.0
        )

        # 6. On success: Atomically deduct credits and mark generation SUCCESS
        deduct_ok, new_balance = Repository.deduct_credits_atomic(
            user_id=user_id,
            amount=required_credits,
            tx_type="TTS_USAGE",
            description=f"TTS Generation ({required_credits} credit{'s' if required_credits > 1 else ''})",
            reference_id=str(generation_id)
        )
        Repository.update_generation(
            generation_id=generation_id,
            status="SUCCESS",
            audio_url=f"/api/v1/tts/audio/{generation_id}"
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
            "X-Audio-Credits-Used": str(required_credits),
            "X-Audio-Credits-Remaining": str(new_balance),
            "Access-Control-Expose-Headers": "X-Audio-Duration, X-Audio-Latency-Ms, X-Audio-Voice, X-Audio-Voice-Name, X-Audio-Style, X-Audio-Language, X-Audio-Mock, X-Audio-Credits-Used, X-Audio-Credits-Remaining"
        }
        return Response(content=wav_bytes, media_type="audio/wav", headers=headers)

    except (HTTPException,):
        raise
    except ValueError as val_err:
        Repository.update_generation(generation_id=generation_id, status="FAILED", error_message=str(val_err))
        logger.warning(f"Validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        err_str = str(run_err)
        Repository.update_generation(generation_id=generation_id, status="FAILED", error_message=err_str)
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
        Repository.update_generation(generation_id=generation_id, status="FAILED", error_message=str(e))
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't generate the voice. Please try again."
        )


@router.post(
    "/api/tts/voice-replication",
    summary="Synthesize Replicated Voice Speech"
)
@router.post(
    "/api/v1/tts/voice-replication",
    summary="Synthesize Replicated Voice Speech (v1)"
)
async def synthesize_replicated_speech(
    request: ReplicatedTTSRequest,
    format: Optional[str] = Query(
        default="audio",
        description="Response format: 'audio' (direct WAV stream) or 'json' (base64 + metadata)"
    )
):
    """
    Synthesize speech using a verified temporary voice replication session.
    Requires voice_session_id created via /api/v1/voice/replicate.
    """
    try:
        wav_bytes, metadata = await replication_service.synthesize(
            session_id=request.voice_session_id,
            text=request.text,
            language_code=request.language_code or "my-MM"
        )

        if format.lower() == "json":
            encoded_audio = base64.b64encode(wav_bytes).decode("utf-8")
            meta_obj = TTSResponseMetadata(
                voice="replicated",
                voice_name="Replicated Voice",
                style="custom",
                language=metadata.get("language", "my-MM"),
                character_count=metadata.get("character_count", len(request.text)),
                duration_seconds=metadata.get("duration_seconds", 0.0),
                format="audio/wav",
                sample_rate=24000,
                latency_ms=metadata.get("latency_ms", 0.0),
                is_mock=metadata.get("is_mock", False)
            )
            return TTSJsonResponse(
                audio_base64=encoded_audio,
                mime_type="audio/wav",
                filename=f"speech_replicated_{int(metadata.get('duration_seconds', 0))}s.wav",
                metadata=meta_obj
            )

        headers = {
            "Content-Type": "audio/wav",
            "Content-Disposition": 'inline; filename="speech_replicated.wav"',
            "X-Audio-Duration": str(metadata.get("duration_seconds", 0.0)),
            "X-Audio-Latency-Ms": str(metadata.get("latency_ms", 0.0)),
            "X-Audio-Voice": "replicated",
            "X-Audio-Voice-Name": "Replicated Voice",
            "X-Audio-Voice-Session": request.voice_session_id,
            "X-Audio-Voice-Type": "replicated",
            "X-Audio-Style": "custom",
            "X-Audio-Language": metadata.get("language", request.language_code or "my-MM"),
            "X-Audio-Mock": str(metadata.get("is_mock", False)).lower(),
            "Access-Control-Expose-Headers": (
                "X-Audio-Duration, X-Audio-Latency-Ms, X-Audio-Voice, "
                "X-Audio-Voice-Name, X-Audio-Voice-Session, X-Audio-Voice-Type, "
                "X-Audio-Style, X-Audio-Language, X-Audio-Mock"
            )
        }
        return Response(content=wav_bytes, media_type="audio/wav", headers=headers)

    except VoiceSessionNotFoundError as snfe:
        logger.warning(f"Voice session not found: {snfe}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(snfe)
        )
    except ValueError as ve:
        logger.warning(f"Validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except VoiceReplicationUnavailableError as ue:
        logger.warning(f"Voice replication unavailable: {ue}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voice Replication is not enabled for this Google Cloud project."
        )
    except VoiceReplicationAuthError as ae:
        logger.warning(f"Voice replication auth error: {ae}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ae)
        )
    except Exception as e:
        logger.error(f"Error during replicated speech synthesis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice generation failed. Please try again."
        )
