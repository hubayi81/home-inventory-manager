"""Web Push 通知服务"""
import json
import os
from models import query, insert, execute

# 生成 VAPID 密钥对（仅用于开发，生产环境应使用固定密钥）
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')


def get_or_create_vapid_keys():
    """获取或生成 VAPID 密钥对"""
    global VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        # 尝试从 settings 表读取
        rows = query("SELECT `key`, value FROM settings WHERE `key` IN ('vapid_private', 'vapid_public')")
        keys = {r['key']: r['value'] for r in rows}
        if 'vapid_private' in keys and 'vapid_public' in keys:
            VAPID_PRIVATE_KEY = keys['vapid_private']
            VAPID_PUBLIC_KEY = keys['vapid_public']
        else:
            # 生成新密钥
            from cryptography.hazmat.primitives.asymmetric import ec
            from cryptography.hazmat.primitives import serialization
            from base64 import urlsafe_b64encode
            import hashlib

            private_key = ec.generate_private_key(ec.SECP256R1())
            public_key = private_key.public_key()

            # 导出为 raw bytes
            private_raw = private_key.private_numbers().private_value.to_bytes(32, 'big')
            public_numbers = public_key.public_numbers()
            public_raw = b'\x04' + public_numbers.x.to_bytes(32, 'big') + public_numbers.y.to_bytes(32, 'big')

            VAPID_PRIVATE_KEY = urlsafe_b64encode(private_raw).rstrip(b'=').decode()
            VAPID_PUBLIC_KEY = urlsafe_b64encode(public_raw).rstrip(b'=').decode()

            # 存储到 settings 表
            execute("INSERT IGNORE INTO settings (`key`, value) VALUES ('vapid_private', %s)", (VAPID_PRIVATE_KEY,))
            execute("INSERT IGNORE INTO settings (`key`, value) VALUES ('vapid_public', %s)", (VAPID_PUBLIC_KEY,))

    return VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY


def save_subscription(user_id, subscription_json):
    """保存用户推送订阅"""
    # 先删除该用户旧订阅
    execute("DELETE FROM notification_subscriptions WHERE user_id = %s", (user_id,))
    # 保存新订阅
    insert(
        "INSERT INTO notification_subscriptions (user_id, subscription_json) VALUES (%s, %s)",
        (user_id, subscription_json)
    )


def remove_subscription(user_id):
    """删除用户推送订阅"""
    execute("DELETE FROM notification_subscriptions WHERE user_id = %s", (user_id,))


def get_subscriptions():
    """获取所有推送订阅"""
    return query("SELECT * FROM notification_subscriptions")


def send_push_notification(subscription_json, title, body, url='/'):
    """使用 pywebpush 发送推送通知"""
    try:
        from pywebpush import WebPusher, WebPushException

        public_key, private_key = get_or_create_vapid_keys()

        subscription = json.loads(subscription_json)
        data = json.dumps({
            'title': title,
            'body': body,
            'url': url,
            'icon': '/icon-192.png',
            'badge': '/icon-192.png',
        })

        WebPusher(subscription).send(
            data=data,
            vapid_private_key=private_key,
            vapid_claims={
                'sub': 'mailto:inventory@example.com',
                'aud': subscription.get('endpoint', ''),
            }
        )
        return True
    except Exception as e:
        print(f"Push notification failed: {e}")
        return False


def check_and_notify_expiring():
    """检查即将过期的物品，向所有订阅用户发送推送通知"""
    try:
        # 获取提醒天数
        days_row = query("SELECT value FROM settings WHERE `key` = 'reminder_days'")
        days = int(days_row[0]['value']) if days_row else 7

        # 查询即将过期的物品
        expiring = query(
            "SELECT i.name, i.expiry_date, u.id AS user_id "
            "FROM items i, (SELECT DISTINCT user_id FROM notification_subscriptions) u "
            "WHERE i.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL %s DAY) "
            "AND i.status = 'in_stock'",
            (days,)
        )

        if not expiring:
            print("No expiring items found.")
            return

        # 按用户分组发送通知
        user_items = {}
        for item in expiring:
            uid = item['user_id']
            if uid not in user_items:
                user_items[uid] = []
            user_items[uid].append(item['name'])

        subscriptions = get_subscriptions()
        for sub in subscriptions:
            uid = sub['user_id']
            if uid in user_items:
                count = len(user_items[uid])
                item_names = '、'.join(user_items[uid][:3])
                send_push_notification(
                    sub['subscription_json'],
                    title=f'{count} 件物品即将过期',
                    body=f'{item_names}{" 等" if count > 3 else ""}即将过期，记得早点使用哦~',
                    url='/'
                )

        print(f"Sent push notifications to {len(subscriptions)} subscribers.")
    except Exception as e:
        print(f"Check expiry error: {e}")
