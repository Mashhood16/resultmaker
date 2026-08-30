import { UploadForm } from './upload-form'
import { ManageDataView } from './manage-data-view'
import { TestManagementView } from './test-management-view'
import { TermResultWizard } from './term-result-wizard'
import { StudentRosterView } from './student-roster-view'
import { ClassesView } from './classes-view'
import { getStudentsBySchool } from './student-actions'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Home, UploadCloud, Database, Calendar, FileText, Layers, Users } from 'lucide-react'
import { signOut } from '@/auth'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function SchoolDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'school') {
    redirect('/login')
  }

  const students = await getStudentsBySchool(session.user.id)
  
  const classes = await prisma.class.findMany({
    where: { schoolId: session.user.id },
    select: {
      id: true,
      name: true,
      _count: {
        select: { students: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-6xl mx-auto gap-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          School Dashboard
        </h1>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <form action={async () => {
            'use server'
            await signOut()
          }}>
            <Button variant="outline" type="submit" className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </form>
        </div>
      </header>
      
      <main className="flex justify-center flex-col items-center max-w-6xl mx-auto">
        <Tabs defaultValue="term" className="w-full flex-col">
          <TabsList className="flex w-full justify-center flex-wrap bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 mb-12 h-auto">
            <TabsTrigger value="term" className="rounded-lg data-active:bg-emerald-500/20 data-active:text-emerald-400 hover:text-zinc-200 transition-all font-semibold h-12 px-8 flex items-center justify-center text-base bg-transparent shadow-none">
              <FileText className="w-5 h-5 mr-2" />
              Term Wizard
            </TabsTrigger>
            <TabsTrigger value="yearly" className="rounded-lg data-active:bg-blue-500/20 data-active:text-blue-400 hover:text-zinc-200 transition-all font-semibold h-12 px-8 flex items-center justify-center text-base bg-transparent shadow-none">
              <Layers className="w-5 h-5 mr-2" />
              Yearly Uploads
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg data-active:bg-purple-500/20 data-active:text-purple-400 hover:text-zinc-200 transition-all font-semibold h-12 px-8 flex items-center justify-center text-base bg-transparent shadow-none">
              <Users className="w-5 h-5 mr-2" />
              Student Roster
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="rounded-lg data-active:bg-amber-500/20 data-active:text-amber-400 hover:text-zinc-200 transition-all font-semibold h-12 px-8 flex items-center justify-center text-base bg-transparent shadow-none">
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboards
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="term" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <TermResultWizard />
          </TabsContent>
          
          <TabsContent value="yearly" className="mt-0 focus-visible:ring-0 w-full flex justify-center flex-col items-center">
            <Tabs defaultValue="upload" className="w-full max-w-5xl flex-col">
              <TabsList className="flex w-full justify-start overflow-x-auto bg-zinc-900/50 border-b border-zinc-800 rounded-none p-0 mb-8 h-14 items-end">
                <TabsTrigger value="upload" className="rounded-none border-b-2 border-transparent data-active:border-blue-500 data-active:!bg-transparent data-active:!text-blue-400 hover:text-zinc-200 transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Upload Data
                </TabsTrigger>
                <TabsTrigger value="manage" className="rounded-none border-b-2 border-transparent data-active:border-blue-500 data-active:!bg-transparent data-active:!text-blue-400 hover:text-zinc-200 transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
                  <Database className="w-4 h-4 mr-2" />
                  Manage Scores
                </TabsTrigger>
                <TabsTrigger value="tests" className="rounded-none border-b-2 border-transparent data-active:border-blue-500 data-active:!bg-transparent data-active:!text-blue-400 hover:text-zinc-200 transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Tests
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
                <UploadForm />
              </TabsContent>
              
              <TabsContent value="manage" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
                <ManageDataView />
              </TabsContent>

              <TabsContent value="tests" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
                <TestManagementView />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="students" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <StudentRosterView initialStudents={students} />
          </TabsContent>

          <TabsContent value="leaderboards" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <ClassesView classes={classes} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
