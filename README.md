# 해건 비드워치 (HAEGUN BidWatch)

**해외건설협회 입찰공고 수집·분석·AI요약·알림 웹서비스**

해외 프로젝트 입찰 공고를 여러 소스(World Bank, ADB, UNGM, TED 등)에서 수집하고, AI로 핵심 정보를 요약하며, 사용자의 관심 조건에 따라 이메일 알림을 발송하는 서비스입니다.

---

## 🖥️ 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| DB | PostgreSQL |
| ORM | Prisma |
| 인증 | NextAuth.js (이메일/패스워드) |
| AI 요약 | OpenAI API (GPT-4o-mini) |
| 크롤링 | Cheerio + Axios (더미 모드 내장) |
| 이메일 | Nodemailer |

---

## 📁 프로젝트 구조

```
HAEGUN_BidWatch/
├── prisma/
│   ├── schema.prisma          # 12개 테이블 스키마
│   └── seed.ts                # 샘플 데이터 (10개 공고, 3명 사용자)
├── src/
│   ├── app/
│   │   ├── (app)/             # 인증 필요 영역 (사이드바 레이아웃)
│   │   │   ├── dashboard/     # 대시보드
│   │   │   ├── tenders/       # 공고 목록
│   │   │   │   └── [id]/      # 공고 상세
│   │   │   ├── bookmarks/     # 북마크
│   │   │   ├── alerts/        # 알림 규칙
│   │   │   └── admin/         # 관리자 (ADMIN/MANAGER만)
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── tenders/       # 공고 CRUD
│   │   │   ├── bookmarks/     # 북마크 CRUD
│   │   │   ├── alert-rules/   # 알림 규칙 CRUD
│   │   │   ├── notes/         # 내부 메모
│   │   │   ├── ai/summarize/  # AI 요약 실행
│   │   │   └── admin/crawl/   # 크롤링 수동 실행
│   │   ├── login/             # 로그인 페이지
│   │   └── globals.css
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth 설정
│   │   ├── prisma.ts          # Prisma 싱글턴
│   │   ├── utils.ts           # 유틸리티 함수
│   │   ├── ai-summarize.ts    # AI 요약 모듈
│   │   ├── crawler.ts         # 크롤링 모듈
│   │   └── notify.ts          # 알림 모듈
│   └── middleware.ts          # 라우트 보호
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 빠른 시작

### 1. 사전 요구사항

- Node.js 18+ ([다운로드](https://nodejs.org))
- PostgreSQL 14+ ([다운로드](https://www.postgresql.org/download/))

### 2. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-org/HAEGUN_BidWatch.git
cd HAEGUN_BidWatch
npm install
```

### 3. 환경 변수 설정

```bash
# .env.example을 복사하여 .env.local 생성
copy .env.example .env.local
```

`.env.local`을 열어 값을 설정합니다:

```env
# PostgreSQL 연결 URL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/haegun_bidwatch"

# NextAuth (임의의 난수 문자열 사용)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-string-min-32-chars"

# OpenAI (없으면 Mock 요약 자동 사용)
OPENAI_API_KEY="sk-..."

# 이메일 (없으면 콘솔 출력으로 대체)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 4. PostgreSQL 데이터베이스 생성

```sql
-- PostgreSQL에서 실행
CREATE DATABASE haegun_bidwatch;
```

또는 psql 명령어로:
```bash
psql -U postgres -c "CREATE DATABASE haegun_bidwatch;"
```

### 5. DB 스키마 적용 및 데이터 시딩

```bash
# Prisma 클라이언트 생성 + 스키마 적용
npm run db:push

# 샘플 데이터 삽입
npm run db:seed
```

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 🔑 데모 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@haegun.or.kr | admin1234! |
| 사용자 | jungho@haegun.or.kr | user1234! |
| 매니저 | soojin@haegun.or.kr | user1234! |

---

## 📋 주요 기능

### 대시보드
- 오늘 신규 공고 수, 마감 임박 공고, 내 북마크, 전체 공고 수 통계
- 최근 공고 목록 (공고일, 마감일, 국가, 예산 표시)

### 공고 목록
- 전문 검색 (제목, 발주처, 국가)
- 국가 / 공종 필터
- 정렬: 최신순 / 마감임박순 / 예산순
- 페이지네이션

### 공고 상세
- 공고 기본정보 (국가, 발주처, 예산, 마감일 등)
- AI 3줄 요약 + 상세 요약 + 자격 요건 + 주의사항
- 첨부파일 목록
- 북마크 버튼
- 내부 메모 작성/조회

### 북마크
- 저장된 공고 목록
- 메모 포함 표시

### 알림 규칙
- 국가, 공종, 키워드, 최소 예산, 마감 임박일 조건 설정
- 이메일 알림 on/off
- 규칙 활성화/비활성화

### 관리자
- 수집 소스 목록 및 상태 조회
- 수동 크롤링 실행 (단일 소스 또는 전체)
- 크롤링 로그 조회 (신규/수정/중복/오류 수)

---

## 🤖 AI 요약 동작 방식

OpenAI API 키가 있으면 실제 GPT-4o-mini 기반 분석을 수행하고, 없으면 자동으로 Mock 요약을 반환합니다.

**수동 AI 요약 실행:**
```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Cookie: [로그인 세션 쿠키]" \
  -d '{"tenderId": "UUID", "force": true}'
```

---

## 🕷️ 크롤링 모듈

현재는 더미 크롤러가 내장되어 있습니다. 실제 사이트 크롤링은 `src/lib/crawler.ts`의 `dummyCrawlSource` 함수를 사이트별 파서로 교체하여 구현합니다.

**수동 크롤링 실행 (관리자 전용):**
```bash
curl -X POST http://localhost:3000/api/admin/crawl \
  -H "Content-Type: application/json" \
  -H "Cookie: [관리자 세션 쿠키]" \
  -d '{"sourceId": "source-worldbank"}'
```

---

## 📧 알림 모듈

알림 발송은 `src/lib/notify.ts`의 `runNotifications()`를 주기적으로 실행합니다.

**cron 설정 예시 (서버에서):**
```bash
# 매일 오전 8시 실행
0 8 * * * curl -X POST http://localhost:3000/api/admin/notify
```

SMTP 설정이 없으면 콘솔에 이메일 내용을 출력합니다.

---

## 🗄️ 데이터 모델 (주요 테이블)

| 테이블 | 설명 |
|--------|------|
| users | 사용자 (ADMIN/MANAGER/USER) |
| sources | 크롤링 소스 사이트 |
| tenders | 입찰 공고 (핵심) |
| tender_raw_contents | 공고 원문 텍스트 |
| tender_files | 첨부파일 목록 |
| tags / tender_tags | 태그 시스템 |
| bookmarks | 사용자 북마크 |
| alert_rules | 알림 조건 규칙 |
| notifications | 발송된 알림 기록 |
| crawl_logs | 크롤링 실행 로그 |
| internal_notes | 공고별 내부 메모 |

---

## 🔧 추가 명령어

```bash
# Prisma Studio (DB GUI)
npm run db:studio

# DB 스키마 마이그레이션 (개발)
npm run db:migrate

# 프로덕션 빌드
npm run build && npm start
```

---

## 📝 라이선스

MIT License - 해외건설협회 내부 사용 목적