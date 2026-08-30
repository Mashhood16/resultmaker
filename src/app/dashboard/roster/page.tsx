import { StudentRosterView } from '../student-roster-view'
import { getStudentsBySchool } from '../student-actions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RosterPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const role = session.user.role
  if (role !== 'school' && role !== 'teacher') {
    redirect('/')
  }

  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  const rawStudents = await getStudentsBySchool(schoolId)
  const students = JSON.parse(JSON.stringify(rawStudents))

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          Student Roster
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage student profiles, visibility, and classes.</p>
      </header>
      
      <main className="w-full">
        <StudentRosterView initialStudents={students} />
      </main>
    </div>
  )
}
