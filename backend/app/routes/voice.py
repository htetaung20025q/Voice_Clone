"""
API Endpoints for Voice Replication: session creation, consent scripts, and session status.
"""

import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from app.config import SUPPORTED_REPLICATION_LANGUAGES
from app.schemas.voice import (
    VoiceReplicationResponse,
    VoiceConsentScript,
    VoiceSessionStatus
)
from app.services.voice_replication import (
    replication_service,
    VoiceReplicationError,
    VoiceReplicationUnavailableError,
    VoiceReplicationAuthError,
    VoiceReplicationConsentError,
    VoiceSessionNotFoundError
)
from app.services.audio_processor import AudioValidationError

logger = logging.getLogger("burmavoice.routes.voice")
router = APIRouter(prefix="/api/v1/voice", tags=["Gemini Voice Replication"])


@router.get(
    "/consent-scripts",
    response_model=List[VoiceConsentScript],
    summary="Get Required Consent Statements"
)
async def get_consent_scripts():
    """Return the official Google Cloud Voice Replication consent statements for each language."""
    return [
        VoiceConsentScript(
            id=item["id"],
            name=item["name"],
            consent_statement=item["consent_statement"],
            default_sample=item["default_sample"]
        )
        for item in SUPPORTED_REPLICATION_LANGUAGES
    ]


@router.post(
    "/replicate",
    response_model=VoiceReplicationResponse,
    summary="Create Voice Replication Key"
)
async def create_voice_replication(
    source_audio: UploadFile = File(..., description="Reference voice sample (10-30s WAV)"),
    consent_audio: UploadFile = File(..., description="Consent statement recording (WAV)"),
    consent_confirmed: bool = Form(..., description="Confirmation of voice ownership or permission"),
    language_code: Optional[str] = Form("my-MM", description="Language code: my-MM or en-US")
):
    """
    Upload source voice sample and consent recording to create a temporary 7-day
    Voice Replication key managed server-side.
    """
    # 1. Verify consent confirmation flag
    if not consent_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm that you own this voice or have permission to use it."
        )

    # 2. Read uploaded audio bytes
    try:
        source_bytes = await source_audio.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a voice sample."
        )

    try:
        consent_bytes = await consent_audio.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload the required consent recording."
        )

    if not source_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a voice sample."
        )
    if not consent_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload the required consent recording."
        )

    # 3. Process and create temporary session
    try:
        session = await replication_service.create_session(
            source_audio_bytes=source_bytes,
            consent_audio_bytes=consent_bytes,
            consent_confirmed=consent_confirmed,
            language_code=language_code or "my-MM"
        )

        return VoiceReplicationResponse(
            success=True,
            voice_session_id=session.session_id,
            expires_at=session.expires_at.isoformat(),
            duration_seconds=session.duration_seconds,
            sample_rate=session.sample_rate,
            message="Voice replication session created successfully."
        )

    except AudioValidationError as ave:
        logger.warning(f"Audio validation failed: {ave}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ave))

    except ValueError as ve:
        logger.warning(f"Input validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    except VoiceReplicationConsentError as ce:
        logger.warning(f"Voice replication consent failed: {ce}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The consent recording could not be verified. Please record the required statement exactly."
        )

    except VoiceReplicationUnavailableError as ue:
        logger.warning(f"Voice replication unavailable: {ue}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voice Replication is not enabled for this Google Cloud project."
        )

    except VoiceReplicationAuthError as ae:
        logger.warning(f"Voice replication authentication error: {ae}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ae)
        )

    except Exception as e:
        logger.error(f"Unexpected error creating voice replication: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice generation failed. Please try again."
        )


@router.get(
    "/session/{session_id}",
    response_model=VoiceSessionStatus,
    summary="Check Voice Replication Session Status"
)
async def check_session_status(session_id: str):
    """Inspect remaining validity and status of a temporary voice replication session."""
    try:
        session = replication_service.get_session(session_id)
        now = datetime.now(timezone.utc)
        remaining = max(0.0, (session.expires_at - now).total_seconds())

        return VoiceSessionStatus(
            voice_session_id=session.session_id,
            is_valid=remaining > 0,
            expires_at=session.expires_at.isoformat(),
            seconds_remaining=round(remaining, 1),
            duration_seconds=session.duration_seconds,
            sample_rate=session.sample_rate
        )
    except VoiceSessionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
