"""数据库初始化脚本 - 创建数据库和表，插入初始数据"""
import pymysql
import os
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


def init():
    # 先连接不指定数据库，创建数据库
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        charset='utf8mb4'
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} "
                           "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"数据库 '{DB_NAME}' 已创建/确认")
        conn.commit()
    finally:
        conn.close()

    # 连接指定数据库，读取并执行 init.sql
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4'
    )
    try:
        sql_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'init.sql')
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # 按分号分割并执行（跳过已执行过的 CREATE DATABASE 和 USE 语句）
        statements = []
        for stmt in sql_content.split(';'):
            stmt = stmt.strip()
            if stmt and not stmt.upper().startswith('CREATE DATABASE') and not stmt.upper().startswith('USE'):
                statements.append(stmt)

        with conn.cursor() as cursor:
            for stmt in statements:
                if stmt:
                    try:
                        cursor.execute(stmt)
                    except Exception as e:
                        if 'Duplicate' in str(e) or 'already exists' in str(e):
                            print(f"跳过重复项: {str(e)[:60]}")
                        else:
                            print(f"执行警告: {str(e)[:100]}")
        conn.commit()
        print("数据库表已创建/确认，初始数据已插入")

        # 验证
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [r[0] for r in cursor.fetchall()]
            print(f"当前数据表: {', '.join(tables)}")

    finally:
        conn.close()


if __name__ == '__main__':
    try:
        init()
        print("数据库初始化成功！")
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        print("请确保 MySQL 服务已启动，并检查连接配置")
