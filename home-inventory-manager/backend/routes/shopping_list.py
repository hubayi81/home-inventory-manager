from flask import Blueprint, request, jsonify
from models import query, insert, execute

bp = Blueprint('shopping_list', __name__)


@bp.route('/api/shopping-list', methods=['GET'])
def get_shopping_list():
    """获取购物清单（仅未采购的）"""
    rows = query(
        "SELECT * FROM shopping_list WHERE purchased = FALSE ORDER BY created_at DESC"
    )
    return jsonify({"success": True, "data": rows})


@bp.route('/api/shopping-list', methods=['POST'])
def add_shopping_item():
    """添加购物清单项"""
    data = request.get_json()
    item_name = data.get('item_name', '').strip()
    item_id = data.get('item_id', None)
    quantity = data.get('quantity', 1)

    if not item_name:
        return jsonify({"success": False, "error": "物品名称不能为空"}), 400

    sid = insert(
        "INSERT INTO shopping_list (item_name, item_id, quantity) VALUES (%s, %s, %s)",
        (item_name, item_id, quantity)
    )
    row = query("SELECT * FROM shopping_list WHERE id = %s", (sid,))
    return jsonify({"success": True, "data": row[0]}), 201


@bp.route('/api/shopping-list/<int:sid>', methods=['PUT'])
def update_shopping_item(sid):
    """修改购物清单项（标记采购、修改数量等）"""
    existing = query("SELECT * FROM shopping_list WHERE id = %s", (sid,))
    if not existing:
        return jsonify({"success": False, "error": "清单项不存在"}), 404

    data = request.get_json()
    purchased = data.get('purchased', None)
    quantity = data.get('quantity', None)
    item_name = data.get('item_name', None)

    # 构建动态更新
    updates = []
    params = []
    if purchased is not None:
        updates.append("purchased = %s")
        params.append(purchased)
    if quantity is not None:
        updates.append("quantity = %s")
        params.append(quantity)
    if item_name is not None:
        updates.append("item_name = %s")
        params.append(item_name.strip())

    if updates:
        params.append(sid)
        execute(
            f"UPDATE shopping_list SET {', '.join(updates)} WHERE id = %s",
            tuple(params)
        )

        # 如果标记为已采购且关联了库存物品，恢复库存状态
        if purchased and existing[0]['item_id']:
            execute(
                "UPDATE items SET status = 'in_stock' WHERE id = %s",
                (existing[0]['item_id'],)
            )

    row = query("SELECT * FROM shopping_list WHERE id = %s", (sid,))
    return jsonify({"success": True, "data": row[0]})


@bp.route('/api/shopping-list/<int:sid>', methods=['DELETE'])
def delete_shopping_item(sid):
    """删除购物清单项"""
    existing = query("SELECT * FROM shopping_list WHERE id = %s", (sid,))
    if not existing:
        return jsonify({"success": False, "error": "清单项不存在"}), 404

    execute("DELETE FROM shopping_list WHERE id = %s", (sid,))
    return jsonify({"success": True, "data": None})
