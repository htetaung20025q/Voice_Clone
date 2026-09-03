"""
Database repository providing atomic transactional data operations.
Guarantees ACID transactions, idempotency, and concurrency safety.
"""

import sqlite3
import logging
from typing import Optional, List, Dict, Any, Tuple
from app.db.database import get_db_connection, get_db_context

logger = logging.getLogger("burmavoice.repository")


class Repository:
    """Central repository for data access operations."""

    # ==========================================
    # 1. User Operations
    # ==========================================

    @staticmethod
    def create_user(
        username: str,
        email: str,
        hashed_password: str,
        is_admin: bool = False,
        is_premium: bool = False,
        initial_credits: int = 5
    ) -> Dict[str, Any]:
        """
        Create a new user, initialize their credit account, and atomically grant
        welcome credits with a ledger transaction.
        """
        with get_db_context() as conn:
            cursor = conn.cursor()

            # 1. Create user
            cursor.execute(
                """
                INSERT INTO users (username, email, hashed_password, is_premium, is_admin)
                VALUES (?, ?, ?, ?, ?);
                """,
                (username.strip(), email.strip().lower(), hashed_password, 1 if is_premium else 0, 1 if is_admin else 0)
            )
            user_id = cursor.lastrowid

            # 2. Initialize credit account
            cursor.execute(
                """
                INSERT INTO credits (user_id, balance)
                VALUES (?, ?);
                """,
                (user_id, initial_credits)
            )

            # 3. Create initial ledger transaction
            tx_type = "ADMIN_ADJUSTMENT" if is_admin else "FREE_CREDIT"
            tx_desc = "Admin initialization" if is_admin else "Welcome bonus (5 free credits)"
            cursor.execute(
                """
                INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, ?, ?, 'initial_grant');
                """,
                (user_id, initial_credits, tx_type, tx_desc)
            )

            # Fetch created user record
            cursor.execute("SELECT id, username, email, is_premium, is_admin, created_at FROM users WHERE id = ?;", (user_id,))
            user_row = cursor.fetchone()
            user_dict = dict(user_row)
            user_dict["is_premium"] = bool(user_dict["is_premium"])
            user_dict["is_admin"] = bool(user_dict.get("is_admin", 0))
            user_dict["credits_balance"] = initial_credits
            return user_dict

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Fetch user by email address."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.id, u.username, u.email, u.hashed_password, u.is_premium, u.is_admin, u.created_at,
                       COALESCE(c.balance, 0) as credits_balance
                FROM users u
                LEFT JOIN credits c ON u.id = c.user_id
                WHERE LOWER(u.email) = ?;
                """,
                (email.strip().lower(),)
            )
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["is_premium"] = bool(data["is_premium"])
            data["is_admin"] = bool(data.get("is_admin", 0))
            return data

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """Fetch user by ID."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.id, u.username, u.email, u.is_premium, u.is_admin, u.created_at,
                       COALESCE(c.balance, 0) as credits_balance
                FROM users u
                LEFT JOIN credits c ON u.id = c.user_id
                WHERE u.id = ?;
                """,
                (user_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            data["is_premium"] = bool(data["is_premium"])
            data["is_admin"] = bool(data.get("is_admin", 0))
            return data

    @staticmethod
    def set_user_premium(user_id: int, is_premium: bool = True) -> bool:
        """Update user premium status."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET is_premium = ? WHERE id = ?;",
                (1 if is_premium else 0, user_id)
            )
            return cursor.rowcount > 0

    # ==========================================
    # 2. Credit Operations
    # ==========================================

    @staticmethod
    def get_credit_balance(user_id: int) -> int:
        """Get the current balance for a user."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT balance FROM credits WHERE user_id = ?;", (user_id,))
            row = cursor.fetchone()
            if row:
                return int(row["balance"])
            return 0

    @staticmethod
    def get_credit_transactions(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch user credit transaction history."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, user_id, amount, type, description, reference_id, created_at
                FROM credit_transactions
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT ?;
                """,
                (user_id, limit)
            )
            return [dict(r) for r in cursor.fetchall()]

    @staticmethod
    def add_credits_atomic(
        user_id: int,
        amount: int,
        tx_type: str,
        description: str,
        reference_id: Optional[str] = None
    ) -> int:
        """
        Atomically add credits to a user's account and log a transaction record.
        Returns the updated balance.
        """
        if amount <= 0:
            raise ValueError("Amount to add must be positive.")

        with get_db_context() as conn:
            cursor = conn.cursor()

            # Ensure credit account exists
            cursor.execute(
                """
                INSERT INTO credits (user_id, balance)
                VALUES (?, 0)
                ON CONFLICT(user_id) DO NOTHING;
                """,
                (user_id,)
            )

            # Atomically update balance
            cursor.execute(
                """
                UPDATE credits
                SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?;
                """,
                (amount, user_id)
            )

            # Insert transaction
            cursor.execute(
                """
                INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, ?, ?, ?);
                """,
                (user_id, amount, tx_type, description, reference_id)
            )

            # Get new balance
            cursor.execute("SELECT balance FROM credits WHERE user_id = ?;", (user_id,))
            new_balance = int(cursor.fetchone()["balance"])
            return new_balance

    @staticmethod
    def deduct_credits_atomic(
        user_id: int,
        amount: int,
        tx_type: str = "TTS_USAGE",
        description: str = "TTS generation",
        reference_id: Optional[str] = None
    ) -> Tuple[bool, int]:
        """
        Atomically deduct credits only if the balance is sufficient (balance >= amount).
        Guarantees that balance never drops below zero.
        Returns (success: bool, new_balance: int).
        """
        if amount <= 0:
            return True, Repository.get_credit_balance(user_id)

        with get_db_context() as conn:
            cursor = conn.cursor()

            # Attempt atomic decrement with conditional check
            cursor.execute(
                """
                UPDATE credits
                SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND balance >= ?;
                """,
                (amount, user_id, amount)
            )

            if cursor.rowcount == 0:
                # Failed check: insufficient credits or user not found
                cursor.execute("SELECT balance FROM credits WHERE user_id = ?;", (user_id,))
                row = cursor.fetchone()
                current_balance = int(row["balance"]) if row else 0
                return False, current_balance

            # Log negative transaction (-amount)
            cursor.execute(
                """
                INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, ?, ?, ?);
                """,
                (user_id, -amount, tx_type, description, reference_id)
            )

            cursor.execute("SELECT balance FROM credits WHERE user_id = ?;", (user_id,))
            new_balance = int(cursor.fetchone()["balance"])
            return True, new_balance

    # ==========================================
    # 3. Generation Operations
    # ==========================================

    @staticmethod
    def create_generation(
        user_id: int,
        voice: str,
        style: str,
        text: str,
        credits_used: int = 0,
        status: str = "PENDING"
    ) -> int:
        """Create a new generation record."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO generations (user_id, voice, style, text, credits_used, status)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (user_id, voice, style, text, credits_used, status)
            )
            return cursor.lastrowid

    @staticmethod
    def update_generation(
        generation_id: int,
        status: str,
        audio_url: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> None:
        """Update generation status, URL, or error."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE generations
                SET status = ?, audio_url = ?, error_message = ?
                WHERE id = ?;
                """,
                (status, audio_url, error_message, generation_id)
            )

    @staticmethod
    def get_user_generations(user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Get past generations for a user."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, user_id, voice, style, text, audio_url, credits_used, status, error_message, created_at
                FROM generations
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT ?;
                """,
                (user_id, limit)
            )
            return [dict(r) for r in cursor.fetchall()]

    # ==========================================
    # 4. Payment Operations
    # ==========================================

    @staticmethod
    def create_payment(
        user_id: int,
        package: str,
        amount: int,
        credits: int,
        payment_reference: str,
        status: str = "PENDING"
    ) -> Dict[str, Any]:
        """Create a pending payment record."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO payments (user_id, package, amount, credits, status, payment_reference)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (user_id, package, amount, credits, status, payment_reference)
            )
            payment_id = cursor.lastrowid
            cursor.execute("SELECT * FROM payments WHERE id = ?;", (payment_id,))
            return dict(cursor.fetchone())

    @staticmethod
    def get_payment_by_reference(payment_reference: str) -> Optional[Dict[str, Any]]:
        """Fetch payment record by its unique reference."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM payments WHERE payment_reference = ?;",
                (payment_reference,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def complete_payment_idempotent(payment_reference: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Verify and complete payment with strict idempotency protection.
        - If payment is already 'PAID', returns (False, 'ALREADY_PAID', payment).
        - If payment is 'PENDING', atomically sets to 'PAID', grants credits, unlocks premium voices,
          and creates a 'PURCHASE' transaction.
        Returns (success: bool, code: str, payment_record: Optional[dict]).
        """
        with get_db_context() as conn:
            cursor = conn.cursor()

            # 1. Fetch payment
            cursor.execute("SELECT * FROM payments WHERE payment_reference = ?;", (payment_reference,))
            row = cursor.fetchone()
            if not row:
                return False, "NOT_FOUND", None

            payment = dict(row)

            # 2. Idempotency check: Already processed
            if payment["status"] == "PAID":
                return False, "ALREADY_PAID", payment

            user_id = payment["user_id"]
            credits_to_add = payment["credits"]
            pkg_name = payment["package"]

            # 3. Mark payment as PAID
            cursor.execute(
                "UPDATE payments SET status = 'PAID' WHERE id = ?;",
                (payment["id"],)
            )

            # 4. Add credits to user's balance
            cursor.execute(
                """
                UPDATE credits
                SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?;
                """,
                (credits_to_add, user_id)
            )

            # 5. Log PURCHASE transaction
            cursor.execute(
                """
                INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
                VALUES (?, ?, 'PURCHASE', ?, ?);
                """,
                (user_id, credits_to_add, f"Purchased {pkg_name} ({credits_to_add} credits)", payment_reference)
            )

            # 6. Unlock premium voices entitlement
            cursor.execute(
                "UPDATE users SET is_premium = 1 WHERE id = ?;",
                (user_id,)
            )

            # Fetch updated payment
            cursor.execute("SELECT * FROM payments WHERE id = ?;", (payment["id"],))
            updated_payment = dict(cursor.fetchone())
            return True, "SUCCESS", updated_payment

    # ==========================================
    # 5. Admin Operations
    # ==========================================

    @staticmethod
    def seed_default_admin(email: str, password_hash: str, username: str = "Admin") -> Dict[str, Any]:
        """Ensure a default admin account exists with full privileges."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE is_admin = 1 LIMIT 1;")
            existing = cursor.fetchone()
            if existing:
                return Repository.get_user_by_id(existing["id"])

        # Check if email is registered but not admin
        existing_user = Repository.get_user_by_email(email)
        if existing_user:
            with get_db_context() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET is_admin = 1, is_premium = 1 WHERE id = ?;", (existing_user["id"],))
            Repository.add_credits_atomic(existing_user["id"], 99999, "ADMIN_ADJUSTMENT", "Admin Initial Grant")
            return Repository.get_user_by_id(existing_user["id"])

        # Create new default admin user
        return Repository.create_user(
            username=username,
            email=email,
            hashed_password=password_hash,
            is_admin=True,
            is_premium=True,
            initial_credits=99999
        )

    @staticmethod
    def get_admin_stats() -> Dict[str, Any]:
        """Compute aggregated platform statistics for admin dashboard."""
        with get_db_context() as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) as total FROM users;")
            total_users = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) as total FROM generations;")
            total_generations = cursor.fetchone()["total"]

            cursor.execute("SELECT COALESCE(SUM(balance), 0) as total FROM credits;")
            total_credits_balance = cursor.fetchone()["total"]

            cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'PAID';")
            total_revenue = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) as total FROM payments WHERE status = 'PAID';")
            total_payments = cursor.fetchone()["total"]

            return {
                "total_users": int(total_users),
                "total_generations": int(total_generations),
                "total_credits_balance": int(total_credits_balance),
                "total_revenue_mmk": int(total_revenue),
                "total_payments_count": int(total_payments)
            }

    @staticmethod
    def get_admin_users(search: str = "", limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Fetch user accounts with credit balances for admin inspection."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            query = """
                SELECT u.id, u.username, u.email, u.is_premium, u.is_admin, u.created_at,
                       COALESCE(c.balance, 0) as credits_balance
                FROM users u
                LEFT JOIN credits c ON u.id = c.user_id
            """
            params = []
            if search.strip():
                query += " WHERE LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?"
                term = f"%{search.strip().lower()}%"
                params.extend([term, term])

            query += " ORDER BY u.id DESC LIMIT ? OFFSET ?;"
            params.extend([limit, offset])

            cursor.execute(query, tuple(params))
            users = []
            for r in cursor.fetchall():
                d = dict(r)
                d["is_premium"] = bool(d["is_premium"])
                d["is_admin"] = bool(d["is_admin"])
                users.append(d)
            return users

    @staticmethod
    def admin_adjust_credits(user_id: int, amount: int, reason: str = "Admin Manual Adjustment") -> int:
        """Manually grant or deduct credits for any user."""
        if amount >= 0:
            return Repository.add_credits_atomic(
                user_id=user_id,
                amount=amount,
                tx_type="ADMIN_ADJUSTMENT",
                description=reason,
                reference_id="admin_manual"
            )
        else:
            # Deduction
            abs_amount = abs(amount)
            ok, new_bal = Repository.deduct_credits_atomic(
                user_id=user_id,
                amount=abs_amount,
                tx_type="ADMIN_ADJUSTMENT",
                description=reason,
                reference_id="admin_manual"
            )
            return new_bal

    @staticmethod
    def get_admin_recent_generations(limit: int = 30) -> List[Dict[str, Any]]:
        """Fetch latest TTS synthesis activities across all users."""
        with get_db_context() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT g.id, g.user_id, u.username, g.voice, g.style, g.text, g.credits_used, g.status, g.created_at
                FROM generations g
                LEFT JOIN users u ON g.user_id = u.id
                ORDER BY g.id DESC
                LIMIT ?;
                """,
                (limit,)
            )
            return [dict(r) for r in cursor.fetchall()]
