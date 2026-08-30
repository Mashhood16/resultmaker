import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, UserCog, User, Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createUser, deleteUser } from './actions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()
  
  if (!session?.user) redirect('/login')
  
  const role = session.user.role
  if (role === 'student' || role === 'admin') redirect('/')

  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  // Fetch users depending on role
  let users = []
  if (role === 'school') {
    // School admin sees all sub-users
    users = await prisma.user.findMany({
      where: { schoolId },
      include: { classes: true },
      orderBy: { createdAt: 'desc' }
    })
  } else if (role === 'teacher') {
    // Teachers only see students that share at least one class with them
    const classIds = session.user.classIds || []
    users = await prisma.user.findMany({
      where: {
        schoolId,
        role: 'STUDENT',
        classes: {
          some: {
            id: { in: classIds }
          }
        }
      },
      include: { classes: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Fetch classes for the assignment form
  let availableClasses = []
  if (role === 'school') {
    availableClasses = await prisma.class.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' }
    })
  } else if (role === 'teacher') {
    const classIds = session.user.classIds || []
    availableClasses = await prisma.class.findMany({
      where: { id: { in: classIds } },
      orderBy: { name: 'asc' }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground mt-2">
            {role === 'school' 
              ? 'Manage teacher and student accounts for your school.' 
              : 'Manage student accounts for your assigned classes.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create User Form */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Create New Account
          </h3>
          <form action={createUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                name="name" 
                type="text" 
                required 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input 
                name="username" 
                type="text" 
                required 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. jdoe123"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select 
                name="role" 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {role === 'school' && <option value="TEACHER">Teacher</option>}
                <option value="STUDENT">Student (Class Account)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Classes</label>
              <div className="bg-muted/30 p-3 rounded-md border border-border max-h-48 overflow-y-auto space-y-2">
                {availableClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes available.</p>
                ) : (
                  availableClasses.map(cls => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="classIds" 
                        value={cls.id} 
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{cls.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </form>
        </div>

        {/* Existing Users List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Accounts
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">@{u.username}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'TEACHER' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {u.role === 'TEACHER' ? 'Teacher' : 'Student'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {u.classes.map(c => c.name).join(', ') || 'None'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={async () => {
                          'use server'
                          await deleteUser(u.id)
                        }}>
                          <Button variant="ghost" size="icon" type="submit" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
