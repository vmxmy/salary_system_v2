# 使用nginx作为基础镜像
FROM nginx:stable-alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 删除默认的nginx静态文件
RUN rm -rf ./*

# 复制前端构建产物
COPY frontend/v2/dist/ .

# 复制自定义nginx配置
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 