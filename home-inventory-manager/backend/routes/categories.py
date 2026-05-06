from flask import Blueprint, request, jsonify
from models import query, insert, execute

bp = Blueprint('categories', __name__)


@bp.route('/api/categories', methods=['GET'])
def get_categories():
    """获取所有分类"""
    rows = query("SELECT * FROM categories ORDER BY id")
    return jsonify({"success": True, "data": rows})


@bp.route('/api/categories', methods=['POST'])
def create_category():
    """新增分类"""
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "error": "分类名称不能为空"}), 400

    # 检查是否已存在
    existing = query("SELECT id FROM categories WHERE name = %s", (name,))
    if existing:
        return jsonify({"success": False, "error": "该分类已存在"}), 400

    cat_id = insert("INSERT INTO categories (name) VALUES (%s)", (name,))
    row = query("SELECT * FROM categories WHERE id = %s", (cat_id,))
    return jsonify({"success": True, "data": row[0]}), 201


@bp.route('/api/categories/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    """更新分类名称"""
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "error": "分类名称不能为空"}), 400

    # 检查分类是否存在
    existing = query("SELECT * FROM categories WHERE id = %s", (cat_id,))
    if not existing:
        return jsonify({"success": False, "error": "分类不存在"}), 404

    # 检查名称是否被其他分类占用
    dup = query("SELECT id FROM categories WHERE name = %s AND id != %s", (name, cat_id))
    if dup:
        return jsonify({"success": False, "error": "该分类名已被占用"}), 400

    execute("UPDATE categories SET name = %s WHERE id = %s", (name, cat_id))
    row = query("SELECT * FROM categories WHERE id = %s", (cat_id,))
    return jsonify({"success": True, "data": row[0]})


@bp.route('/api/categories/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    """删除分类（如果分类下有在库物品则拒绝）"""
    # 检查分类是否存在
    existing = query("SELECT * FROM categories WHERE id = %s", (cat_id,))
    if not existing:
        return jsonify({"success": False, "error": "分类不存在"}), 404

    # 检查是否有在库物品属于该分类
    items = query(
        "SELECT COUNT(*) AS cnt FROM items WHERE category_id = %s AND status = 'in_stock'",
        (cat_id,)
    )
    if items and items[0]['cnt'] > 0:
        return jsonify({"success": False, "error": "该分类下还有在库物品，无法删除"}), 400

    execute("DELETE FROM categories WHERE id = %s", (cat_id,))
    return jsonify({"success": True, "data": None})
