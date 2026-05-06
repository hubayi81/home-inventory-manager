from flask import Blueprint, request, jsonify
from models import query, insert, execute
from services.auth_service import hash_password, verify_password, create_token, verify_token

bp = Blueprint('auth', __name__)


def _get_current_user():
    """从请求头获取当前登录用户"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    rows = query("SELECT id, username, created_at FROM users WHERE id = %s", (payload['user_id'],))
    return rows[0] if rows else None


@bp.route('/api/auth/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or len(username) < 2:
        return jsonify({"success": False, "error": "用户名至少 2 个字符"}), 400
    if not password or len(password) < 4:
        return jsonify({"success": False, "error": "密码至少 4 个字符"}), 400

    existing = query("SELECT id FROM users WHERE username = %s", (username,))
    if existing:
        return jsonify({"success": False, "error": "该用户名已被注册"}), 400

    pw_hash = hash_password(password)
    user_id = insert("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, pw_hash))
    token = create_token(user_id, username)

    return jsonify({
        "success": True,
        "data": {"user_id": user_id, "username": username, "token": token}
    }), 201


@bp.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({"success": False, "error": "请输入用户名和密码"}), 400

    user = query("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        return jsonify({"success": False, "error": "用户名或密码错误"}), 401

    if not verify_password(password, user[0]['password_hash']):
        return jsonify({"success": False, "error": "用户名或密码错误"}), 401

    token = create_token(user[0]['id'], user[0]['username'])
    return jsonify({
        "success": True,
        "data": {"user_id": user[0]['id'], "username": user[0]['username'], "token": token}
    })


@bp.route('/api/auth/me', methods=['GET'])
def me():
    """获取当前用户信息"""
    user = _get_current_user()
    if not user:
        return jsonify({"success": False, "error": "未登录或 Token 已过期"}), 401

    return jsonify({"success": True, "data": user})
