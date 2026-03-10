import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-'
    return format(new Date(date), 'yyyy.MM.dd', { locale: ko })
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '-'
    return format(new Date(date), 'yyyy.MM.dd HH:mm', { locale: ko })
}

export function formatRelative(date: Date | string | null | undefined): string {
    if (!date) return '-'
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}

export function getDaysUntil(date: Date | string | null | undefined): number | null {
    if (!date) return null
    return differenceInDays(new Date(date), new Date())
}

export function formatBudget(amount: number | null | undefined, currency?: string | null): string {
    if (amount === null || amount === undefined) return '-'
    const formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(Number(amount))
    return `${currency || 'USD'} ${formatted}`
}

export function getDeadlineStatus(deadlineAt: Date | string | null | undefined): {
    label: string
    color: string
    urgent: boolean
} {
    const days = getDaysUntil(deadlineAt)
    if (days === null) return { label: '마감일 미정', color: 'text-muted-foreground', urgent: false }
    if (days < 0) return { label: '마감완료', color: 'text-muted-foreground', urgent: false }
    if (days === 0) return { label: '오늘 마감', color: 'text-red-600', urgent: true }
    if (days <= 3) return { label: `D-${days}`, color: 'text-red-600', urgent: true }
    if (days <= 7) return { label: `D-${days}`, color: 'text-orange-500', urgent: true }
    if (days <= 14) return { label: `D-${days}`, color: 'text-yellow-600', urgent: false }
    return { label: `D-${days}`, color: 'text-muted-foreground', urgent: false }
}
