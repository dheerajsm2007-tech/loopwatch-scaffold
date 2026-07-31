import unittest
from auth.jwt_utils import generate_token, decode_token

class TestJWTUtils(unittest.TestCase):
    def test_generate_and_decode_token(self):
        user_id = 1234567890
        secret_key = 'my_secret_key'
        token = generate_token(user_id)
        decoded_user_id = decode_token(token, secret_key)['user_id']
        self.assertEqual(decoded_user_id, user_id)

    def test_decode_invalid_token(self):
        try:
            invalid_token = 'not_a_valid_token_123'
            decode_token(invalid_token)
        except jwt.ExpiredSignatureError or jwt.InvalidTokenError:
            pass
        else:
            self.fail('Expected ExpiredSignatureError or InvalidTokenError')

if __name__ == '__main__':
    unittest.main()