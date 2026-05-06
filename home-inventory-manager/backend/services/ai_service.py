import json
import base64
import os
import urllib.request
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL


def recognize_items(image_path):
    """
    调用 Deepseek API 识别图片中的家庭物品。
    如果 API key 未配置，使用模拟数据。
    返回物品名称列表。
    """
    if not DEEPSEEK_API_KEY:
        return mock_recognize()

    try:
        # 读取图片并转为 base64
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

        # 获取文件扩展名
        ext = os.path.splitext(image_path)[1].lower()
        mime_types = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'}
        mime_type = mime_types.get(ext, 'image/jpeg')

        # 调用 Deepseek API（OpenAI 兼容接口）
        url = f"{DEEPSEEK_BASE_URL}/v1/chat/completions"
        payload = {
            "model": "deepseek-chat",
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "请识别这张图片中的家庭物品（如食品、饮料、日用品等）。只返回物品名称的 JSON 数组，例如 [\"牛奶\", \"面包\"]。不要包含背景、手、桌面等非物品内容。如果无法识别任何物品，返回空数组 []。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_data}"
                        }
                    }
                ]
            }],
            "max_tokens": 500
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
            }
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            content = result['choices'][0]['message']['content'].strip()

            # 提取 JSON 数组
            # 尝试多种解析策略
            try:
                items = json.loads(content)
                if isinstance(items, list):
                    return [s for s in items if isinstance(s, str) and len(s.strip()) > 0]
            except json.JSONDecodeError:
                pass

            # 尝试提取方括号内的内容
            if '[' in content and ']' in content:
                start = content.index('[')
                end = content.rindex(']') + 1
                try:
                    items = json.loads(content[start:end])
                    if isinstance(items, list):
                        return [s for s in items if isinstance(s, str) and len(s.strip()) > 0]
                except json.JSONDecodeError:
                    pass

            return []

    except Exception:
        return []


def mock_recognize():
    """模拟 AI 识别（无 API key 时使用）"""
    import random
    items_pool = [
        ['牛奶', '鸡蛋'], ['面包', '果酱'], ['苹果', '香蕉'],
        ['酱油', '食盐'], ['可乐', '雪碧'], ['洗手液', '纸巾'],
        ['方便面', '火腿肠'], ['薯片', '巧克力'], ['洗衣液'],
        ['牙膏', '毛巾'], ['大米'], ['食用油'], ['生抽']
    ]
    return random.choice(items_pool)
