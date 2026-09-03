"""
Admin router providing administrative endpoints for dashboard metrics,
user management, manual credit adjustments, and system activity logs.
Protected by get_current_admin_user.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status

from app.db.models import (
    AdminStatsResponse,
    AdminUserItem,
    AdminAdjustCreditsRequest,
    AdminGenerationItem
)
from app.db.repository import Repository
from app.services.auth_service import get_current_admin_user

logger = logging.getLogger("burmavoice.routes.admin")
router = APIRouter(prefix="/api/v1/admin", tags=["Admin Dashboard"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get Aggregated Platform Statistics"
)
async def get_stats(admin_user: dict = Depends(get_current_admin_user)):
    """Retrieve high-level metrics for dashboard cards."""
    data = Repository.get_admin_stats()
    return AdminStatsResponse(**data)


@router.get(
    "/users",
    response_model=List[AdminUserItem],
    summary="List Registered Users"
)
async def get_users(
    search: Optional[str] = Query(default="", description="Search username or email"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin_user: dict = Depends(get_current_admin_user)
):
    """Retrieve paginated user accounts with credit balances and entitlements."""
    users = Repository.get_admin_users(search=search, limit=limit, offset=offset)
    return [
        AdminUserItem(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            is_premium=u["is_premium"],
            is_admin=u["is_admin"],
            credits_balance=u["credits_balance"],
            created_at=str(u["created_at"])
        )
        for u in users
    ]


@router.post(
    "/users/{user_id}/credits",
    summary="Adjust User Credit Balance"
)
async def adjust_user_credits(
    user_id: int,
    payload: AdminAdjustCreditsRequest,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Manually add or deduct credits for any user."""
    target_user = Repository.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"User ID {user_id} not found."}
        )

    reason = payload.reason or f"Admin adjustment by {admin_user.get('username', 'Admin')}"
    new_balance = Repository.admin_adjust_credits(
        user_id=user_id,
        amount=payload.amount,
        reason=reason
    )

    return {
        "success": True,
        "user_id": user_id,
        "amount_adjusted": payload.amount,
        "new_balance": new_balance,
        "message": f"Adjusted {payload.amount} credits for user '{target_user['username']}'. New balance is {new_balance}."
    }


@router.post(
    "/users/{user_id}/toggle-premium",
    summary="Toggle User Premium Entitlement"
)
async def toggle_user_premium(
    user_id: int,
    admin_user: dict = Depends(get_current_admin_user)
):
    """Grant or revoke premium status for a user."""
    target_user = Repository.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": f"User ID {user_id} not found."}
        )

    new_premium_state = not target_user["is_premium"]
    Repository.set_user_premium(user_id, is_premium=new_premium_state)

    return {
        "success": True,
        "user_id": user_id,
        "is_premium": new_premium_state,
        "message": f"User '{target_user['username']}' premium status set to {new_premium_state}."
    }


@router.get(
    "/generations",
    response_model=List[AdminGenerationItem],
    summary="Get Recent Platform Audio Generations"
)
async def get_generations(
    limit: int = Query(default=30, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """Retrieve recent TTS synthesis log across the entire platform."""
    gens = Repository.get_admin_recent_generations(limit=limit)
    return [
        AdminGenerationItem(
            id=g["id"],
            user_id=g["user_id"],
            username=g.get("username"),
            voice=g["voice"],
            style=g["style"],
            text=g["text"][:120] + ("..." if len(g["text"]) > 120 else ""),
            credits_used=g["credits_used"],
            status=g["status"],
            created_at=str(g["created_at"])
        )
        for g in gens
    ]
