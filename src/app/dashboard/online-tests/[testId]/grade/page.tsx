import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from '../../../auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'

import { RefreshButton } from './refresh-button'
import { EndTestButton } from './end-test-button'

export const dynamic = 'force-dynamic'

export default async function GradingListPage({ params }: { params: { testId: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const access = await requireSchoolOrTeacherAccess()
  if (!access) redirect('/dashboard')

  const test = await prisma.onlineTest.findUnique({
    where: { id: params.testId },
    include: {
      class: true,
      subject: true,
      attempts: {
        include: {
          student: true,
          variant: true
        },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  if (!test) redirect('/dashboard/online-tests')

  // Enforce tenant isolation
  if (test.schoolId !== access.schoolId) {
    redirect('/dashboard/online-tests')
  }

  // Only allow if teacher has access to this class and subject, or is school
  if (access.isTeacher) {
    if (!access.classIds.includes(test.classId)) {
      redirect('/dashboard/online-tests')
    }
    const teacherSubjects = session.user.subjectAccess?.[test.classId] || []
    if (!teacherSubjects.includes(test.subjectId)) {
      redirect('/dashboard/online-tests')
    }
  }

  const submitted = test.attempts.filter(a => a.status === 'SUBMITTED')
  const graded = test.attempts.filter(a => a.status === 'GRADED')
  const inProgress = test.attempts.filter(a => a.status === 'IN_PROGRESS')

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Test: {test.title}</h1>
          <p className="text-muted-foreground mt-1">{test.class.name} • {test.subject.name}</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <EndTestButton testId={test.id} isActive={test.isActive} />
          <RefreshButton />
          <span className="text-yellow-500 flex items-center gap-1"><Clock className="w-4 h-4"/> {submitted.length} Needs Grading</span>
          <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {graded.length} Graded</span>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-bold">Needs Grading ({submitted.length})</h2>
        {submitted.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">All caught up!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submitted.map(attempt => (
              <Card key={attempt.id} className="border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{attempt.student.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Roll: {attempt.student.rollNumber} • {attempt.variant.name}</p>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/online-tests/${test.id}/grade/${attempt.id}`}>
                    <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Review & Grade</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-bold">Graded ({graded.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {graded.map(attempt => (
            <Card key={attempt.id} className="border-green-500/20 opacity-75 hover:opacity-100 transition-opacity">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{attempt.student.name}</CardTitle>
                  <span className="font-black text-green-500">{attempt.obtainedMarks} / {test.totalMarks}</span>
                </div>
                <p className="text-xs text-muted-foreground">{attempt.variant.name}</p>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/online-tests/${test.id}/grade/${attempt.id}`}>
                  <Button variant="outline" className="w-full h-8 text-xs">View/Edit Grade</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="space-y-4 mt-8 pt-8 border-t border-border">
        <h2 className="text-xl font-bold">In Progress ({inProgress.length})</h2>
        <p className="text-sm text-muted-foreground">These students have started but not submitted yet.</p>
        <div className="flex flex-wrap gap-2">
          {inProgress.map(a => (
            <span key={a.id} className="px-3 py-1 bg-muted rounded-full text-xs font-medium border">
              Roll {a.student.rollNumber}: {a.student.name}
            </span>
          ))}
          {inProgress.length === 0 && <p className="text-xs text-muted-foreground italic">No students are currently taking this test.</p>}
        </div>
      </div>
    </div>
  )
}
