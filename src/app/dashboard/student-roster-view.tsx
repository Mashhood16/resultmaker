'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { UploadCloud, Trash2, Search, Loader2, Users } from 'lucide-react'
import { uploadStudentRosterAction, deleteStudentAction } from './student-actions'
import { toast } from 'sonner'
import { Student, Class } from '@prisma/client'

type StudentWithClass = Student & { class: Class }

export function StudentRosterView({ initialStudents }: { initialStudents: StudentWithClass[] }) {
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedClass) {
      toast.error('Please enter a Class name before uploading (e.g., Class 6)')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('className', selectedClass)

      const result = await uploadStudentRosterAction(formData)
      if (result.success) {
        toast.success(result.message)
        // Ideally we would re-fetch, but for now we just refresh the page to get the new data
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(studentId: string) {
    if (!confirm('Are you sure you want to delete this student? All their scores will be lost.')) return
    
    try {
      const result = await deleteStudentAction(studentId)
      if (result.success) {
        setStudents(prev => prev.filter(s => s.id !== studentId))
        toast.success('Student deleted')
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error('Failed to delete student')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search students..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto items-center">
          <Input 
            placeholder="Class (e.g., Class 6)" 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white/5 border-white/10 text-white w-40"
          />
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold whitespace-nowrap"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            Upload Master Roster
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-black/20 border-b border-white/10">
          <CardTitle className="flex items-center text-xl text-white">
            <Users className="w-5 h-5 mr-2 text-emerald-400" />
            Master Student Roster
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {students.length} Total Enrolled Students
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Reg No.</TableHead>
                  <TableHead className="text-zinc-400">Roll No.</TableHead>
                  <TableHead className="text-zinc-400 font-bold">Name</TableHead>
                  <TableHead className="text-zinc-400">Class</TableHead>
                  <TableHead className="text-zinc-400">Section</TableHead>
                  <TableHead className="text-zinc-400">Father's Name</TableHead>
                  <TableHead className="text-zinc-400">Father's Phone</TableHead>
                  <TableHead className="text-zinc-400">Father's CNIC</TableHead>
                  <TableHead className="text-right text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                      No students found. Upload a master roster to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="text-zinc-300 font-mono text-xs">{student.registrationNumber || '-'}</TableCell>
                      <TableCell className="text-zinc-300 font-mono">{student.rollNumber || '-'}</TableCell>
                      <TableCell className="font-semibold text-white">{student.name}</TableCell>
                      <TableCell className="text-zinc-300">{student.class.name}</TableCell>
                      <TableCell className="text-zinc-300">{student.section || '-'}</TableCell>
                      <TableCell className="text-zinc-300">{student.fatherName || '-'}</TableCell>
                      <TableCell className="text-zinc-300 font-mono text-xs">{student.fatherPhone || '-'}</TableCell>
                      <TableCell className="text-zinc-300 font-mono text-xs">{student.fatherCnic || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(student.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
