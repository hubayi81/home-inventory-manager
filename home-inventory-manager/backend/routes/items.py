from flask import Blueprint, request, jsonify
from models import query, insert, execute
from datetime import date

bp = Blueprint('items', __name__)


def get_reminder_days():
    """获取提醒天数设置"""
    row = query("SELECT value FROM settings WHERE `key` = 'reminder_days'")
    return int(row[0]['value']) if row else 7


@bp.route('/api/items', methods=['GET'])
def get_items():
    """获取物品列表，支持搜索、筛选、排序、过期过滤"""
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id', type=int)
    status = request.args.get('status', '').strip()
    expiring_soon = request.args.get('expiring_soon', '').strip().lower() == 'true'
    sort_by = request.args.get('sort_by', 'created_at').strip()

    # SQL 构建
    conditions = ["1=1"]
    params = []

    if search:
        conditions.append("i.name LIKE %s")
        params.append(f"%{search}%")

    if category_id:
        conditions.append("i.category_id = %s")
        params.append(category_id)

    if status:
        conditions.append("i.status = %s")
        params.append(status)

    if expiring_soon:
        days = get_reminder_days()
        conditions.append("i.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL %s DAY)")
        params.append(days)

    # 排序映射
    sort_map = {
        'name': 'i.name ASC',
        'expiry_date': 'i.expiry_date ASC',
        'created_at': 'i.created_at DESC',
    }
    order_clause = sort_map.get(sort_by, 'i.created_at DESC')

    where = " AND ".join(conditions)
    sql = f"""
        SELECT i.*, c.name AS category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE {where}
        ORDER BY {order_clause}
    """
    rows = query(sql, tuple(params))
    return jsonify({"success": True, "data": rows})


@bp.route('/api/items', methods=['POST'])
def create_item():
    """手动创建物品"""
    data = request.get_json()
    name = data.get('name', '').strip()
    category_id = data.get('category_id')
    quantity = data.get('quantity', 1)
    expiry_date = data.get('expiry_date', None)
    notes = data.get('notes', '').strip()

    if not name:
        return jsonify({"success": False, "error": "物品名称不能为空"}), 400
    if not category_id:
        return jsonify({"success": False, "error": "请选择分类"}), 400

    # 检查是否已存在相同名称的在库物品
    dup = query(
        "SELECT id, quantity FROM items WHERE name = %s AND status = 'in_stock'",
        (name,)
    )
    if dup:
        existing = dup[0]
        return jsonify({
            "success": True,
            "data": None,
            "duplicate": True,
            "existing_id": existing['id'],
            "existing_quantity": existing['quantity'],
            "message": f"「{name}」在库存中已存在（数量: {existing['quantity']}），是否更新数量或作为新物品加入？"
        }), 200

    item_id = insert(
        "INSERT INTO items (name, category_id, quantity, expiry_date, notes) VALUES (%s, %s, %s, %s, %s)",
        (name, category_id, quantity, expiry_date if expiry_date else None, notes)
    )
    row = query("""
        SELECT i.*, c.name AS category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = %s
    """, (item_id,))
    return jsonify({"success": True, "data": row[0], "duplicate": False}), 201


@bp.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """更新物品信息"""
    existing = query("SELECT * FROM items WHERE id = %s", (item_id,))
    if not existing:
        return jsonify({"success": False, "error": "物品不存在"}), 404

    data = request.get_json()
    name = data.get('name', existing[0]['name'])
    category_id = data.get('category_id', existing[0]['category_id'])
    quantity = data.get('quantity', existing[0]['quantity'])
    expiry_date = data.get('expiry_date', existing[0]['expiry_date'])
    notes = data.get('notes', existing[0]['notes'])

    execute(
        "UPDATE items SET name=%s, category_id=%s, quantity=%s, expiry_date=%s, notes=%s WHERE id=%s",
        (name, category_id, quantity, expiry_date if expiry_date else None, notes, item_id)
    )
    row = query("""
        SELECT i.*, c.name AS category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = %s
    """, (item_id,))
    return jsonify({"success": True, "data": row[0]})


@bp.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """删除物品"""
    existing = query("SELECT * FROM items WHERE id = %s", (item_id,))
    if not existing:
        return jsonify({"success": False, "error": "物品不存在"}), 404

    execute("DELETE FROM items WHERE id = %s", (item_id,))
    return jsonify({"success": True, "data": None})


@bp.route('/api/items/<int:item_id>/status', methods=['PATCH'])
def update_item_status(item_id):
    """修改物品状态（标记/取消缺少）"""
    existing = query("SELECT * FROM items WHERE id = %s", (item_id,))
    if not existing:
        return jsonify({"success": False, "error": "物品不存在"}), 404

    data = request.get_json()
    new_status = data.get('status', '').strip()

    if new_status not in ('in_stock', 'out_of_stock', 'missing'):
        return jsonify({"success": False, "error": "无效的状态值"}), 400

    execute("UPDATE items SET status = %s WHERE id = %s", (new_status, item_id))

    # 如果标记为 missing，自动添加到购物清单
    if new_status == 'missing':
        item_name = existing[0]['name']
        # 检查是否已在购物清单中
        already = query(
            "SELECT id FROM shopping_list WHERE item_id = %s AND purchased = FALSE",
            (item_id,)
        )
        if not already:
            insert(
                "INSERT INTO shopping_list (item_name, item_id, quantity) VALUES (%s, %s, %s)",
                (item_name, item_id, 1)
            )

    # 如果恢复为 in_stock，移除购物清单中已关联的未采购项
    if new_status == 'in_stock':
        execute(
            "DELETE FROM shopping_list WHERE item_id = %s AND purchased = FALSE",
            (item_id,)
        )

    row = query("""
        SELECT i.*, c.name AS category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = %s
    """, (item_id,))
    return jsonify({"success": True, "data": row[0]})
