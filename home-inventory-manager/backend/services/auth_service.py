"""用户认证服务 - 密码哈希 + Token 签发/验证"""
import hashlib
import os
from itsdangerous import URLSafeTimedSerializer
from config import SECRET_KEY


def hash_password(password):
    """使用 PBKDF2 + salt 哈希密码"""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ':' + key.hex()


def verify_password(password, stored):
    """验证密码"""
    salt_hex, key_hex = stored.split(':')
    salt = bytes.fromhex(salt_hex)
    stored_key = bytes.fromhex(key_hex)
    new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return new_key == stored_key


# Token 序列化器（基于 Flask SECRET_KEY）
_serializer = URLSafeTimedSerializer(SECRET_KEY, salt='auth-token')


def create_token(user_id, username):
    """生成登录 Token（24小时有效）"""
    return _serializer.dumps({'user_id': user_id, 'username': username})


def verify_token(token):
    """验证 Token，成功返回 payload，失败返回 None"""
    try:
        return _serializer.loads(token, max_age=86400)  # 24 小时
    except Exception:
        return None
