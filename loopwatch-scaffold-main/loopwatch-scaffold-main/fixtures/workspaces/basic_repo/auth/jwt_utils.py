from typing import Dict
import jwt
from auth.tokens import SECRET_KEY
from models.user import User


def generate_token(user_id: int) -> str:
    payload = {'user_id': user_id}
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(encoded_token: str) -> Dict[str, any]:
    try:
        payload = jwt.decode(encoded_token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        return {'user_id': user_id}
    except jwt.ExpiredSignatureError:
        return {}
    except jwt.InvalidTokenError:
        return {}}