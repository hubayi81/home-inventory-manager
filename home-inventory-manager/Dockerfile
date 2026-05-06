FROM python:3.12-slim

WORKDIR /app

# 用阿里云 Debian 源加速
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
# 用清华镜像加速 pip
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt gunicorn

COPY backend/ .
COPY database/ /app/database/

RUN mkdir -p uploads

EXPOSE 5099

CMD ["gunicorn", "--bind", "0.0.0.0:5099", "--workers", "2", "--timeout", "120", "app:application"]
