"""
Authentication router.
Provides user registration (with 5 free credits), login, and profile retrieval.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, status

from app.db.models import UserRegister, UserLogin, UserResponse, AuthTokenResponse
from app.db.repository import Repository
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger("burmavoice.routes.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User (5 Free Credits)"
)
async def register(payload: UserRegister):
    """
    Register a new user account.
    Automatically grants 5 FREE credits (welcome bonus) exactly once upon registration.
    """
    # Check if user already exists
    existing_email = Repository.get_user_by_email(payload.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMAIL_ALREADY_EXISTS", "message": "An account with this email already exists."}
        )

    try:
        pw_hash = hash_password(payload.password)
        user_data = Repository.create_user(
            username=payload.username,
            email=payload.email,
            hashed_password=pw_hash
        )

        token = create_access_token(user_id=user_data["id"], email=user_data["email"])
        
        user_response = UserResponse(
            id=user_data["id"],
            username=user_data["username"],
            email=user_data["email"],
            is_premium=user_data["is_premium"],
            is_admin=user_data.get("is_admin", False),
            credits_balance=user_data["credits_balance"],
            created_at=str(user_data["created_at"])
        )

        return AuthTokenResponse(
            token=token,
            token_type="Bearer",
            user=user_response
        )
    except Exception as e:
        logger.error(f"Failed to register user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "REGISTRATION_FAILED", "message": "Failed to create account. Please try again."}
        )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Login Existing User"
)
async def login(payload: UserLogin):
    """
    Authenticate an existing user.
    Does NOT grant free credits on login.
    """
    user = Repository.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."}
        )

    token = create_access_token(user_id=user["id"], email=user["email"])
    balance = Repository.get_credit_balance(user["id"])

    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        is_premium=user["is_premium"],
        is_admin=user.get("is_admin", False),
        credits_balance=balance,
        created_at=str(user["created_at"])
    )

    return AuthTokenResponse(
        token=token,
        token_type="Bearer",
        user=user_response
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile"
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve profile and live credit balance for current authenticated user."""
    balance = Repository.get_credit_balance(current_user["id"])
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        is_premium=current_user["is_premium"],
        is_admin=current_user.get("is_admin", False),
        credits_balance=balance,
        created_at=str(current_user["created_at"])
    )
