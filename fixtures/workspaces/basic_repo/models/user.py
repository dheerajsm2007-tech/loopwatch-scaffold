"""User model and query helpers."""


class User:
    def __init__(self, user_id, email):
        self.user_id = user_id
        self.email = email


_USERS = {}


def get_active_users():
    # TODO (productive_07): add is_deleted field + soft_delete() method
    # on User, and filter soft-deleted users out here
    return list(_USERS.values())
