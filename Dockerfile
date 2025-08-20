# 使用官方 Bun 镜像作为基础镜像
FROM oven/bun:1 as base
WORKDIR /usr/src/app

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
COPY . .

# 运行构建
ENV NODE_ENV=production
RUN bun run build

# 生产阶段
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/public ./public
COPY --from=prerelease /usr/src/app/package.json .

# 创建数据目录
RUN mkdir -p /usr/src/app/data

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bun
USER bun

# 暴露端口
EXPOSE 3000/tcp

# 启动应用
ENTRYPOINT [ "bun", "run", "start" ]