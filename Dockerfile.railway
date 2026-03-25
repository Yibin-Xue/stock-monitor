FROM node:18-alpine

WORKDIR /app

# 复制 backend 目录的依赖文件
COPY backend/package*.json ./

# 安装生产依赖
RUN npm install --only=production

# 复制 backend 所有源码
COPY backend/ .

EXPOSE 3003

CMD ["node", "index.js"]
