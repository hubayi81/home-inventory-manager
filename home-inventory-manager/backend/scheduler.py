"""定时任务调度器：每天自动检查过期物品并推送通知"""
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.notification_service import check_and_notify_expiring

CHECK_INTERVAL = 3600  # 每小时检查一次（避免频繁查询数据库）


def main():
    print("[Scheduler] 过期提醒调度器已启动")
    # 启动后等 30 秒再首次检查（等数据库 ready）
    time.sleep(30)
    print("[Scheduler] 开始首次检查...")
    try:
        check_and_notify_expiring()
    except Exception as e:
        print(f"[Scheduler] 首次检查失败: {e}")

    while True:
        time.sleep(CHECK_INTERVAL)
        try:
            check_and_notify_expiring()
        except Exception as e:
            print(f"[Scheduler] 检查失败: {e}")


if __name__ == '__main__':
    main()
