'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { addSchool } from './school-actions'

type SchoolData = {
  id: string
  name: string
  username: string
  createdAt: Date
}

export function SchoolManagementView({ initialSchools }: { initialSchools: SchoolData[] }) {
  const [schools, setSchools] = useState<SchoolData[]>(initialSchools)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    const res = await addSchool(formData)
    setIsSubmitting(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success('School added successfully!')
    // We rely on router refresh or just optimistically reloading for now
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-400">
            <Building2 className="w-5 h-5" />
            Add New School
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Create a new school account with login credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">School Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Government High School" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required placeholder="school_admin" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required className="bg-zinc-950 border-zinc-800" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add School
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">Registered Schools</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">School Name</TableHead>
                <TableHead className="text-zinc-400">Username</TableHead>
                <TableHead className="text-zinc-400">Registered On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-zinc-200">{school.name}</TableCell>
                  <TableCell className="text-zinc-400">{school.username}</TableCell>
                  <TableCell className="text-zinc-400">
                    {new Date(school.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {schools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                    No schools registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
