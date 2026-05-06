# 家庭库存管理系统

一个基于 Web 的家庭库存管理系统，支持拍照 AI 识别物品、分类管理、过期提醒和购物清单。

## 技术栈

- **后端**: Python 3.10 + Flask + MySQL
- **前端**: React 18 + TypeScript + Vite + Ant Design
- **AI**: DeepSeek API（视觉识别）

## 快速开始

### 1. 创建数据库

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS family_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p family_inventory < database/init.sql
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入数据库密码和 SECRET_KEY
```

### 3. 后端启动

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 4. 前端启动

```bash
cd frontend
npm install
npm run dev
```

## Docker 部署

```bash
docker compose up -d
```

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| DB_HOST | MySQL 地址 | 否 |
| DB_PORT | MySQL 端口 | 否 |
| DB_USER | 数据库用户名 | 否 |
| DB_PASSWORD | 数据库密码 | **是** |
| DB_NAME | 数据库名 | 否 |
| SECRET_KEY | Flask 密钥（用于 Token 签名） | **是** |
| DEEPSEEK_API_KEY | DeepSeek API Key（不填则用模拟数据） | 否 |
