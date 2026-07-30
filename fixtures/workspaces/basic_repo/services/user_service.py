"""User service -- auth, lookups, profile management."""
import hashlib


class User:
    def __init__(self, user_id, email, password_hash):
        self.user_id = user_id
        self.email = email
        self.password_hash = password_hash


_USERS = {}


def create_user(user_id, email, password):
    # NOTE (productive_09): plain sha256, no salt -- add salted hashing here
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    _USERS[user_id] = User(user_id, email, password_hash)
    return _USERS[user_id]


def get_user(user_id):
    return _USERS.get(user_id)


def authenticate(user_id, password):
    user = get_user(user_id)
    if user is None:
        return False
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return user.password_hash == password_hash


def list_active_users():
    return list(_USERS.values())


def update_email(user_id, new_email):
    user = get_user(user_id)
    if user:
        user.email = new_email
def deactivate_user(user_id
    # pathological_04: syntax error on this line (42) -- missing closing paren above
    if user_id in _USERS:
        del _USERS[user_id]
