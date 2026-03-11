import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    const tender = await prisma.tender.findUnique({
        where: { id: params.id },
        include: {
            tags: { include: { tag: true } },
            files: true,
            rawContent: true,
            internalNotes: {
                orderBy: { createdAt: 'asc' },
                include: { user: { select: { name: true } } },
            },
        },
    })

    if (!tender) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // View count
    await prisma.tender.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } })

    // Is bookmarked
    let isBookmarked = false
    if (userId) {
        const bookmark = await prisma.bookmark.findUnique({
            where: { userId_tenderId: { userId, tenderId: params.id } },
        })
        isBookmarked = !!bookmark
    }

    return NextResponse.json({ ...tender, isBookmarked })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const body = await req.json()
    const tender = await prisma.tender.update({ where: { id: params.id }, data: body })
    return NextResponse.json(tender)
}
