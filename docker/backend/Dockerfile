FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制系统依赖文件
COPY docker/backend/system-dependencies.txt .

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    $(cat system-dependencies.txt | grep -v "^#" | tr '\n' ' ') \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY docker/backend/docker-requirements.txt .
COPY webapp/requirements.txt ./webapp-requirements.txt

# 安装Python依赖
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r docker-requirements.txt

# 复制应用代码
COPY webapp/ .

# 复制健康检查脚本
COPY docker/backend/healthcheck.py /app/healthcheck.py
RUN chmod +x /app/healthcheck.py

# 设置环境变量
ENV PYTHONPATH=/app
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python /app/healthcheck.py

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 