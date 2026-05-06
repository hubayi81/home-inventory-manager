from flask import Flask
from flask_cors import CORS
from config import UPLOAD_FOLDER, MAX_CONTENT_LENGTH
import os

from routes.categories import bp as categories_bp
from routes.items import bp as items_bp
from routes.upload import bp as upload_bp
from routes.shopping_list import bp as shopping_list_bp
from routes.settings import bp as settings_bp
from routes.stats import bp as stats_bp
from routes.auth import bp as auth_bp
from routes.notifications import bp as notifications_bp


def create_app():
    app = Flask(__name__)

    # 跨域支持
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 文件上传配置
    app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

    # 确保上传目录存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # 注册蓝图
    app.register_blueprint(categories_bp)
    app.register_blueprint(items_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(shopping_list_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(notifications_bp)

    @app.route('/api/health')
    def health():
        return {"success": True, "data": "OK"}

    return app


application = create_app()

if __name__ == '__main__':
    application.run(host='0.0.0.0', port=5099, debug=False)
