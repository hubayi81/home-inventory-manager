import pymysql
from config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


def get_db():
    """获取数据库连接"""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def query(sql, args=None):
    """执行查询，返回所有结果"""
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, args)
            return cursor.fetchall()
    finally:
        conn.close()


def execute(sql, args=None):
    """执行写操作，返回影响行数"""
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, args)
            conn.commit()
            return cursor.rowcount
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def insert(sql, args=None):
    """执行插入，返回新 ID"""
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, args)
            conn.commit()
            return cursor.lastrowid
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
