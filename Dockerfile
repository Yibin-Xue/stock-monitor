FROM node:18-alpine
WORKDIR /app

# 安装 Python（深度分析功能依赖 Python 脚本）
RUN apk add --no-cache python3 py3-pip

# 复制 backend 目录内容
COPY backend/package.json ./
COPY backend/package-lock.json* ./

RUN npm install --no-cache

# 安装 Python 依赖（requests）
RUN pip3 install --no-cache-dir requests 2>/dev/null || true

# 复制源代码（包含 Python 分析脚本）
COPY backend/ .

EXPOSE 3003

CMD ["npm", "start"]
