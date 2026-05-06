# Flask 后端配置文件
import os
from dotenv import load_dotenv

load_dotenv()  # 加载 .env 文件中的环境变量

# MySQL 数据库连接
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'family_inventory')

# Deepseek API 配置（OpenAI 兼容接口）
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')

# 文件上传配置
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}
MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8MB

# Flask 配置
SECRET_KEY = os.getenv('SECRET_KEY')  # 必须在 .env 中设置，否则启动报错
