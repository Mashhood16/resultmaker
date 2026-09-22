'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Search, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Class, Subject, NotebookCheck, Student } from '@prisma/client'

type EnrichedCheck = NotebookCheck & {
  student: Student & { class: Class }
  subject: Subject
}

export function NotebookLogView({ checks, classes, subjects }: { checks: EnrichedCheck[], classes: Class[], subjects: Subject[] }) {
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredChecks = checks.filter(c => {
    if (selectedClass !== 'all' && c.student.classId !== selectedClass) return false
    if (search) {
      const q = search.toLowerCase()
      return c.student.name.toLowerCase().includes(q) || 
             c.student.rollNumber?.toLowerCase().includes(q) ||
             c.subject.name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />
      
      <CardHeader className="pb-4 pt-8 px-8 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
            <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
              <BookOpen className="w-6 h-6 text-teal-400" />
            </div>
            Notebook Checking Logs
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            View the history of notebook and copy checking for all students.
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student, roll number, or subject..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-input rounded-xl"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-background/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No notebook checking records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecks.map((check) => (
                  <TableRow key={check.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(check.checkDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{check.student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{check.student.rollNumber || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{check.student.class.name}</TableCell>
                    <TableCell className="text-muted-foreground">{check.subject.name}</TableCell>
                    <TableCell>
                      {check.status === 'C' ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <XCircle className="w-3 h-3 mr-1" /> Incomplete
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
