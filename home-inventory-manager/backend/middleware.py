from functools import wraps
from flask import request, jsonify
from services.auth_service import verify_token


def login_required(f):
    """登录验证装饰器——用于需要认证的 API"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "请先登录"}), 401
        payload = verify_token(token)
        if not payload:
            return jsonify({"success": False, "error": "登录已过期，请重新登录"}), 401
        # 将用户信息注入请求上下文
        request.current_user = payload
        return f(*args, **kwargs)

    return decorated
