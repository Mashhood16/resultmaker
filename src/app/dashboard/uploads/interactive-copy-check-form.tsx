'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Search, Check, X, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { Class } from '@prisma/client'
import { getStudentsByClass, saveInteractiveCopyChecksAction } from '../copy-actions'

type StudentCheck = {
  id: string
  name: string
  rollNumber: string | null
  status: 'C' | 'I' | 'A'
}

export function InteractiveCopyCheckForm({ classes }: { classes: Class[] }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentCheck[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId)
    } else {
      setStudents([])
    }
  }, [selectedClassId])

  async function loadStudents(classId: string) {
    setIsLoading(true)
    try {
      const data = await getStudentsByClass(classId)
      setStudents(data.map(s => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        status: 'C'
      })))
    } catch (e: any) {
      toast.error('Failed to load students: ' + e.message)
    }
    setIsLoading(false)
  }

  function handleStatusToggle(studentId: string, newStatus: 'C' | 'I' | 'A') {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClassId || !subjectName || !checkDate) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (students.length === 0) {
      toast.error('No students to save.')
      return
    }

    setIsSaving(true)
    const res = await saveInteractiveCopyChecksAction({
      classId: selectedClassId,
      subjectName,
      checkDate,
      studentChecks: students.map(s => ({ studentId: s.id, status: s.status }))
    })

    if (res.success) {
      toast.success(res.message || 'Notebook checks saved successfully!')
      // Optionally clear or reset
      setStudents(students.map(s => ({ ...s, status: 'C' })))
    } else {
      toast.error(res.error || 'Failed to save checks.')
    }
    setIsSaving(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Card className="w-full max-w-4xl bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <CardHeader className="pb-4 pt-8 px-8">
        <CardTitle className="text-2xl font-black tracking-tight text-foreground">
          Interactive Copy Checking
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm mt-2">
          Select a class to view all students. Toggle their notebook status and submit to notify parents.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-muted/30 border border-border">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Science"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="h-10 bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground uppercase">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="h-10 bg-background"
              />
            </div>
          </div>

          {selectedClassId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Students List</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search student..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground">Name</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-muted-foreground">No students found</td>
                          </tr>
                        ) : (
                          filteredStudents.map(student => (
                            <tr key={student.id} className="border-t border-border hover:bg-muted/20">
                              <td className="px-4 py-3">{student.rollNumber || '-'}</td>
                              <td className="px-4 py-3 font-medium">{student.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStatusToggle(student.id, 'C')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'C' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-600'}`}
                                  >
                                    <Check className="w-3 h-3" /> Complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusToggle(student.id, 'I')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'I' ? 'bg-red-500/20 text-red-600 border border-red-500/30' : 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-600'}`}
                                  >
                                    <X className="w-3 h-3" /> Incomplete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusToggle(student.id, 'A')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'A' ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30' : 'bg-muted text-muted-foreground hover:bg-orange-500/10 hover:text-orange-600'}`}
                                  >
                                    <UserMinus className="w-3 h-3" /> Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button 
              type="submit" 
              disabled={isSaving || students.length === 0}
              className="h-11 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving & Notifying...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Checks
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
