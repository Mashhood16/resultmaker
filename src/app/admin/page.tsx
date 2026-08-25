import { SchoolManagementView } from './school-management-view'
import { getSchools } from './school-actions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Home, Building2 } from 'lucide-react'
import { signOut } from '@/auth'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  const schools = await getSchools()

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-5xl mx-auto gap-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Admin Dashboard
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
      
      <main className="flex justify-center flex-col items-center max-w-5xl mx-auto">
        <Tabs defaultValue="schools" className="w-full flex-col">
          <TabsList className="flex w-full justify-start overflow-x-auto bg-zinc-900/50 border-b border-zinc-800 rounded-none p-0 mb-8 h-14 items-end">
            <TabsTrigger value="schools" className="rounded-none border-b-2 border-transparent data-active:border-indigo-500 data-active:!bg-transparent data-active:!text-indigo-400 hover:text-zinc-200 transition-all font-semibold h-12 px-6 flex items-center justify-center text-sm bg-transparent shadow-none">
              <Building2 className="w-4 h-4 mr-2" />
              Manage Schools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="mt-0 focus-visible:ring-0 w-full flex justify-center">
            <div className="w-full max-w-4xl">
              <SchoolManagementView initialSchools={schools} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
