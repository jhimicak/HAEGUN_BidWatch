/**
 * 알림 모듈
 * 사용자 alert_rules 조건과 매칭되는 신규 tenders를 찾아 이메일 발송
 */
import { prisma } from './prisma'

interface MatchResult {
    userId: string
    ruleId: string
    tenderIds: string[]
}

/**
 * alert_rules 조건과 신규 공고를 매칭
 */
export async function matchAlertRules(sinceHours: number = 24): Promise<MatchResult[]> {
    const since = new Date(Date.now() - sinceHours * 3600000)

    const [rules, newTenders] = await Promise.all([
        prisma.alertRule.findMany({
            where: { isActive: true, notifyOnNew: true },
        }),
        prisma.tender.findMany({
            where: { createdAt: { gte: since }, status: 'OPEN' },
        }),
    ])

    const results: MatchResult[] = []

    for (const rule of rules) {
        const matched: string[] = []

        for (const tender of newTenders) {
            // Country filter
            if (rule.countries.length > 0 && !rule.countries.includes(tender.country)) continue
            // Category filter
            if (rule.categories.length > 0 && tender.category && !rule.categories.includes(tender.category)) continue
            // Keyword filter
            if (rule.keywords.length > 0) {
                const haystack = `${tender.title} ${tender.titleKo || ''} ${tender.issuer}`.toLowerCase()
                const hasKeyword = rule.keywords.some((kw) => haystack.includes(kw.toLowerCase()))
                if (!hasKeyword) continue
            }
            // Budget filter
            if (rule.minBudget && tender.budget && Number(tender.budget) < Number(rule.minBudget)) continue
            // Deadline filter
            if (rule.deadlineInDays && tender.deadlineAt) {
                const daysLeft = Math.ceil((new Date(tender.deadlineAt).getTime() - Date.now()) / 86400000)
                if (daysLeft > rule.deadlineInDays) continue
            }

            matched.push(tender.id)
        }

        if (matched.length > 0) {
            results.push({ userId: rule.userId, ruleId: rule.id, tenderIds: matched })
        }
    }

    return results
}

/**
 * 이메일 발송 (stub - nodemailer 구조만 준비)
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    const smtpHost = process.env.SMTP_HOST
    if (!smtpHost || smtpHost === 'smtp.gmail.com') {
        console.log(`[Notify] [MOCK EMAIL] To: ${to}\nSubject: ${subject}\n${html.slice(0, 200)}...`)
        return
    }

    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'HAEGUN BidWatch <no-reply@haegun-bidwatch.com>',
        to,
        subject,
        html,
    })
}

/**
 * 알림 발송 실행
 */
export async function runNotifications(): Promise<void> {
    const matches = await matchAlertRules(24)

    for (const { userId, ruleId, tenderIds } of matches) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user?.email) continue

        const rule = await prisma.alertRule.findUnique({ where: { id: ruleId } })
        if (!rule?.emailEnabled) continue

        const tenders = await prisma.tender.findMany({
            where: { id: { in: tenderIds } },
        })

        const tenderList = tenders
            .map(
                (t) => `<li><a href="http://localhost:3000/tenders/${t.id}">${t.titleKo || t.title}</a><br>
          ${t.country} | 마감: ${t.deadlineAt ? new Date(t.deadlineAt).toLocaleDateString('ko-KR') : '-'}</li>`
            )
            .join('')

        const html = `
<h2>해건 비드워치 - 새 공고 알림</h2>
<p>알림 규칙 <strong>${rule.name}</strong>에 맞는 ${tenders.length}건의 신규 공고가 있습니다.</p>
<ul>${tenderList}</ul>
<p><a href="http://localhost:3000/tenders">전체 공고 보기</a></p>
<hr><p style="color:#999;font-size:12px">해외건설협회 비드워치에서 발송되었습니다.</p>`

        await sendEmail(
            user.email,
            `[비드워치] ${tenders.length}건의 새 해외 입찰공고가 등록되었습니다`,
            html
        )

        // Save notification record
        await prisma.notification.create({
            data: {
                userId,
                alertRuleId: ruleId,
                type: 'NEW_TENDER',
                channel: 'email',
                title: `알림: ${tenders.length}건의 신규 공고`,
                body: tenders.map((t) => t.titleKo || t.title).join(', '),
                isSent: true,
                sentAt: new Date(),
            },
        })

        // Update rule trigger count
        await prisma.alertRule.update({
            where: { id: ruleId },
            data: { triggerCount: { increment: 1 }, lastTriggeredAt: new Date() },
        })
    }
}
