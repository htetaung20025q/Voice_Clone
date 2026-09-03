"""
Database models and Pydantic schemas for users, credits, transactions, generations, and payments.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ==========================================
# 1. User Models
# ==========================================

class UserRegister(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format.")
        return v


class UserLogin(BaseModel):
    email: str = Field(..., min_length=5, max_length=100)
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format.")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_premium: bool
    is_admin: bool = False
    credits_balance: int
    created_at: str


class AuthTokenResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    user: UserResponse


# ==========================================
# 2. Credit Models
# ==========================================

class CreditAccount(BaseModel):
    id: int
    user_id: int
    balance: int
    created_at: str
    updated_at: str


class CreditBalanceResponse(BaseModel):
    balance: int
    is_premium: bool
    user_id: int


class CreditTransactionItem(BaseModel):
    id: int
    user_id: int
    amount: int
    type: str  # FREE_CREDIT, PURCHASE, TTS_USAGE, REFUND, ADMIN_ADJUSTMENT
    description: str
    reference_id: Optional[str] = None
    created_at: str


# ==========================================
# 3. Generation Models
# ==========================================

class GenerationRecord(BaseModel):
    id: int
    user_id: int
    voice: str
    style: str
    text: str
    audio_url: Optional[str] = None
    credits_used: int
    status: str  # PENDING, SUCCESS, FAILED
    error_message: Optional[str] = None
    created_at: str


# ==========================================
# 4. Payment & Package Models
# ==========================================

class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    price_mmk: int
    price_usd: float
    popular: bool = False
    badge: Optional[str] = None
    features: List[str]
    unlocks_premium: bool = True


class CheckoutRequest(BaseModel):
    package_id: str


class CheckoutResponse(BaseModel):
    payment_reference: str
    package_id: str
    package_name: str
    amount: int
    credits: int
    currency: str = "MMK"
    status: str = "PENDING"
    checkout_url: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    payment_reference: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    status: str
    payment_reference: str
    credits_added: int
    new_balance: int
    message: str


class PaymentWebhookPayload(BaseModel):
    payment_reference: str
    status: str  # PAID, FAILED, CANCELLED
    amount: Optional[int] = None
    signature: Optional[str] = None


# ==========================================
# 5. Admin Models
# ==========================================

class AdminStatsResponse(BaseModel):
    total_users: int
    total_generations: int
    total_credits_balance: int
    total_revenue_mmk: int
    total_payments_count: int


class AdminUserItem(BaseModel):
    id: int
    username: str
    email: str
    is_premium: bool
    is_admin: bool
    credits_balance: int
    created_at: str


class AdminAdjustCreditsRequest(BaseModel):
    amount: int = Field(..., description="Amount of credits to add (positive) or deduct (negative)")
    reason: Optional[str] = Field(default="Admin Manual Adjustment")


class AdminGenerationItem(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    voice: str
    style: str
    text: str
    credits_used: int
    status: str
    created_at: str
