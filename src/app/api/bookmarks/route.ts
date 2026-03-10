import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bookmarks = await prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { tender: { select: { id: true, title: true, titleKo: true, country: true, issuer: true, category: true, deadlineAt: true, budget: true, budgetCurrency: true } } },
    })
    return NextResponse.json(bookmarks)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenderId, note } = await req.json()
    const bookmark = await prisma.bookmark.upsert({
        where: { userId_tenderId: { userId, tenderId } },
        update: { note },
        create: { userId, tenderId, note },
    })
    return NextResponse.json(bookmark, { status: 201 })
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenderId } = await req.json()
    await prisma.bookmark.delete({ where: { userId_tenderId: { userId, tenderId } } })
    return NextResponse.json({ success: true })
}
