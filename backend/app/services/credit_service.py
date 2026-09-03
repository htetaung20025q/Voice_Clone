"""
Credit calculation and balance management service.
Centralizes character-to-credit conversion, balance checking, and atomic usage deductions.
"""

import math
import logging
from typing import Tuple, Dict, Any, Optional

from app.db.repository import Repository

logger = logging.getLogger("burmavoice.credits")

# Configurable character threshold per 1 credit (up to 1,000 Myanmar characters)
CHARS_PER_CREDIT = 1000
WELCOME_FREE_CREDITS = 5


def calculate_required_credits(text: str, chars_per_credit: int = CHARS_PER_CREDIT) -> int:
    """
    Calculate required credits based on character count.
    - 1 to 1,000 chars = 1 credit
    - 1,001 to 2,000 chars = 2 credits
    - Empty text = 0 credits
    """
    cleaned = text.strip()
    if not cleaned:
        return 0
    length = len(cleaned)
    return max(1, math.ceil(length / chars_per_credit))


class CreditService:
    """Service handling credit calculations and balance transactions."""

    @staticmethod
    def get_balance(user_id: int) -> int:
        """Fetch current balance for user."""
        return Repository.get_credit_balance(user_id)

    @staticmethod
    def check_has_credits(user_id: int, required_credits: int) -> Tuple[bool, int]:
        """Check if user has sufficient credits without deducting."""
        balance = Repository.get_credit_balance(user_id)
        return balance >= required_credits, balance

    @staticmethod
    def deduct_tts_credits(
        user_id: int,
        credits_used: int,
        generation_id: Optional[int] = None
    ) -> Tuple[bool, int]:
        """
        Atomically deduct credits for a successful TTS synthesis.
        Returns (success: bool, new_balance: int).
        """
        if credits_used <= 0:
            return True, Repository.get_credit_balance(user_id)

        desc = f"TTS Generation ({credits_used} credit{'s' if credits_used > 1 else ''})"
        ref = f"gen_{generation_id}" if generation_id else None
        return Repository.deduct_credits_atomic(
            user_id=user_id,
            amount=credits_used,
            tx_type="TTS_USAGE",
            description=desc,
            reference_id=ref
        )

    @staticmethod
    def add_purchase_credits(
        user_id: int,
        amount: int,
        package_name: str,
        payment_reference: str
    ) -> int:
        """Add credits after verified purchase."""
        desc = f"Purchased {package_name} ({amount} credits)"
        return Repository.add_credits_atomic(
            user_id=user_id,
            amount=amount,
            tx_type="PURCHASE",
            description=desc,
            reference_id=payment_reference
        )


credit_service = CreditService()
