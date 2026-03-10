import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const country = searchParams.get('country') || ''
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const skip = (page - 1) * limit

    const where: any = { status: 'OPEN' }
    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { titleKo: { contains: q, mode: 'insensitive' } },
            { issuer: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } },
        ]
    }
    if (country) where.country = { contains: country, mode: 'insensitive' }
    if (category) where.category = { contains: category, mode: 'insensitive' }

    const orderBy: any =
        sort === 'deadline'
            ? { deadlineAt: 'asc' }
            : sort === 'budget'
                ? { budget: 'desc' }
                : { publishedAt: 'desc' }

    const [tenders, total] = await Promise.all([
        prisma.tender.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
                id: true,
                title: true,
                titleKo: true,
                country: true,
                issuer: true,
                category: true,
                contractType: true,
                budget: true,
                budgetCurrency: true,
                publishedAt: true,
                deadlineAt: true,
                status: true,
                summaryShort: true,
                tags: { include: { tag: { select: { name: true, nameKo: true } } } },
            },
        }),
        prisma.tender.count({ where }),
    ])

    return NextResponse.json({ tenders, total, page, limit })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { sourceHash } = body
    if (!sourceHash) return NextResponse.json({ error: 'sourceHash required' }, { status: 400 })

    const tender = await prisma.tender.create({ data: body })
    return NextResponse.json(tender, { status: 201 })
}
