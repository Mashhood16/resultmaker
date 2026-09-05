import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PinEntryClient from './pin-entry-client'

export default async function TestEntryPage({ params }: { params: { classId: string, testId: string } }) {
  const test = await prisma.onlineTest.findUnique({
    where: { id: params.testId },
    select: { 
      id: true, 
      title: true, 
      isActive: true,
      classId: true,
      variants: { select: { id: true, name: true } } 
    }
  })

  if (!test || !test.isActive || test.classId !== params.classId) redirect('/')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <PinEntryClient 
        classId={params.classId} 
        testId={params.testId} 
        testTitle={test.title}
      />
    </div>
  )
}
