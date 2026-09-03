"""
Payment processing router.
Handles checkout session creation, idempotent payment verification, and webhooks.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, status

from app.db.models import (
    CheckoutRequest,
    CheckoutResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    PaymentWebhookPayload
)
from app.services.auth_service import get_current_user
from app.services.payment_service import payment_service

logger = logging.getLogger("burmavoice.routes.payments")
router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Checkout"])


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    summary="Initiate Credit Package Checkout"
)
async def checkout(
    payload: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a pending payment checkout session for purchasing a credit package."""
    try:
        return payment_service.create_checkout(
            user_id=current_user["id"],
            package_id=payload.package_id
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PACKAGE", "message": str(ve)}
        )


@router.post(
    "/verify",
    response_model=VerifyPaymentResponse,
    summary="Verify Payment and Grant Credits (Idempotent)"
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify payment completion and add purchased credits to user account.
    Guaranteed idempotent: multiple calls with the same payment reference
    will never grant duplicate credits.
    """
    try:
        return payment_service.verify_payment(payload.payment_reference)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PAYMENT_NOT_FOUND", "message": str(ve)}
        )


@router.post(
    "/webhook",
    summary="Payment Provider Webhook Endpoint"
)
async def payment_webhook(payload: PaymentWebhookPayload):
    """
    Webhook receiver for payment gateway callbacks.
    Applies idempotent verification on incoming reference.
    """
    if payload.status.upper() == "PAID":
        try:
            res = payment_service.verify_payment(payload.payment_reference)
            return {"status": "success", "detail": res.message}
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return {"status": "error", "message": str(e)}

    return {"status": "ignored", "message": f"Status '{payload.status}' does not grant credits."}
