FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && npm ci

FROM dependencies AS build

WORKDIR /app

COPY . .

# Prisma only needs syntactically valid URLs while generating the client; it does not connect here.
ENV DATABASE_URL="mysql://build:build@localhost:3306/build"
ENV SHADOW_DATABASE_URL="mysql://build:build@localhost:3306/build_shadow"

RUN npx prisma generate
RUN npm run build

FROM build AS migration

# This target is run once by the deployment workflow before the application is updated.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build /app/.output ./.output
# 注意：普通 JavaScript 依赖通常会被 Nitro 打进 .output；带平台相关原生二进制、
# 且由第三方在运行时动态加载的可选依赖不会可靠地被追踪。遇到这类依赖时，必须
# 按包路径从 build 阶段单独 COPY 到 runtime，并在这里增加一次加载校验。
# 当前 pdf-parse/pdfjs-dist 会动态加载 @napi-rs/canvas，否则会缺少 DOMMatrix。
COPY --from=build /app/node_modules/@napi-rs ./node_modules/@napi-rs
# 在镜像构建阶段加载一次，确保目标 Linux 平台的原生二进制可以被 Node 使用。
RUN node -e "require('@napi-rs/canvas')"

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
