import { UploadForm } from '../upload-form'
import { UploadContactsForm } from '../upload-contacts-form'
import { ManageDataView } from '../manage-data-view'
import { TestManagementView } from '../test-management-view'
import { WhatsAppQueueView } from '../whatsapp-queue-view'
import { ManualEntryForm } from '../manual-entry-form'
import { CopyCheckingForm } from './copy-checking-form'
import { InteractiveCopyCheckForm } from './interactive-copy-check-form'
import { NotebookLogView } from '../notebook-log-view'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadCloud, Database, Calendar, Phone, MessageSquare, Edit3, BookOpen, PenTool } from 'lucide-react'

export default async function UploadsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const role = session.user.role
  if (role !== 'school' && role !== 'teacher') {
    redirect('/')
  }
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  const rawClasses = await prisma.class.findMany({
    where: { 
      schoolId: schoolId,
      ...(role === 'teacher' ? { id: { in: session.user.classIds || [] } } : {})
    },
    orderBy: { name: 'asc' }
  })

  const rawSubjects = await prisma.subject.findMany({
    where: { schoolId: schoolId },
    orderBy: { name: 'asc' }
  })

  const rawChecks = await prisma.notebookCheck.findMany({
    where: {
      student: { class: { schoolId } }
    },
    include: {
      student: { include: { class: true } },
      subject: true
    },
    orderBy: { checkDate: 'desc' }
  })

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          Manage Data
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Upload Excel sheets, edit raw scores, and configure tests.</p>
      </header>
      
      <main className="w-full flex justify-center flex-col items-center">
        <Tabs defaultValue="upload" className="w-full flex-col">
          <TabsList className="flex w-full justify-start overflow-x-auto bg-card/50 border-b border-border rounded-none p-0 mb-8 h-14 items-end scrollbar-hide">
            <TabsTrigger value="upload" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="manual" className="rounded-none border-b-2 border-transparent data-active:border-purple-500 data-active:!bg-transparent data-active:!text-purple-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <Edit3 className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="interactive-copy" className="rounded-none border-b-2 border-transparent data-active:border-indigo-500 data-active:!bg-transparent data-active:!text-indigo-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <PenTool className="w-4 h-4 mr-2" />
              Check Copies
            </TabsTrigger>
            <TabsTrigger value="copy" className="rounded-none border-b-2 border-transparent data-active:border-teal-500 data-active:!bg-transparent data-active:!text-teal-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <BookOpen className="w-4 h-4 mr-2" />
              Upload Copies
            </TabsTrigger>
            <TabsTrigger value="notebook-logs" className="rounded-none border-b-2 border-transparent data-active:border-teal-500 data-active:!bg-transparent data-active:!text-teal-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <BookOpen className="w-4 h-4 mr-2" />
              Notebook Logs
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-active:border-green-500 data-active:!bg-transparent data-active:!text-green-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <Phone className="w-4 h-4 mr-2" />
              Upload Contacts
            </TabsTrigger>
            <TabsTrigger value="queue" className="rounded-none border-b-2 border-transparent data-active:border-green-500 data-active:!bg-transparent data-active:!text-green-500 hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp Queue
            </TabsTrigger>
            <TabsTrigger value="manage" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <Database className="w-4 h-4 mr-2" />
              Manage Scores
            </TabsTrigger>
            <TabsTrigger value="tests" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none whitespace-nowrap">
              <Calendar className="w-4 h-4 mr-2" />
              Manage Tests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <UploadForm />
          </TabsContent>

          <TabsContent value="manual" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <ManualEntryForm classes={rawClasses} />
          </TabsContent>
          
          <TabsContent value="interactive-copy" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <InteractiveCopyCheckForm classes={rawClasses} />
          </TabsContent>

          <TabsContent value="copy" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <CopyCheckingForm classes={rawClasses} />
          </TabsContent>

          <TabsContent value="notebook-logs" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <NotebookLogView checks={rawChecks} classes={rawClasses} subjects={rawSubjects} />
          </TabsContent>
          
          <TabsContent value="contacts" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <UploadContactsForm classes={rawClasses} />
          </TabsContent>
          
          <TabsContent value="queue" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <WhatsAppQueueView />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <ManageDataView />
          </TabsContent>

          <TabsContent value="tests" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <TestManagementView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
