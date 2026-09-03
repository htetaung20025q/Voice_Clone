"""
Credits router.
Provides endpoints to check balance, view transaction ledger history,
and inspect available credit packages.
"""

import logging
from typing import List
from fastapi import APIRouter, Depends

from app.db.models import CreditBalanceResponse, CreditTransactionItem, CreditPackage
from app.db.repository import Repository
from app.services.auth_service import get_current_user
from app.services.payment_service import payment_service

logger = logging.getLogger("burmavoice.routes.credits")
router = APIRouter(prefix="/api/v1/credits", tags=["Credits & Monetization"])


@router.get(
    "",
    response_model=CreditBalanceResponse,
    summary="Get User Credit Balance"
)
async def get_balance(current_user: dict = Depends(get_current_user)):
    """Retrieve the current credit balance and premium entitlement for the authenticated user."""
    balance = Repository.get_credit_balance(current_user["id"])
    return CreditBalanceResponse(
        balance=balance,
        is_premium=bool(current_user.get("is_premium", False)),
        user_id=current_user["id"]
    )


@router.get(
    "/transactions",
    response_model=List[CreditTransactionItem],
    summary="Get Credit Transaction History"
)
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """Retrieve the credit transaction ledger for the current user."""
    transactions = Repository.get_credit_transactions(current_user["id"])
    return [
        CreditTransactionItem(
            id=tx["id"],
            user_id=tx["user_id"],
            amount=tx["amount"],
            type=tx["type"],
            description=tx["description"],
            reference_id=tx.get("reference_id"),
            created_at=str(tx["created_at"])
        )
        for tx in transactions
    ]


@router.get(
    "/packages",
    response_model=List[CreditPackage],
    summary="Get Available Credit Packages"
)
async def get_credit_packages():
    """Return all configured credit purchase packages with pricing and features."""
    return payment_service.get_packages()
