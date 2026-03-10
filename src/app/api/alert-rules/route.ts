import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rules = await prisma.alertRule.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const rule = await prisma.alertRule.create({
        data: { ...body, userId },
    })
    return NextResponse.json(rule, { status: 201 })
}
