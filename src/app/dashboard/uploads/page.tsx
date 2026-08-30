import { UploadForm } from '../upload-form'
import { ManageDataView } from '../manage-data-view'
import { TestManagementView } from '../test-management-view'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadCloud, Database, Calendar } from 'lucide-react'

export default async function UploadsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'school') {
    redirect('/login')
  }

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
          <TabsList className="flex w-full justify-start overflow-x-auto bg-card/50 border-b border-border rounded-none p-0 mb-8 h-14 items-end">
            <TabsTrigger value="upload" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="manage" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
              <Database className="w-4 h-4 mr-2" />
              Manage Scores
            </TabsTrigger>
            <TabsTrigger value="tests" className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:!bg-transparent data-active:!text-primary hover:text-muted-foreground transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
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
      </main>
    </div>
  )
}
