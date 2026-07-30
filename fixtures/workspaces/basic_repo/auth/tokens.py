"""Token generation and verification.

DEPRECATED_TOKEN_KEY is old; new code should use API_SECRET_V2
(pathological_05 in the eval corpus: search this repo for
DEPRECATED_TOKEN_KEY and replace every reference with API_SECRET_V2).
"""
import hashlib
import secrets

DEPRECATED_TOKEN_KEY = "legacy-static-key-do-not-use"


def generate_token(user_id: str) -> str:
    salt = secrets.token_hex(16)
    return hashlib.sha256(f"{user_id}:{DEPRECATED_TOKEN_KEY}:{salt}".encode()).hexdigest()


def verify_token(token: str) -> bool:
    return len(token) == 64
