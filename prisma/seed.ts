import { PrismaClient, UserRole, SourceType, TenderStatus, CrawlStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // ─── 사용자 생성 ───────────────────────────
    const adminPass = await bcrypt.hash('admin1234!', 12)
    const userPass = await bcrypt.hash('user1234!', 12)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@haegun.or.kr' },
        update: {},
        create: {
            email: 'admin@haegun.or.kr',
            name: '관리자',
            passwordHash: adminPass,
            role: UserRole.ADMIN,
            emailVerified: new Date(),
        },
    })

    const user1 = await prisma.user.upsert({
        where: { email: 'jungho@haegun.or.kr' },
        update: {},
        create: {
            email: 'jungho@haegun.or.kr',
            name: '김정호',
            passwordHash: userPass,
            role: UserRole.USER,
            emailVerified: new Date(),
        },
    })

    const user2 = await prisma.user.upsert({
        where: { email: 'soojin@haegun.or.kr' },
        update: {},
        create: {
            email: 'soojin@haegun.or.kr',
            name: '박수진',
            passwordHash: userPass,
            role: UserRole.MANAGER,
            emailVerified: new Date(),
        },
    })

    console.log('✅ Users created')

    // ─── 수집 소스 생성 ───────────────────────────
    const worldBankSource = await prisma.source.upsert({
        where: { id: 'source-worldbank' },
        update: {},
        create: {
            id: 'source-worldbank',
            name: 'World Bank - Projects & Operations',
            url: 'https://projects.worldbank.org',
            sourceType: SourceType.WEB,
            description: '세계은행 조달 공고',
            listUrlPattern: 'https://projects.worldbank.org/en/projects-operations/procurement',
            cronSchedule: '0 6 * * *',
            isActive: true,
        },
    })

    const unSource = await prisma.source.upsert({
        where: { id: 'source-ungm' },
        update: {},
        create: {
            id: 'source-ungm',
            name: 'UNGM - United Nations Global Marketplace',
            url: 'https://www.ungm.org',
            sourceType: SourceType.WEB,
            description: '유엔 글로벌 마켓플레이스 공고',
            listUrlPattern: 'https://www.ungm.org/Public/Notice',
            cronSchedule: '0 7 * * *',
            isActive: true,
        },
    })

    const adbSource = await prisma.source.upsert({
        where: { id: 'source-adb' },
        update: {},
        create: {
            id: 'source-adb',
            name: 'ADB - Asian Development Bank',
            url: 'https://www.adb.org',
            sourceType: SourceType.WEB,
            description: '아시아개발은행 조달 공고',
            listUrlPattern: 'https://www.adb.org/projects/tenders/list',
            cronSchedule: '0 8 * * *',
            isActive: true,
        },
    })

    const tedSource = await prisma.source.upsert({
        where: { id: 'source-ted' },
        update: {},
        create: {
            id: 'source-ted',
            name: 'TED - Tenders Electronic Daily (EU)',
            url: 'https://ted.europa.eu',
            sourceType: SourceType.WEB,
            description: '유럽연합 전자 입찰 공고',
            listUrlPattern: 'https://ted.europa.eu/TED/search/search.do',
            cronSchedule: '0 9 * * *',
            isActive: false,
        },
    })

    console.log('✅ Sources created')

    // ─── 태그 생성 ───────────────────────────
    const tagData = [
        { name: 'road', nameKo: '도로', color: '#3B82F6' },
        { name: 'bridge', nameKo: '교량', color: '#8B5CF6' },
        { name: 'water', nameKo: '상하수도', color: '#06B6D4' },
        { name: 'building', nameKo: '건축', color: '#10B981' },
        { name: 'railway', nameKo: '철도', color: '#F59E0B' },
        { name: 'port', nameKo: '항만', color: '#EF4444' },
        { name: 'energy', nameKo: '에너지', color: '#F97316' },
        { name: 'ict', nameKo: 'ICT', color: '#6366F1' },
    ]

    const tags: Record<string, string> = {}
    for (const tag of tagData) {
        const created = await prisma.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: tag,
        })
        tags[tag.name] = created.id
    }

    console.log('✅ Tags created')

    // ─── 공고 생성 ───────────────────────────
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const in3days = new Date(now.getTime() + 3 * 86400000)
    const in7days = new Date(now.getTime() + 7 * 86400000)
    const in14days = new Date(now.getTime() + 14 * 86400000)
    const in30days = new Date(now.getTime() + 30 * 86400000)
    const in60days = new Date(now.getTime() + 60 * 86400000)
    const yesterday = new Date(now.getTime() - 86400000)
    const week_ago = new Date(now.getTime() - 7 * 86400000)
    const month_ago = new Date(now.getTime() - 30 * 86400000)

    const tendersData = [
        {
            sourceId: worldBankSource.id,
            sourceHash: 'hash-001-wb-indonesia-road',
            title: 'Indonesia - National Road Improvement and Maintenance Program Phase III',
            titleKo: '인도네시아 국도 개선 및 유지보수 프로그램 3단계',
            projectNumber: 'P-ID-2024-0312',
            country: '인도네시아',
            region: '동남아시아',
            issuer: 'World Bank / Kementerian Pekerjaan Umum',
            issuerType: 'MDB',
            category: '도로',
            contractType: 'ICB',
            budget: 125000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 125,000,000',
            publishedAt: week_ago,
            deadlineAt: in14days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://projects.worldbank.org/en/projects-operations/procurement/notice/CS-P-ID-2024-0312',
            summaryShort: '인도네시아 국도 유지보수 및 개선 사업 3단계로, 세계은행 융자를 통해 Java, Sumatra, Kalimantan 주요 국도 325km 구간을 대상으로 한다. 계약방식은 국제경쟁입찰(ICB)이며, 총 사업비는 USD 1억 2,500만이다. 마감일은 공고일로부터 3주 이내이므로 신속한 준비가 필요하다.',
            summaryLong: '본 사업은 인도네시아 공공사업부(Kementerian Pekerjaan Umum)가 발주하고 세계은행이 융자하는 국도 개선사업의 3단계 프로그램이다. 대상 구간은 Java 110km, Sumatra 145km, Kalimantan 70km 등 총 325km이며 도로 재포장, 교량 보강, 배수시설 개선이 주 공사 항목이다. 계약 방식은 국제경쟁입찰(ICB)이며 FIDIC Red Book 조건이 적용된다. 입찰 마감은 공고일로부터 21일이며 사전자격심사(PQ) 통과 업체만 참여 가능하다. 참가 자격은 최근 10년간 유사 도로공사 수행 실적(최소 USD 5,000만 이상) 보유 업체에 한한다.',
            qualificationText: '최근 10년 내 단일 계약 기준 USD 5,000만 이상의 도로공사 완공 실적 필요. 국제 인증 재무제표 제출 필수. 현지 파트너사 JV 구성 권장 (외국 기업 지분 70% 이하). FIDIC 기반 계약 경험 보유 업체 우대.',
            importantNotes: '사전자격심사(PQ) 마감이 별도로 존재하며 본 입찰 마감 7일 전까지 서류 제출 완료해야 합니다. 현지 세금 및 관세 면제 조건은 세계은행 융자 조건에 따라 달라질 수 있으므로 원문 확인이 필요합니다. 이 사업은 환경 카테고리 B 등급으로 분류되어 환경영향평가보고서 검토가 요구됩니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 47,
            tagNames: ['road', 'bridge'],
        },
        {
            sourceId: adbSource.id,
            sourceHash: 'hash-002-adb-vietnam-water',
            title: 'Viet Nam: Ho Chi Minh City Water Environment Improvement Project - Package WW-03',
            titleKo: '베트남 호치민시 수환경 개선 사업 - WW-03 패키지',
            projectNumber: 'HCMC-WEI-WW03',
            country: '베트남',
            region: '동남아시아',
            city: '호치민',
            issuer: 'Asian Development Bank / HCMC Urban Drainage Authority',
            issuerType: 'MDB',
            category: '상하수도',
            contractType: 'ICB',
            budget: 78500000,
            budgetCurrency: 'USD',
            budgetText: 'USD 78.5 Million',
            publishedAt: now,
            deadlineAt: in30days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.adb.org/projects/tenders/list/HCMC-WEI-WW03',
            summaryShort: '베트남 호치민시 도시 하수처리 용량 확대 및 수질 개선을 위한 인프라 사업. 하수관거 32km 신설, 하수처리장 1개소 신설이 핵심 공사이다. ADB 융자를 통해 진행되며 마감까지 30일이 남았다.',
            summaryLong: '아시아개발은행(ADB)의 융자를 통해 진행되는 호치민시 수환경 개선 사업의 WW-03 패키지이다. 발주처는 HCMC Urban Drainage Authority이며 도시 하수관거 32km 신설, 펌프장 3개소, 일 처리용량 15만톤 규모의 하수처리장 1개소 신설이 주요 공사 내용이다. 계약방식은 국제경쟁입찰(ICB) 방식이며 설계시공 일괄(D&B) 방식이 적용된다. 공사 기간은 착공 후 48개월이며 하자이행보증 기간은 준공 후 24개월이다.',
            qualificationText: '최근 10년 내 하수처리시설 또는 상하수도 공사 단일 계약 USD 3,000만 이상 완공 실적 보유. 설계시공 일괄입찰 경험 업체 우대. 베트남 환경 기준 준수 및 현지 하도급 비율 20% 이상 유지 요건 있음.',
            importantNotes: '현지 법인 또는 JV 구성이 가능하며 외국 기업 단독 참여도 허용됩니다. D&B 계약 특성상 기본설계안 제출이 입찰 서류에 포함되므로 기술 제안서 준비에 충분한 시간이 필요합니다. 현지 환경부 인허가 일정이 공사 착공에 영향을 미칠 수 있으므로 원문 확인 필요합니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 23,
            tagNames: ['water'],
        },
        {
            sourceId: unSource.id,
            sourceHash: 'hash-003-un-kenya-school',
            title: 'UNICEF Kenya - Construction of 50 Primary School Buildings in Turkana County',
            titleKo: '케냐 투르카나 주 초등학교 50개동 신축공사',
            projectNumber: 'UNICEF-KEN-2024-013',
            country: '케냐',
            region: '동아프리카',
            city: '투르카나',
            issuer: 'UNICEF Kenya Country Office',
            issuerType: 'UN',
            category: '건축',
            contractType: 'LCB',
            budget: 12000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 12,000,000',
            publishedAt: week_ago,
            deadlineAt: in7days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.ungm.org/Public/Notice/UNICEF-KEN-2024-013',
            summaryShort: 'UNICEF 케냐사무소가 발주하는 투르카나 주 초등학교 50개동 신축 공사로, USD 1,200만 규모의 건축 사업이다. 현지 경쟁입찰(LCB) 방식이며 마감이 7일밖에 남지 않아 신속한 서류 준비가 필요하다.',
            summaryLong: 'UNICEF 케냐 사무소가 발주하는 투르카나 주 교육 인프라 지원 사업으로, 초등학교 교실건물(각 4교실) 50개동을 신축한다. 총 200개 교실, 화장실, 급수시설이 포함된 학교 시설 일체를 대상으로 한다. 현지 경쟁입찰(LCB) 방식이며 케냐 법인 또는 현지 JV 파트너가 있어야 참여 가능하다. 공사 기간은 착공 후 18개월이며 내진 설계가 요구된다.',
            qualificationText: '케냐 내 건축공사 수행 실적 USD 300만 이상 필요. 케냐 법인 설립 또는 현지 건설업체와 JV 구성 필수. UNICEF 공급업체 등록(UNGM) 완료 필요.',
            importantNotes: '마감이 7일 이내로 매우 촉박합니다. UNGM 등록이 완료되지 않은 경우 입찰 참여가 불가능하므로 즉시 확인이 필요합니다. 현지 파트너사 선정 및 JV 계약 체결 시간이 필요하므로 즉각적인 검토가 요구됩니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 89,
            tagNames: ['building'],
        },
        {
            sourceId: worldBankSource.id,
            sourceHash: 'hash-004-wb-bangladesh-railway',
            title: 'Bangladesh Railway Sector Investment Program - Tranche 4: Dhaka-Ctg Double Line',
            titleKo: '방글라데시 철도 섹터 투자프로그램 4단계: 다카-치타공 복선화',
            projectNumber: 'BD-RAIL-T4-2024',
            country: '방글라데시',
            region: '남아시아',
            issuer: 'Bangladesh Railway / World Bank',
            issuerType: 'MDB',
            category: '철도',
            contractType: 'ICB',
            budget: 350000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 350 Million',
            publishedAt: month_ago,
            deadlineAt: in60days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://projects.worldbank.org/en/projects-operations/procurement/BD-RAIL-T4-2024',
            summaryShort: '방글라데시 다카-치타공 구간 철도 복선화 사업으로 USD 3억 5천만 규모의 대형 인프라 사업이다. 세계은행 융자 기반의 ICB 방식이며 마감까지 60일이 남아 있다.',
            summaryLong: '방글라데시 정부와 세계은행이 공동으로 추진하는 철도 현대화 사업의 4단계 트랜치로, 다카-치타공 간 복선화 292km를 대상으로 한다. 주요 공사 내용은 궤도 신설, 전기신호 시스템, 교량 24개소, 터널 3개소가 포함된다. ICB 방식이며 FIDIC Yellow Book(설계시공) 적용 예정이다. 이 구간은 방글라데시 최대 물동량 구간으로 사업 완료 시 운행 속도가 60km/h에서 120km/h로 향상 예정이다.',
            qualificationText: '최근 15년 내 복선 철도공사 단일 계약 USD 1억 5,000만 이상 완공 실적 필수. 전기신호 시스템 설치 경험 업체 우대. 방글라데시 또는 남아시아 지역 유사 사업 경험 보유 시 가산점.',
            importantNotes: '세계은행 OPCS 조달 지침 최신판 적용 예정이며 입찰 서류 검토 시 반드시 최신 버전 확인이 필요합니다. 입찰 보증금(Bid Security)은 계약금액의 2%이며 유효기간은 마감일로부터 180일입니다. 방글라데시 철도안전규정 준수 의무가 있으므로 현지 규제 전문가 사전 검토를 권장합니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 134,
            tagNames: ['railway', 'bridge'],
        },
        {
            sourceId: adbSource.id,
            sourceHash: 'hash-005-adb-philippine-port',
            title: 'Philippines: Regional Infrastructure for Growth - Mindanao Port Expansion',
            titleKo: '필리핀 민다나오 항만 확장 사업',
            projectNumber: 'PHI-RIG-P02',
            country: '필리핀',
            region: '동남아시아',
            city: '민다나오',
            issuer: 'Philippine Ports Authority / Asian Development Bank',
            issuerType: 'MDB',
            category: '항만',
            contractType: 'ICB',
            budget: 95000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 95,000,000',
            publishedAt: new Date(now.getTime() - 3 * 86400000),
            deadlineAt: in3days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.adb.org/projects/tenders/PHI-RIG-P02',
            summaryShort: 'ADB 융자 기반의 필리핀 민다나오 항만 확장 사업으로 USD 9,500만 규모이다. 컨테이너 부두 신설, 방파제 연장, 하역장비 도입이 주요 공사 내용이며 마감까지 3일밖에 남지 않았다.',
            summaryLong: '아시아개발은행(ADB)의 Regional Infrastructure for Growth 프로그램 하에 추진되는 필리핀 민다나오 항만 확장 프로젝트이다. 발주처는 Philippine Ports Authority이며 컨테이너 부두 300m 신설, 방파제 1.2km 연장, 야드 크레인 4기 도입, 컨테이너 야드 5ha 확장이 포함된다. ICB 방식이며 공사 기간은 36개월이다.',
            qualificationText: '최근 10년 내 항만 또는 해양 인프라 공사 단일 계약 USD 4,000만 이상 완공 실적 필수. 해상 토목공사 전문 엔지니어링 인력 보유 증명 필요. 방파제 설계 및 시공 경험 보유 필수.',
            importantNotes: '마감이 3일 이내로 매우 촉박한 상황입니다. 입찰 준비가 상당히 진행되어 있지 않다면 이번 입찰 참여는 어려울 수 있습니다. 현지 해양환경영향평가 완료 여부 원문 확인 필요합니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 201,
            tagNames: ['port'],
        },
        {
            sourceId: worldBankSource.id,
            sourceHash: 'hash-006-wb-ethiopia-energy',
            title: 'Ethiopia: Sustainable Energy for Rural Transformation (SErT) - Grid Extension Works',
            titleKo: '에티오피아 농촌 지역 그리드 확장 사업',
            projectNumber: 'ETH-SERT-GE2024',
            country: '에티오피아',
            region: '동아프리카',
            issuer: 'Ethiopian Electric Utility / World Bank',
            issuerType: 'MDB',
            category: '에너지',
            contractType: 'ICB',
            budget: 45000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 45,000,000',
            publishedAt: new Date(now.getTime() - 2 * 86400000),
            deadlineAt: in60days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://projects.worldbank.org/en/projects-operations/ETH-SERT-GE2024',
            summaryShort: '에티오피아 농촌 지역 전력망 확장 사업으로 765km 송배전선 신설이 핵심이다. USD 4,500만 규모이며 마감까지 60일이 남아 있다.',
            summaryLong: '세계은행 지원 하에 에티오피아 전력청(Ethiopian Electric Utility)이 발주하는 농촌 지역 전력화 사업이다. 765km의 중압배전선(33kV), 변전소 12개소, 마을 배전망 접속 설비가 포함된다. 공급, 설치, 시운전을 포함하는 EPC 방식이며 공사 기간은 36개월이다. 6개 지역에 5만 가구 전력 공급을 목표로 한다.',
            qualificationText: '최근 10년 내 농촌 전력화 또는 송배전 공사 완공 실적 USD 1,500만 이상 필요. EPC 방식 프로젝트 수행 경험 보유. 아프리카 지역 전력사업 경험 우대.',
            importantNotes: '에티오피아 현지 치안 상황에 대한 사전 파악이 필요하며 일부 지역은 접근이 제한될 수 있습니다. 외화 송금 규제와 현지통화(Birr) 환율 리스크를 계약 체결 전 검토해야 합니다. 세계은행 조달 지침상 무기명 회사 및 제재 기업의 참여가 제한됩니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 67,
            tagNames: ['energy'],
        },
        {
            sourceId: unSource.id,
            sourceHash: 'hash-007-undp-myanmar-ict',
            title: 'UNDP Myanmar - ICT Infrastructure and E-Government Platform Development',
            titleKo: '미얀마 ICT 인프라 및 전자정부 플랫폼 구축',
            projectNumber: 'UNDP-MMR-ICT-2024',
            country: '미얀마',
            region: '동남아시아',
            issuer: 'UNDP Myanmar Country Office',
            issuerType: 'UN',
            category: 'ICT',
            contractType: 'RFP',
            budget: 8500000,
            budgetCurrency: 'USD',
            budgetText: 'USD 8.5 Million',
            publishedAt: yesterday,
            deadlineAt: in14days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.ungm.org/Public/Notice/UNDP-MMR-ICT-2024',
            summaryShort: 'UNDP 미얀마사무소가 발주하는 전자정부 플랫폼 구축 사업으로 USD 850만 규모이다. 정부 데이터센터 구축, 클라우드 전환, 시민 서비스 포털 개발이 포함되며 마감까지 14일이 남았다.',
            summaryLong: 'UNDP 미얀마 사무소의 거버넌스 지원 프로그램의 일환으로 진행되는 전자정부 플랫폼 구축 사업이다. 주요 내용은 데이터센터 인프라 구축, 하이브리드 클라우드 환경 구성, 시민 서비스 통합 포털 개발, 7개 부처 행정 시스템 연계, 사이버보안 체계 구축이다. RFP 방식이며 기술 제안서와 재무 제안서를 분리 제출해야 한다.',
            qualificationText: '전자정부 또는 공공 IT 시스템 구축 프로젝트 완공 실적 3건 이상 필요. UNDP 공급업체 등록 완료 필요. 관련 국제 인증(ISO 27001 등) 보유 업체 우대.',
            importantNotes: '미얀마 현재 정치 상황으로 인해 사업 일정에 변동이 있을 수 있으며 원문의 최신 상황 확인이 필요합니다. 현지 법인 설립 또는 현지 기업과의 협력이 필요할 수 있으며 원문 확인 필요합니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 41,
            tagNames: ['ict'],
        },
        {
            sourceId: adbSource.id,
            sourceHash: 'hash-008-adb-pakistan-road',
            title: 'Pakistan: National Highway Development Project - M-14 Motorway Section',
            titleKo: '파키스탄 국도개발사업 M-14 고속도로 구간',
            projectNumber: 'PAK-NHDP-M14',
            country: '파키스탄',
            region: '남아시아',
            issuer: 'National Highway Authority / ADB',
            issuerType: 'MDB',
            category: '도로',
            contractType: 'ICB',
            budget: 220000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 220 Million',
            publishedAt: new Date(now.getTime() - 5 * 86400000),
            deadlineAt: in30days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.adb.org/projects/tenders/PAK-NHDP-M14',
            summaryShort: 'ADB 융자를 통한 파키스탄 M-14 고속도로(Hakla-D.I. Khan) 구간 공사로 USD 2억 2천만 규모의 대형 사업. 편도 2차로 고속도로 285km를 건설하며 마감까지 30일이 남아 있다.',
            summaryLong: '아시아개발은행 융자를 통해 파키스탄 국도개발청(NHA)이 발주하는 M-14 고속도로 프로젝트이다. Hakla-D.I. Khan 구간 285km의 편도 2차로(왕복 4차로) 고속도로를 건설하는 사업으로, 고속도로 본선, 인터체인지 9개소, 교량 41개소, 졸음쉼터가 포함된다. ICB 방식이며 공사 기간은 54개월이다.',
            qualificationText: '최근 10년 내 고속도로 또는 주요 간선도로 단일 계약 USD 8,000만 이상 완공 실적 필요. 교량 설계 및 시공 경험 포함. JV 구성 가능하며 단일 업체 최소 지분 30% 이상 유지 필요.',
            importantNotes: '파키스탄 일부 지역의 치안 리스크를 사전에 파악하고 보험 조건을 검토해야 합니다. ADB 환경사회보호정책(SPS) 준수 의무가 있으며 환경영향 저감 계획 제출이 요구됩니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 98,
            tagNames: ['road', 'bridge'],
        },
        {
            sourceId: null,
            sourceHash: 'hash-009-manual-cambodia-bridge',
            title: 'Cambodia: Mekong River Bridge Construction at Neak Loeung - Replacement and Widening',
            titleKo: '캄보디아 메콩강 닉루엉 교량 건설 (교체 및 확장)',
            projectNumber: 'KHM-MRB-2024',
            country: '캄보디아',
            region: '동남아시아',
            city: '프놈펜',
            issuer: 'Ministry of Public Works and Transport Cambodia',
            issuerType: 'GOVERNMENT',
            category: '교량',
            contractType: 'ICB',
            budget: 185000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 185 Million',
            publishedAt: new Date(now.getTime() - 10 * 86400000),
            deadlineAt: in60days,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://www.mpwt.gov.kh/tenders/KHM-MRB-2024',
            summaryShort: '캄보디아 메콩강 닉루엉 교량 교체 및 확장 사업으로 USD 1억 8,500만 규모이다. 길이 3.2km, 왕복 4차로+보행자 통로 복합 교량 신설이며 마감까지 60일이 남았다.',
            summaryLong: '캄보디아 공공사업교통부(MPWT)가 발주하는 메콩강 닉루엉 구간 교량 사업이다. 기존 페리 항로를 대체하는 길이 3,214m 규모의 사장교(Cable-Stayed Bridge) 신설로, 왕복 4차로, 양측 보행자 및 자전거도로가 포함된다. 일본 JICA 차관 기반이며 ICB 방식으로 진행된다. 공사 기간은 착공 후 60개월이며 지진 동하중 설계가 요구된다.',
            qualificationText: '최근 15년 내 장대교량(주경간 200m 이상) 단일 계약 USD 8,000만 이상 완공 실적 필수. 사장교 또는 현수교 시공 경험 보유 업체. JICA 차관 포함 ODA 사업 수행 경험 우대.',
            importantNotes: 'JICA 차관 사업임에 따라 일본 JICA 조달 지침이 적용되며 세계은행 기준과 상이할 수 있으므로 별도 검토가 필요합니다. 캄보디아 현지 환경규제 및 문화재 영향 평가 요건 원문 확인 필요합니다.',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 155,
            isManual: true,
            tagNames: ['bridge'],
        },
        {
            sourceId: worldBankSource.id,
            sourceHash: 'hash-010-wb-nigeria-water-supply',
            title: 'Nigeria: Lagos State Urban Water Supply Rehabilitation Project',
            titleKo: '나이지리아 라고스주 도시 수돗물 공급시설 개보수 사업',
            projectNumber: 'NGA-LAGOS-WS2024',
            country: '나이지리아',
            region: '서아프리카',
            city: '라고스',
            issuer: 'Lagos State Water Corporation / World Bank',
            issuerType: 'MDB',
            category: '상하수도',
            contractType: 'ICB',
            budget: 62000000,
            budgetCurrency: 'USD',
            budgetText: 'USD 62 Million',
            publishedAt: new Date(now.getTime() - 14 * 86400000),
            deadlineAt: tomorrow,
            status: TenderStatus.OPEN,
            language: 'en',
            originalUrl: 'https://projects.worldbank.org/NGA-LAGOS-WS2024',
            summaryShort: '나이지리아 라고스주 도시 상수도 공급 시설 개보수 및 확장 사업이다. 내일이 마감으로 사실상 참여가 불가능에 가까운 상황이다.',
            summaryLong: '세계은행 융자로 라고스주 수도공사(LSWC)가 발주하는 상수도 시설 개보수 사업이다. 주요 공사는 노후 배수관 180km 교체, 정수장 2개소 용량 증설(일 60만 m³ → 80만 m³), 스마트미터 5만 가구 설치이다. ICB 방식이며 설계 및 시공을 포함한다.',
            qualificationText: '최근 10년 내 상수도 시설 rehabilitation 또는 신설 단일 계약 USD 2,500만 이상 완공 실적 필요.',
            importantNotes: '마감일이 내일(1일 이내)로 이미 입찰 준비가 완료된 상태가 아니라면 이번 공고 참여는 사실상 어렵습니다. 향후 유사 사업에 대비하여 발주처 정보를 파악해두는 것을 권장합니다',
            aiProcessedAt: now,
            aiModel: 'gpt-4o-mock',
            viewCount: 312,
            tagNames: ['water'],
        },
    ]

    const createdTenders: string[] = []
    for (const t of tendersData) {
        const { tagNames, ...tenderData } = t
        const tender = await prisma.tender.upsert({
            where: { sourceHash: tenderData.sourceHash },
            update: {},
            create: {
                ...tenderData,
                budget: tenderData.budget ? tenderData.budget : null,
            } as any,
        })
        createdTenders.push(tender.id)

        // 태그 연결
        for (const tagName of tagNames) {
            if (tags[tagName]) {
                await prisma.tenderTag.upsert({
                    where: { tenderId_tagId: { tenderId: tender.id, tagId: tags[tagName] } },
                    update: {},
                    create: { tenderId: tender.id, tagId: tags[tagName] },
                })
            }
        }

        // 원문 텍스트
        await prisma.tenderRawContent.upsert({
            where: { tenderId: tender.id },
            update: {},
            create: {
                tenderId: tender.id,
                rawText: `[원문 텍스트 샘플] ${tenderData.title}\n\nProject Number: ${tenderData.projectNumber}\nCountry: ${tenderData.country}\nIssuer: ${tenderData.issuer}\nContract Type: ${tenderData.contractType}\nBudget: ${tenderData.budgetText}\nDeadline: ${tenderData.deadlineAt}\n\n[Full document text would be here after crawling]`,
                language: 'en',
                charCount: 500,
            },
        })

        // 첨부파일 샘플
        await prisma.tenderFile.createMany({
            data: [
                {
                    tenderId: tender.id,
                    fileName: 'Bidding_Documents.pdf',
                    fileUrl: `${tenderData.originalUrl}/documents/bid-docs.pdf`,
                    fileType: 'application/pdf',
                    fileSizeBytes: 2048000,
                    description: '입찰 도서 전문',
                },
                {
                    tenderId: tender.id,
                    fileName: 'Instructions_to_Bidders.pdf',
                    fileUrl: `${tenderData.originalUrl}/documents/itb.pdf`,
                    fileType: 'application/pdf',
                    fileSizeBytes: 512000,
                    description: '입찰자 지침서',
                },
            ],
            skipDuplicates: true,
        })
    }

    console.log('✅ Tenders created with raw content and files')

    // ─── 북마크 생성 ───────────────────────────
    if (createdTenders.length >= 3) {
        await prisma.bookmark.createMany({
            data: [
                { userId: user1.id, tenderId: createdTenders[0], note: '인도네시아 도로 - 검토 필요' },
                { userId: user1.id, tenderId: createdTenders[3], note: '방글라데시 철도 - 팀장 보고 예정' },
                { userId: user1.id, tenderId: createdTenders[8], note: '캄보디아 교량 - JICA 경험 있음' },
                { userId: user2.id, tenderId: createdTenders[1], note: '베트남 수처리 - 수처리팀 검토 요청' },
                { userId: user2.id, tenderId: createdTenders[4], note: '필리핀 항만 - 급함! 내일까지 검토' },
            ],
            skipDuplicates: true,
        })
    }

    console.log('✅ Bookmarks created')

    // ─── 알림 규칙 생성 ───────────────────────────
    await prisma.alertRule.createMany({
        data: [
            {
                userId: user1.id,
                name: '동남아 도로/교량 사업 알림',
                isActive: true,
                emailEnabled: true,
                countries: ['인도네시아', '베트남', '필리핀', '캄보디아', '미얀마', '태국'],
                categories: ['도로', '교량'],
                keywords: ['highway', 'road', 'bridge', 'motorway'],
                minBudget: 50000000,
                deadlineInDays: 30,
                notifyOnNew: true,
                notifyBeforeDays: 7,
            },
            {
                userId: user1.id,
                name: '세계은행 ICB 신규 공고',
                isActive: true,
                emailEnabled: true,
                countries: [],
                categories: [],
                keywords: ['World Bank', 'ICB', 'international competitive'],
                minBudget: 100000000,
                notifyOnNew: true,
            },
            {
                userId: user2.id,
                name: '아프리카 건설 사업 알림',
                isActive: true,
                emailEnabled: true,
                countries: ['케냐', '에티오피아', '나이지리아', '가나', '탄자니아'],
                categories: ['건축', '토목', '상하수도'],
                keywords: [],
                minBudget: 10000000,
                notifyOnNew: true,
                notifyBeforeDays: 14,
            },
        ],
        skipDuplicates: true,
    })

    console.log('✅ Alert rules created')

    // ─── 크롤링 로그 생성 ───────────────────────────
    await prisma.crawlLog.createMany({
        data: [
            {
                sourceId: worldBankSource.id,
                status: CrawlStatus.SUCCESS,
                startedAt: new Date(now.getTime() - 2 * 3600000),
                finishedAt: new Date(now.getTime() - 2 * 3600000 + 45000),
                durationMs: 45000,
                totalFetched: 42,
                newCreated: 3,
                updated: 5,
                duplicates: 34,
                errors: 0,
                triggeredBy: 'cron',
            },
            {
                sourceId: adbSource.id,
                status: CrawlStatus.SUCCESS,
                startedAt: new Date(now.getTime() - 3 * 3600000),
                finishedAt: new Date(now.getTime() - 3 * 3600000 + 62000),
                durationMs: 62000,
                totalFetched: 28,
                newCreated: 2,
                updated: 3,
                duplicates: 23,
                errors: 0,
                triggeredBy: 'cron',
            },
            {
                sourceId: unSource.id,
                status: CrawlStatus.PARTIAL,
                startedAt: new Date(now.getTime() - 4 * 3600000),
                finishedAt: new Date(now.getTime() - 4 * 3600000 + 91000),
                durationMs: 91000,
                totalFetched: 15,
                newCreated: 1,
                updated: 8,
                duplicates: 5,
                errors: 1,
                errorMessage: 'Timeout on page 3 of results. Partial data collected.',
                triggeredBy: 'cron',
            },
            {
                sourceId: worldBankSource.id,
                status: CrawlStatus.FAILED,
                startedAt: new Date(now.getTime() - 26 * 3600000),
                finishedAt: new Date(now.getTime() - 26 * 3600000 + 5000),
                durationMs: 5000,
                totalFetched: 0,
                newCreated: 0,
                updated: 0,
                duplicates: 0,
                errors: 1,
                errorMessage: 'HTTP 503: Service Unavailable - World Bank procurement site temporarily down',
                triggeredBy: 'cron',
            },
            {
                sourceId: null,
                status: CrawlStatus.SUCCESS,
                startedAt: new Date(now.getTime() - 1 * 3600000),
                finishedAt: new Date(now.getTime() - 1 * 3600000 + 120000),
                durationMs: 120000,
                totalFetched: 8,
                newCreated: 1,
                updated: 2,
                duplicates: 5,
                errors: 0,
                triggeredBy: 'manual',
            },
        ],
        skipDuplicates: true,
    })

    console.log('✅ Crawl logs created')

    // ─── 내부 메모 생성 ───────────────────────────
    if (createdTenders.length >= 3) {
        await prisma.internalNote.createMany({
            data: [
                {
                    tenderId: createdTenders[0],
                    userId: user1.id,
                    content: '현지 파트너사로 PT. Hutama Karya 검토 중. 사장님께 내주까지 보고 예정.',
                    isPrivate: false,
                },
                {
                    tenderId: createdTenders[3],
                    userId: user2.id,
                    content: '방글라데시 철도청 담당자 연락처 확보 완료. 다음 주 온라인 미팅 예정.',
                    isPrivate: false,
                },
                {
                    tenderId: createdTenders[4],
                    userId: user2.id,
                    content: '항만 팀과 협의 완료. 기술 제안서 초안 작성 시작. 마감 3일 전 최종 검토.',
                    isPrivate: false,
                },
            ],
            skipDuplicates: true,
        })
    }

    console.log('✅ Internal notes created')
    console.log('\n🎉 Seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log('  - Users: 3 (1 admin, 2 users)')
    console.log('  - Sources: 4')
    console.log('  - Tenders: 10')
    console.log('  - Tags: 8')
    console.log('  - Bookmarks: 5')
    console.log('  - Alert Rules: 3')
    console.log('  - Crawl Logs: 5')
    console.log('\n🔑 Login credentials:')
    console.log('  Admin: admin@haegun.or.kr / admin1234!')
    console.log('  User1: jungho@haegun.or.kr / user1234!')
    console.log('  User2: soojin@haegun.or.kr / user1234!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
