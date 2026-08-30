import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { requireSchoolOrTeacherAccess } from '../../auth-utils'
import prisma from '@/lib/prisma'
import TestWizardClient from './test-wizard-client'

export const dynamic = 'force-dynamic'

export default async function CreateOnlineTestPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const access = await requireSchoolOrTeacherAccess()
  if (!access) redirect('/dashboard')

  const { isTeacher, classIds } = access

  // Fetch classes and subjects for the dropdowns
  const classes = await prisma.class.findMany({
    where: {
      schoolId: access.schoolId,
      ...(isTeacher ? { id: { in: classIds } } : {})
    },
    orderBy: { name: 'asc' }
  })

  // We fetch all subjects, client filters based on class access
  const subjectAccess = await prisma.teacherSubjectAccess.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      subject: true
    }
  })

  const allSubjects = await prisma.subject.findMany({
    where: { schoolId: access.schoolId }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Online Test</h1>
        <p className="text-muted-foreground mt-1">Set up test details and create multiple variants.</p>
      </div>

      <TestWizardClient 
        classes={classes} 
        allSubjects={allSubjects}
        teacherSubjectAccess={subjectAccess}
        isTeacher={isTeacher}
      />
    </div>
  )
}
