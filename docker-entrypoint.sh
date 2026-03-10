#!/bin/sh
# docker-entrypoint.sh
# 컨테이너 시작 시 자동으로 DB 적용 및 초기 데이터를 삽입합니다

set -e

echo "=========================================="
echo "  해건 비드워치 - 컨테이너 시작"
echo "=========================================="

echo ""
echo "⏳ [1/3] Prisma 클라이언트 생성 중..."
npx prisma generate

echo ""
echo "⏳ [2/3] DB 스키마 적용 중..."
npx prisma db push --accept-data-loss

echo ""
echo "⏳ [3/3] 샘플 데이터 확인 중..."
# tenders 테이블에 데이터가 없을 때만 seed 실행
TENDER_COUNT=$(npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.tender.count().then(n => { console.log(n); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$TENDER_COUNT" = "0" ]; then
  echo "   → 데이터 없음. 샘플 데이터를 삽입합니다..."
  npx tsx prisma/seed.ts
  echo "   ✅ 샘플 데이터 삽입 완료!"
else
  echo "   → 이미 데이터가 있습니다 (${TENDER_COUNT}건). 시드를 건너뜁니다."
fi

echo ""
echo "=========================================="
echo "  ✅ 준비 완료! 서버를 시작합니다."
echo "  🌐 http://localhost:3000 에서 접속하세요"
echo "  🔑 admin@haegun.or.kr / admin1234!"
echo "=========================================="
echo ""

# 원래 CMD 실행 (npm run dev)
exec "$@"
