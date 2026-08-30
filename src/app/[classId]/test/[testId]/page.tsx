import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PinEntryClient from './pin-entry-client'

export default async function TestEntryPage({ params }: { params: { classId: string, testId: string } }) {
  const test = await prisma.onlineTest.findUnique({
    where: { id: params.testId },
    include: { variants: { select: { accessPin: true, id: true } } }
  })

  if (!test || !test.isActive) redirect(`/${params.classId}`)

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
