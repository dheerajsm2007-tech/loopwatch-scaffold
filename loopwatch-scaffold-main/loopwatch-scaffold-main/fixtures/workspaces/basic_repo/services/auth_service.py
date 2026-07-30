"""Authentication and JWT token verification service."""
import hashlib
import time

_TOKEN_EXPIRY = 3600

def generate_token(user_id: str, secret: str) -> str:
    timestamp = str(int(time.time()))
    raw = f"{user_id}:{timestamp}:{secret}"
    signature = hashlib.sha256(raw.encode()).hexdigest()
    return f"{user_id}.{timestamp}.{signature[:16]}"

def verify_token(token: str, secret: str) -> bool:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False
        user_id, timestamp, signature = parts
        if time.time() - int(timestamp) > _TOKEN_EXPIRY:
            return False
        expected_raw = f"{user_id}:{timestamp}:{secret}"
        expected_sig = hashlib.sha256(expected_raw.encode()).hexdigest()[:16]
        return signature == expected_sig
    except Exception:
        return False
