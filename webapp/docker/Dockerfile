# webapp/docker/Dockerfile

FROM python:3.10-slim
WORKDIR /app

# 复制并安装依赖
# 假设 requirements.txt 在构建上下文的根目录 (即 webapp/requirements.txt)
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 复制应用代码
# 这会将构建上下文 (webapp/) 的内容复制到镜像的 /app 目录
# webapp/.dockerignore 文件会控制哪些文件被排除
COPY . /app

EXPOSE 8080

# 运行应用的命令
# 依赖 webapp/main.py 中的 if __name__ == "__main__": 块来启动uvicorn
CMD ["python", "main.py"] 