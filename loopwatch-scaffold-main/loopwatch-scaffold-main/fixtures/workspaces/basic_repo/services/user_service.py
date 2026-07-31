"""User service -- auth, lookups, profile management."""

import hashlib

class User:
    def __init__(self, user_id, email, password):
        self.user_id = user_id
        self.email = email
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()

_USERS = {}

def create_user(user_id, email, password):
    _USERS[user_id] = User(user_id, email, password)
    return _USERS[user_id]

def get_user(user_id):
    return _USERS.get(user_id)

def authenticate(user_id, password):
    user = get_user(user_id)
    if not user:
        return False
    return user.password_hash == hashlib.sha256(password.encode()).hexdigest()

def list_active_users():
    return list(_USERS.values())

def update_email(user_id, new_email):
    user = get_user(user_id)
    if user:
        user.email = new_email
        return True
    return False