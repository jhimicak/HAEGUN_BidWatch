import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="ml-56">
                <main className="min-h-screen">{children}</main>
            </div>
        </div>
    )
}
