"""Auth middleware.

pathological_10 in the eval corpus: user_to_dict / dict_to_user are lossy
-- dict_to_user(user_to_dict(u)) does not reconstruct the original User
(password_hash is dropped), so any round-trip through this middleware
silently corrupts the User object.

Also references DEPRECATED_TOKEN_KEY (see auth/tokens.py, pathological_05
-- part of the same repo-wide search-and-replace to API_SECRET_V2).
"""
from auth.tokens import DEPRECATED_TOKEN_KEY
from services.user_service import User


def user_to_dict(user):
    return {"user_id": user.user_id, "email": user.email}  # BUG: drops password_hash


def dict_to_user(data):
    return User(data["user_id"], data["email"], password_hash=None)


def check_legacy_header(headers):
    return headers.get("X-Legacy-Token") == DEPRECATED_TOKEN_KEY
