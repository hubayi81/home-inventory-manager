from flask import Blueprint, request, jsonify
from services.notification_service import save_subscription, remove_subscription, get_or_create_vapid_keys

bp = Blueprint('notifications', __name__)


@bp.route('/api/notifications/vapid-key', methods=['GET'])
def vapid_key():
    """获取 VAPID 公钥"""
    public_key, _ = get_or_create_vapid_keys()
    return jsonify({"success": True, "data": {"public_key": public_key}})


@bp.route('/api/notifications/subscribe', methods=['POST'])
def subscribe():
    """保存推送订阅"""
    data = request.get_json()
    user_id = data.get('user_id')
    subscription = data.get('subscription')

    if not user_id or not subscription:
        return jsonify({"success": False, "error": "缺少参数"}), 400

    import json
    save_subscription(user_id, json.dumps(subscription))
    return jsonify({"success": True, "data": None})


@bp.route('/api/notifications/unsubscribe', methods=['POST'])
def unsubscribe():
    """取消推送订阅"""
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"success": False, "error": "缺少参数"}), 400

    remove_subscription(user_id)
    return jsonify({"success": True, "data": None})
