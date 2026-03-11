import { PrismaClient, UserRole, SourceType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SOURCES = [
    {
        id: 'source-worldbank',
        name: 'World Bank - Projects & Operations',
        url: 'https://projects.worldbank.org',
        sourceType: SourceType.API,
        crawlerType: 'WORLDBANK_API',
        description: '세계은행 조달 공고 (공개 JSON API)',
        listUrlPattern: 'https://search.worldbank.org/api/v2/wds',
        isActive: true,
    },
    {
        id: 'source-adb',
        name: 'ADB - Asian Development Bank',
        url: 'https://www.adb.org',
        sourceType: SourceType.RSS,
        crawlerType: 'ADB_RSS',
        description: '아시아개발은행 조달 공고 (RSS)',
        listUrlPattern: 'https://www.adb.org/rss/projects.xml',
        isActive: true,
    },
    {
        id: 'source-ungm',
        name: 'UNGM - United Nations Global Marketplace',
        url: 'https://www.ungm.org',
        sourceType: SourceType.WEB,
        crawlerType: 'UNGM_SCRAPE',
        description: '유엔 글로벌 마켓플레이스 공개 공고',
        listUrlPattern: 'https://www.ungm.org/Public/Notice',
        isActive: true,
    },
    {
        id: 'source-afdb',
        name: 'AfDB - African Development Bank',
        url: 'https://www.afdb.org',
        sourceType: SourceType.RSS,
        crawlerType: 'AFDB_RSS',
        description: '아프리카개발은행 조달 공고 (RSS)',
        listUrlPattern: 'https://www.afdb.org/en/rss/projects-and-operations/procurement',
        isActive: true,
    },
    {
        id: 'source-aiib',
        name: 'AIIB - Asian Infrastructure Investment Bank',
        url: 'https://www.aiib.org',
        sourceType: SourceType.WEB,
        crawlerType: 'AIIB_SCRAPE',
        description: '아시아인프라투자은행 조달 공고',
        listUrlPattern: 'https://www.aiib.org/en/opportunities/business/project-procurement/list.html',
        isActive: true,
    },
    {
        id: 'source-eib',
        name: 'EIB - European Investment Bank',
        url: 'https://www.eib.org',
        sourceType: SourceType.RSS,
        crawlerType: 'EIB_RSS',
        description: '유럽투자은행 입찰 공고 (RSS)',
        listUrlPattern: 'https://www.eib.org/en/projects/calls/rss.htm',
        isActive: true,
    },
    {
        id: 'source-iadb',
        name: 'IADB - Inter-American Development Bank',
        url: 'https://www.iadb.org',
        sourceType: SourceType.RSS,
        crawlerType: 'IADB_RSS',
        description: '미주개발은행 조달 공고 (RSS)',
        listUrlPattern: 'https://www.iadb.org/en/rss/news',
        isActive: true,
    },
    {
        id: 'source-ifc',
        name: 'IFC - International Finance Corporation',
        url: 'https://disclosures.ifc.org',
        sourceType: SourceType.API,
        crawlerType: 'IFC_API',
        description: 'IFC 공개 프로젝트 (World Bank API)',
        listUrlPattern: 'https://search.worldbank.org/api/v2/wds',
        isActive: true,
    },
    {
        id: 'source-isdb',
        name: 'IsDB - Islamic Development Bank',
        url: 'https://www.isdb.org',
        sourceType: SourceType.WEB,
        crawlerType: 'ISDB_SCRAPE',
        description: '이슬람개발은행 조달 공고',
        listUrlPattern: 'https://www.isdb.org/project-procurement/procurement-notices',
        isActive: true,
    },
    {
        id: 'source-cabei',
        name: 'CABEI - Central American Bank for Economic Integration',
        url: 'https://www.bcie.org',
        sourceType: SourceType.WEB,
        crawlerType: 'CABEI_SCRAPE',
        description: '중미경제통합은행 조달 공고',
        listUrlPattern: 'https://www.bcie.org/proyectos-y-actividades/adquisiciones/',
        isActive: true,
    },
    {
        id: 'source-ted',
        name: 'TED - Tenders Electronic Daily (EU)',
        url: 'https://ted.europa.eu',
        sourceType: SourceType.WEB,
        crawlerType: null,
        description: '유럽연합 전자 입찰 공고 (준비 중)',
        listUrlPattern: 'https://ted.europa.eu',
        isActive: false,
    },
]

async function main() {
    console.log('🌱 Seeding...')

    // ─── Users ─────────────────────────────────────────────────
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

    console.log('✅ Users (3)')

    // ─── Sources ────────────────────────────────────────────────
    for (const src of SOURCES) {
        await prisma.source.upsert({
            where: { id: src.id },
            update: { crawlerType: src.crawlerType, isActive: src.isActive, description: src.description },
            create: {
                id: src.id,
                name: src.name,
                url: src.url,
                sourceType: src.sourceType,
                crawlerType: src.crawlerType,
                description: src.description,
                listUrlPattern: src.listUrlPattern,
                cronSchedule: '0 6 * * *',
                isActive: src.isActive,
            },
        })
    }
    console.log(`✅ Sources (${SOURCES.length} — ${SOURCES.filter((s) => s.isActive).length} active)`)

    // ─── Tags ───────────────────────────────────────────────────
    const tagData = [
        { name: 'road', nameKo: '도로', color: '#3B82F6' },
        { name: 'bridge', nameKo: '교량', color: '#8B5CF6' },
        { name: 'water', nameKo: '상하수도', color: '#06B6D4' },
        { name: 'building', nameKo: '건축', color: '#10B981' },
        { name: 'railway', nameKo: '철도', color: '#F59E0B' },
        { name: 'port', nameKo: '항만', color: '#EF4444' },
        { name: 'energy', nameKo: '에너지', color: '#F97316' },
        { name: 'ict', nameKo: 'ICT', color: '#6366F1' },
        { name: 'health', nameKo: '보건', color: '#EC4899' },
        { name: 'education', nameKo: '교육', color: '#14B8A6' },
    ]
    for (const t of tagData) {
        await prisma.tag.upsert({ where: { name: t.name }, update: {}, create: t })
    }
    console.log('✅ Tags (10)')

    // ─── Alert Rules ────────────────────────────────────────────
    await prisma.alertRule.createMany({
        skipDuplicates: true,
        data: [
            {
                userId: user1.id,
                name: '동남아 도로/교량 사업 알림',
                isActive: true,
                emailEnabled: true,
                countries: ['인도네시아', '베트남', '필리핀', '캄보디아', '미얀마', '태국'],
                categories: ['도로', '교량', '도로/교통'],
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
                categories: ['건축', '토목', '상하수도', '토목/건설'],
                keywords: [],
                minBudget: 10000000,
                notifyOnNew: true,
                notifyBeforeDays: 14,
            },
        ],
    })
    console.log('✅ Alert Rules (3)')

    console.log('\n🎉 Seed complete!')
    console.log('\n🔑 Login:')
    console.log('  admin@haegun.or.kr / admin1234!')
    console.log('  jungho@haegun.or.kr / user1234!')
    console.log('\n📡 /admin → 수동 실행으로 실제 데이터 수집')
}

main()
    .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
