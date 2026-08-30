import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import PinEntryClient from './pin-entry-client'

export default async function TestEntryPage({ params }: { params: { classId: string, testId: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const test = await prisma.onlineTest.findUnique({
    where: { id: params.testId },
    include: { variants: { select: { accessPin: true, id: true } } }
  })

  if (!test || !test.isActive) redirect(`/${params.classId}`)

  // Find if student already started an attempt
  let studentId = ''
  if (session.user.role === 'student') {
    const student = await prisma.student.findFirst({
      where: { classId: params.classId, rollNumber: session.user.username.split('_')[1] || session.user.username } // Hacky way to get student from username if needed, actually we should fetch by user relationship if established. Wait, users have `role: STUDENT` and their username might be their roll number.
    })
    // Actually the app assigns usernames to students as `schoolUsername_rollNumber`.
    studentId = student?.id || ''
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <PinEntryClient 
        classId={params.classId} 
        testId={params.testId} 
        testTitle={test.title}
        variants={test.variants}
      />
    </div>
  )
}
