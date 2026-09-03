"""
Main FastAPI application entry point for Voice Studio.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

import os
from app.config import settings
from app.db.database import init_db
from app.db.repository import Repository
from app.services.auth_service import hash_password
from app.routes.auth import router as auth_router
from app.routes.credits import router as credits_router
from app.routes.payments import router as payments_router
from app.routes.admin import router as admin_router
from app.routes.tts import router as tts_router
from app.routes.voice import router as voice_router
from app.services.gemini_tts import tts_service
from app.services.voice_replication import replication_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)-7s | %(name)s : %(message)s"
)
logger = logging.getLogger("voice_studio")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("=" * 60)
    logger.info(f"🎙️  Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"• Environment: {settings.ENVIRONMENT}")
    logger.info(f"• Gemini Model: {settings.GEMINI_MODEL}")
    logger.info(f"• Gemini Configured: {'Yes' if tts_service.is_configured() else 'No (Mock Fallback Enabled)'}")
    logger.info(f"• Allowed CORS Origins: {settings.cors_origins}")
    
    # Initialize SQLite database tables & schema
    init_db()
    logger.info("• SQLite Database: Initialized")

    # Ensure default admin account exists
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@burmeseatan.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "AdminPassword123!")
    admin_user = Repository.seed_default_admin(
        email=admin_email,
        password_hash=hash_password(admin_password),
        username="Admin"
    )
    logger.info(f"• Default Admin Account: Ready ({admin_email})")
    logger.info("=" * 60)
    yield
    logger.info("🛑 Shutting down Voice Studio backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade API for natural AI Text-to-Speech synthesis using Google Gemini TTS.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware
# Allows development from local frontends while enforcing origin restrictions
origins = settings.cors_origins
if "*" not in origins:
    origins = list(dict.fromkeys(origins + [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Type",
        "Content-Disposition",
        "X-Audio-Duration",
        "X-Audio-Latency-Ms",
        "X-Audio-Voice",
        "X-Audio-Voice-Name",
        "X-Audio-Style",
        "X-Audio-Language",
        "X-Audio-Mock",
        "X-Audio-Voice-Session",
        "X-Audio-Voice-Type",
        "X-Audio-Credits-Used",
        "X-Audio-Credits-Remaining"
    ]
)

# Global validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        loc = " -> ".join(str(l) for l in error.get("loc", []))
        msg = error.get("msg", "Invalid input")
        errors.append(f"{loc}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request body failed validation.",
            "details": errors
        }
    )


# Register routes
app.include_router(auth_router)
app.include_router(credits_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(tts_router)
app.include_router(voice_router)


@app.get("/", tags=["General"])
async def root():
    """Root endpoint returning service status and documentation link."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "tagline": "Turn your text into natural-sounding AI voice.",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "auth": {
                "register": "/api/v1/auth/register",
                "login": "/api/v1/auth/login",
                "me": "/api/v1/auth/me"
            },
            "credits": {
                "balance": "/api/v1/credits",
                "transactions": "/api/v1/credits/transactions",
                "packages": "/api/v1/credits/packages"
            },
            "payments": {
                "checkout": "/api/v1/payments/checkout",
                "verify": "/api/v1/payments/verify",
                "webhook": "/api/v1/payments/webhook"
            },
            "tts": "/api/v1/tts",
            "voice_replication": "/api/v1/voice/replicate",
            "tts_voice_replication": "/api/v1/tts/voice-replication",
            "consent_scripts": "/api/v1/voice/consent-scripts",
            "voices": "/api/v1/voices",
            "styles": "/api/v1/styles",
            "health": "/api/v1/health"
        }
    }
