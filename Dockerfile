# ─────────────────────────────────────────────────────────────
# Stage 1: 의존성 설치
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# OpenSSL 설치 (Prisma 필수)
RUN apk add --no-cache openssl openssl-dev libc-dev

# 의존성 파일만 먼저 복사 (캐시 활용)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

# ─────────────────────────────────────────────────────────────
# Stage 2: 개발 서버 (docker-compose에서 사용)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app

# OpenSSL 설치 (Prisma 필수)
RUN apk add --no-cache openssl openssl-dev libc-dev

# deps 스테이지에서 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

EXPOSE 3000

# 시작 시: prisma generate → db push → seed(빈 경우만) → dev 서버
CMD sh -c "\
    echo '⏳ [1/3] Prisma 클라이언트 생성 중...' && \
    npx prisma generate && \
    echo '⏳ [2/3] DB 스키마 적용 중...' && \
    npx prisma db push --accept-data-loss && \
    echo '⏳ [3/3] 샘플 데이터 확인 중...' && \
    COUNT=\$(npx tsx -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.tender.count().then(n=>{console.log(n);p.\\\$disconnect()})\" 2>/dev/null || echo 0) && \
    if [ \"\$COUNT\" = '0' ]; then echo '→ 샘플 데이터 삽입 중...' && npx tsx prisma/seed.ts && echo '✅ 완료!'; else echo \"→ 데이터 있음(\${COUNT}건). 시드 건너뜁니다.\"; fi && \
    echo '' && \
    echo '🚀 서버 시작: http://localhost:3000' && \
    echo '🔑 admin@haegun.or.kr / admin1234!' && \
    echo '' && \
    npm run dev"

# ─────────────────────────────────────────────────────────────
# Stage 3: 프로덕션 빌드 (선택사항)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "server.js"]

