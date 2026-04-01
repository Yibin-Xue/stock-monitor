FROM node:18-alpine

WORKDIR /app

# 复制 backend 目录的依赖文件
COPY backend/package*.json ./

# 安装生产依赖
RUN npm install --only=production

# 复制 backend 所有源码
COPY backend/ .

# 调试：打印文件列表
RUN ls -la

EXPOSE 3003

# 使用 npm start 而不是直接 node
CMD ["npm", "start"]
