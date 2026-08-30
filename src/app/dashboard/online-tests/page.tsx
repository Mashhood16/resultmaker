import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { requireSchoolOrTeacherAccess } from '../auth-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, MonitorPlay } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function OnlineTestsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'student') redirect('/dashboard')

  const access = await requireSchoolOrTeacherAccess()
  if (!access) redirect('/dashboard')

  const { isTeacher, classIds } = access

  // Fetch online tests created by this school
  const tests = await prisma.onlineTest.findMany({
    where: {
      schoolId: access.schoolId,
      ...(isTeacher ? { classId: { in: classIds } } : {})
    },
    include: {
      class: true,
      subject: true,
      _count: {
        select: { variants: true, attempts: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const liveTests = tests.filter(t => t.isActive)
  const pastTests = tests.filter(t => !t.isActive)

  const renderTestCard = (test: any) => (
    <Card key={test.id} className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{test.title}</CardTitle>
            <CardDescription className="mt-1">{test.class.name} • {test.subject.name}</CardDescription>
          </div>
          <div className={`px-2 py-1 text-xs font-bold rounded-full ${test.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            {test.isActive ? 'Live' : (test._count.attempts > 0 ? 'Completed' : 'Draft')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-muted-foreground mb-4">
          <span>{test._count.variants} Variants</span>
          <span>{test._count.attempts} Attempts</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/online-tests/${test.id}/grade`} className="w-full">
            <Button className="w-full">Grade Submissions</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Online Tests</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage anti-cheat online tests.
          </p>
        </div>
        
        <Link href="/dashboard/online-tests/create">
          <Button className="rounded-full shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Test
          </Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MonitorPlay className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tests yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first online test with multiple variants to prevent cheating in the classroom.
            </p>
            <Link href="/dashboard/online-tests/create">
              <Button>Create Test</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {liveTests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Tests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveTests.map(renderTestCard)}
              </div>
            </div>
          )}
          
          {pastTests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
                Past Tests & Drafts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                {pastTests.map(renderTestCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
