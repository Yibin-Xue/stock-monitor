FROM node:18-alpine
WORKDIR /app

# 复制 backend 目录内容
COPY backend/package.json ./
COPY backend/package-lock.json* ./

RUN npm install --no-cache

# 复制源代码
COPY backend/ .

EXPOSE 3003

CMD ["npm", "start"]
