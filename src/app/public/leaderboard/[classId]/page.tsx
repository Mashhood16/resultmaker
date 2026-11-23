import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function PublicClassLeaderboardRedirectPage({
  params,
  searchParams
}: {
  params: { classId: string }
  searchParams?: { view?: string }
}) {
  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      school: {
        select: { id: true, name: true }
      }
    }
  })

  if (!classData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Leaderboard Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The public leaderboard you are trying to access does not exist, or the link is invalid. Please contact the class teacher or school administrator.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="border-border">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const viewQuery = searchParams?.view ? `?view=${encodeURIComponent(searchParams.view)}` : ''
  redirect(`/public/leaderboard/${classData.id}/overall${viewQuery}`)
}
