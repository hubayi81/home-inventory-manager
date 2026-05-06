from flask import Blueprint, jsonify
from models import query


bp = Blueprint('stats', __name__)


@bp.route('/api/stats', methods=['GET'])
def get_stats():
    """获取仪表板统计数据"""
    # 总物品数
    total = query("SELECT COUNT(*) AS cnt FROM items WHERE status = 'in_stock'")

    # 获取提醒天数
    days_row = query("SELECT value FROM settings WHERE `key` = 'reminder_days'")
    reminder_days = int(days_row[0]['value']) if days_row else 7

    # 即将过期物品数
    expiring = query(
        "SELECT COUNT(*) AS cnt FROM items WHERE expiry_date IS NOT NULL "
        "AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL %s DAY) "
        "AND status = 'in_stock'",
        (reminder_days,)
    )

    # 缺少物品数
    missing = query(
        "SELECT COUNT(*) AS cnt FROM shopping_list WHERE purchased = FALSE"
    )

    # 分类分布
    distribution = query("""
        SELECT c.name, COUNT(i.id) AS count
        FROM categories c
        LEFT JOIN items i ON c.id = i.category_id AND i.status = 'in_stock'
        GROUP BY c.id, c.name
        ORDER BY c.id
    """)

    return jsonify({
        "success": True,
        "data": {
            "total_items": total[0]['cnt'] if total else 0,
            "expiring_soon": expiring[0]['cnt'] if expiring else 0,
            "missing_items": missing[0]['cnt'] if missing else 0,
            "category_distribution": distribution
        }
    })
