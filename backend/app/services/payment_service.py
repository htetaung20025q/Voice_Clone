"""
Payment architecture service.
Handles credit package definitions, checkout reference generation,
and idempotent payment verification.
"""

import uuid
import logging
from typing import List, Optional, Dict, Any, Tuple

from app.db.models import CreditPackage, CheckoutResponse, VerifyPaymentResponse
from app.db.repository import Repository

logger = logging.getLogger("burmavoice.payment")

# Configurable Credit Packages
CREDIT_PACKAGES: List[CreditPackage] = [
    CreditPackage(
        id="starter",
        name="Starter",
        credits=100,
        price_mmk=5000,
        price_usd=2.99,
        popular=False,
        badge="Starter Pack",
        features=[
            "100 Credits (~100,000 characters)",
            "1 Credit per 1,000 Myanmar chars",
            "Unlocks All Premium Voice Personas",
            "Lossless 24kHz WAV Downloads",
            "Fast Synthesis Queue"
        ],
        unlocks_premium=True
    ),
    CreditPackage(
        id="creator",
        name="Creator",
        credits=500,
        price_mmk=20000,
        price_usd=9.99,
        popular=True,
        badge="Most Popular",
        features=[
            "500 Credits (~500,000 characters)",
            "1 Credit per 1,000 Myanmar chars",
            "Unlocks All 16 Premium Voice Personas",
            "Football, Education & Entertainment Voices",
            "Priority Synthesis Queue",
            "Commercial Usage Rights"
        ],
        unlocks_premium=True
    ),
    CreditPackage(
        id="pro",
        name="Pro Studio",
        credits=1500,
        price_mmk=50000,
        price_usd=24.99,
        popular=False,
        badge="Best Value",
        features=[
            "1,500 Credits (~1,500,000 characters)",
            "Maximum value & lowest cost per credit",
            "Unlocks All Premium Voice Personas",
            "Commercial Broadcasting Rights",
            "Dedicated High-Speed Queue",
            "24/7 Priority Support"
        ],
        unlocks_premium=True
    )
]

PACKAGES_MAP: Dict[str, CreditPackage] = {pkg.id: pkg for pkg in CREDIT_PACKAGES}


class PaymentService:
    """Service managing payment packages, checkouts, and idempotent verification."""

    @staticmethod
    def get_packages() -> List[CreditPackage]:
        """Return all available credit packages."""
        return CREDIT_PACKAGES

    @staticmethod
    def get_package(package_id: str) -> Optional[CreditPackage]:
        """Retrieve a specific package by ID."""
        return PACKAGES_MAP.get(package_id.strip().lower())

    @staticmethod
    def create_checkout(user_id: int, package_id: str) -> CheckoutResponse:
        """Create a pending payment record with a unique reference for checkout."""
        pkg = PaymentService.get_package(package_id)
        if not pkg:
            raise ValueError(f"Invalid package ID: '{package_id}'.")

        payment_ref = f"pay_{uuid.uuid4().hex[:16]}"
        
        Repository.create_payment(
            user_id=user_id,
            package=pkg.name,
            amount=pkg.price_mmk,
            credits=pkg.credits,
            payment_reference=payment_ref,
            status="PENDING"
        )

        return CheckoutResponse(
            payment_reference=payment_ref,
            package_id=pkg.id,
            package_name=pkg.name,
            amount=pkg.price_mmk,
            credits=pkg.credits,
            currency="MMK",
            status="PENDING",
            checkout_url=f"/api/v1/payments/verify?ref={payment_ref}"
        )

    @staticmethod
    def verify_payment(payment_reference: str) -> VerifyPaymentResponse:
        """
        Verify payment and grant credits idempotently.
        Ensures duplicate verification calls or webhooks do not double-credit accounts.
        """
        success, code, payment = Repository.complete_payment_idempotent(payment_reference)

        if code == "NOT_FOUND":
            raise ValueError("Payment reference not found.")

        user_id = payment["user_id"]
        current_balance = Repository.get_credit_balance(user_id)

        if code == "ALREADY_PAID":
            return VerifyPaymentResponse(
                success=True,
                status="PAID",
                payment_reference=payment_reference,
                credits_added=0,
                new_balance=current_balance,
                message="Payment was already processed and verified."
            )

        return VerifyPaymentResponse(
            success=True,
            status="PAID",
            payment_reference=payment_reference,
            credits_added=payment["credits"],
            new_balance=current_balance,
            message=f"Successfully added {payment['credits']} credits to your account!"
        )


payment_service = PaymentService()
