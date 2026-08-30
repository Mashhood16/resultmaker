import { ClassesView } from './classes-view'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardOverview() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role
  
  if (role === 'student') {
    const classId = session.user.classIds?.[0]
    if (classId) {
      redirect(`/${classId}`)
    } else {
      redirect('/')
    }
  }

  // Teacher or School logic
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  
  let rawClasses = []
  if (role === 'school' && schoolId) {
    rawClasses = await prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    })
  } else if (role === 'teacher' && schoolId) {
    rawClasses = await prisma.class.findMany({
      where: { 
        schoolId,
        id: { in: session.user.classIds || [] } 
      },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    })
  } else if (role === 'admin') {
    // Admin logic could show all schools' classes or redirect to a super admin view
    rawClasses = []
  }

  const classes = JSON.parse(JSON.stringify(rawClasses))

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your classes and access leaderboards.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="outline" className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="w-full">
        <ClassesView classes={classes} />
      </main>
    </div>
  )
}
