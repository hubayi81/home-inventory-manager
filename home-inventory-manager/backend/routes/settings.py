from flask import Blueprint, request, jsonify
from models import query, execute

bp = Blueprint('settings', __name__)


@bp.route('/api/settings', methods=['GET'])
def get_settings():
    """获取所有设置项"""
    rows = query("SELECT `key`, value FROM settings")
    data = {r['key']: r['value'] for r in rows}
    return jsonify({"success": True, "data": data})


@bp.route('/api/settings', methods=['PUT'])
def update_settings():
    """更新设置（支持部分更新）"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请提供需要更新的设置项"}), 400

    for key, value in data.items():
        # 检查设置项是否存在
        existing = query("SELECT id FROM settings WHERE `key` = %s", (key,))
        if existing:
            execute("UPDATE settings SET value = %s WHERE `key` = %s", (str(value), key))
        else:
            execute("INSERT INTO settings (`key`, value) VALUES (%s, %s)", (key, str(value)))

    # 返回更新后的所有设置
    rows = query("SELECT `key`, value FROM settings")
    result = {r['key']: r['value'] for r in rows}
    return jsonify({"success": True, "data": result})
