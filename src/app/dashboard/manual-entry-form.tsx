'use client'

import { useState, useEffect } from 'react'
import { getStudentsByClassId, uploadManualMarksAction } from './manual-entry-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Edit3, Loader2, Check } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Class } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'

export function ManualEntryForm({ classes }: { classes: Class[] }) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  
  const [subjectName, setSubjectName] = useState('')
  const [testName, setTestName] = useState('')
  const [testDate, setTestDate] = useState('')
  const [totalMarks, setTotalMarks] = useState<number>(100)
  
  const [marksData, setMarksData] = useState<Record<string, { marksObtained: number | '', isAbsent: boolean }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([])
      setMarksData({})
      return
    }

    async function loadStudents() {
      setIsLoadingStudents(true)
      const res = await getStudentsByClassId(selectedClassId)
      if (res.success && res.students) {
        setStudents(res.students)
        const initialData: Record<string, { marksObtained: number | '', isAbsent: boolean }> = {}
        res.students.forEach(s => {
          initialData[s.id] = { marksObtained: '', isAbsent: false }
        })
        setMarksData(initialData)
      } else {
        toast.error(res.error || 'Failed to load students')
      }
      setIsLoadingStudents(false)
    }

    loadStudents()
  }, [selectedClassId])

  const handleMarkChange = (studentId: string, value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value === '' ? '' : Number(value)
      }
    }))
  }

  const handleAbsentChange = (studentId: string, checked: boolean) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: checked,
        marksObtained: checked ? 0 : prev[studentId].marksObtained // Reset marks if absent
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClassId || !subjectName || !testName || !testDate || !totalMarks) {
      toast.error('Please fill in all test details.')
      return
    }

    // Validate that all students have either a mark or are absent
    const missingData = students.some(s => !marksData[s.id].isAbsent && marksData[s.id].marksObtained === '')
    if (missingData) {
      toast.error('Please enter marks for all students or mark them as absent.')
      return
    }

    const formattedStudents = students.map(s => ({
      id: s.id,
      marksObtained: marksData[s.id].marksObtained as number || 0,
      isAbsent: marksData[s.id].isAbsent
    }))

    setIsSubmitting(true)
    const res = await uploadManualMarksAction({
      classId: selectedClassId,
      subjectName,
      testName,
      testDate,
      totalMarks,
      students: formattedStudents
    })

    if (res.success) {
      toast.success(res.message)
      // Reset form
      setSubjectName('')
      setTestName('')
      setTestDate('')
      setSelectedClassId('')
    } else {
      toast.error(res.error)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="relative w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute -inset-4 bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-transparent blur-3xl rounded-[3rem] -z-10" />
      
      <Card className="w-full bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-400 to-rose-400" />
        
        <CardHeader className="pb-4 pt-8 px-8">
          <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Edit3 className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"/> 
            </div>
            Manual Entry
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            Enter test marks manually for each student without uploading a spreadsheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-accent/20 p-6 rounded-2xl border border-border">
              <div className="space-y-2">
                <Label htmlFor="classSelect" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Class</Label>
                <select
                  id="classSelect"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-xl h-12 px-4 shadow-inner focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none"
                  required
                >
                  <option value="" disabled>Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectName" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Subject Name</Label>
                <Input id="subjectName" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" required className="bg-background border-border text-foreground focus-visible:ring-purple-500/50 transition-all rounded-xl h-12 px-4 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Total Marks</Label>
                <Input id="totalMarks" type="number" min="1" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} required className="bg-background border-border text-foreground focus-visible:ring-purple-500/50 transition-all rounded-xl h-12 px-4 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testName" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Test Name</Label>
                <Input id="testName" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Week 1, Midterms" required className="bg-background border-border text-foreground focus-visible:ring-purple-500/50 transition-all rounded-xl h-12 px-4 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDate" className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Test Date</Label>
                <Input id="testDate" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} required className="bg-background border-border text-foreground focus-visible:ring-purple-500/50 transition-all rounded-xl h-12 px-4 shadow-inner" />
              </div>
            </div>

            {isLoadingStudents && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            )}

            {!isLoadingStudents && students.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-accent/40">
                    <TableRow>
                      <TableHead className="w-[100px] text-muted-foreground font-bold">Roll No.</TableHead>
                      <TableHead className="text-muted-foreground font-bold">Student Name</TableHead>
                      <TableHead className="w-[150px] text-muted-foreground font-bold text-center">Marks Obtained</TableHead>
                      <TableHead className="w-[100px] text-muted-foreground font-bold text-center">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} className="hover:bg-accent/20">
                        <TableCell className="font-mono text-muted-foreground">{student.rollNumber || '-'}</TableCell>
                        <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max={totalMarks}
                            value={marksData[student.id]?.marksObtained ?? ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            disabled={marksData[student.id]?.isAbsent}
                            className="w-full text-center h-9 bg-background focus-visible:ring-purple-500/50 disabled:opacity-50"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center h-full">
                            <Checkbox
                              checked={marksData[student.id]?.isAbsent || false}
                              onCheckedChange={(checked) => handleAbsentChange(student.id, checked as boolean)}
                              className="border-muted-foreground data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoadingStudents && students.length === 0 && selectedClassId && (
              <div className="text-center py-12 text-muted-foreground bg-accent/10 rounded-xl border border-dashed border-border">
                No students found in this class. Please upload a student roster first.
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || students.length === 0} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-500/20 border-0 rounded-xl h-14 text-lg font-bold transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
              {isSubmitting ? 'Saving Results...' : 'Save Manual Results'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
