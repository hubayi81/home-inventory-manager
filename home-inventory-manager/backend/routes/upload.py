import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS
from services.ai_service import recognize_items
from models import query, insert

bp = Blueprint('upload', __name__)


def allowed_file(filename):
    """检查文件扩展名是否合法"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/api/upload', methods=['POST'])
def upload_image():
    """上传图片并进行 AI 识别"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "未找到上传文件"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "文件名不能为空"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "仅支持 jpg、jpeg、png 格式图片"}), 400

    # 确保上传目录存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # 生成唯一文件名
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # AI 识别
    suggestions = recognize_items(filepath)

    return jsonify({
        "success": True,
        "data": {
            "image_path": f"uploads/{filename}",
            "suggestions": suggestions
        }
    })


@bp.route('/api/items/from-photo', methods=['POST'])
def create_item_from_photo():
    """根据照片识别结果创建物品"""
    data = request.get_json()
    name = data.get('name', '').strip()
    category_id = data.get('category_id')
    quantity = data.get('quantity', 1)
    expiry_date = data.get('expiry_date', None)
    notes = data.get('notes', '').strip()
    image_path = data.get('image_path', '').strip()

    if not name:
        return jsonify({"success": False, "error": "物品名称不能为空"}), 400
    if not category_id:
        return jsonify({"success": False, "error": "请选择分类"}), 400

    item_id = insert(
        "INSERT INTO items (name, category_id, quantity, expiry_date, notes, image_path) VALUES (%s, %s, %s, %s, %s, %s)",
        (name, category_id, quantity, expiry_date if expiry_date else None, notes, image_path)
    )
    row = query("""
        SELECT i.*, c.name AS category_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = %s
    """, (item_id,))
    return jsonify({"success": True, "data": row[0]}), 201
