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

USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
