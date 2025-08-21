# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# 安装系统依赖（用于健康检查）
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装依赖阶段
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# 如果有生产依赖，可以单独安装
RUN mkdir -p /temp/prod
COPY package.json bun.lockb* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# 预发布阶段 - 复制源代码并构建
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules

# 复制源代码（优化缓存层）
COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY package.json ./

# 运行构建
ENV NODE_ENV=production
RUN bun run build

# 生产阶段
FROM base AS release

# 创建目录
RUN mkdir -p /usr/src/app/data /usr/src/app/logs

# 复制应用文件
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/public ./public
COPY --from=prerelease /usr/src/app/package.json .

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3010
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/usr/src/app/data/nodeseeker.db

# 暴露端口
EXPOSE 3010

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

# 启动应用
ENTRYPOINT [ "bun", "run", "start" ]