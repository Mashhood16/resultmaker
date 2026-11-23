'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Search, Check, X, UserMinus, BookX, BookOpen, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Class, Subject } from '@prisma/client'
import { getStudentsForCopyCheckAction, saveInteractiveCopyChecksAction } from '../copy-actions'

type StudentCheck = {
  id: string
  name: string
  rollNumber: string | null
  status: 'C' | 'I' | 'A' | 'N'
  missingChapters?: string
}

interface InteractiveCopyCheckFormProps {
  classes: Class[]
  subjects?: Subject[]
  subjectAccess?: Record<string, string[]> | null
  isTeacher?: boolean
}

export function InteractiveCopyCheckForm({ 
  classes, 
  subjects = [], 
  subjectAccess = null, 
  isTeacher = false 
}: InteractiveCopyCheckFormProps) {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentCheck[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [hasExistingChecks, setHasExistingChecks] = useState(false)

  // Filter available subjects based on user permissions for this class
  const allowedSubjectIds = (isTeacher && subjectAccess && selectedClassId)
    ? (subjectAccess[selectedClassId] || [])
    : null

  const availableSubjects = allowedSubjectIds
    ? subjects.filter(s => allowedSubjectIds.includes(s.id))
    : subjects

  const effectiveSubject = (isCustomSubject ? customSubject : selectedSubject).trim()

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId)
    setSelectedSubject('')
    setCustomSubject('')
    setIsCustomSubject(false)
    setStudents([])
    setHasExistingChecks(false)
  }

  const handleSubjectChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomSubject(true)
      setSelectedSubject('')
    } else {
      setIsCustomSubject(false)
      setSelectedSubject(val)
    }
  }

  useEffect(() => {
    if (selectedClassId && effectiveSubject && checkDate) {
      loadStudents(selectedClassId, effectiveSubject, checkDate)
    } else {
      setStudents([])
      setHasExistingChecks(false)
    }
  }, [selectedClassId, effectiveSubject, checkDate])

  async function loadStudents(classId: string, subject: string, date: string) {
    setIsLoading(true)
    try {
      const res = await getStudentsForCopyCheckAction(classId, subject, date)
      if (res.success && res.students) {
        setStudents(res.students)
        setHasExistingChecks(res.hasExistingChecks || false)
      } else {
        toast.error(res.error || 'Failed to load students')
        setStudents([])
        setHasExistingChecks(false)
      }
    } catch (e: any) {
      toast.error('Failed to load students: ' + e.message)
      setStudents([])
      setHasExistingChecks(false)
    }
    setIsLoading(false)
  }

  function handleStatusToggle(studentId: string, newStatus: 'C' | 'I' | 'A' | 'N') {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s))
  }

  function handleMissingChaptersChange(studentId: string, missingChapters: string) {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, missingChapters } : s))
  }

  function handleMarkAllComplete() {
    setStudents(prev => prev.map(s => ({ ...s, status: 'C', missingChapters: '' })))
    toast.info('Marked all students as Complete')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClassId || !effectiveSubject || !checkDate) {
      toast.error('Please select Class, Subject, and Date.')
      return
    }

    if (students.length === 0) {
      toast.error('No students to save.')
      return
    }

    setIsSaving(true)
    const res = await saveInteractiveCopyChecksAction({
      classId: selectedClassId,
      subjectName: effectiveSubject,
      checkDate,
      studentChecks: students.map(s => ({
        studentId: s.id,
        status: s.status,
        missingChapters: s.missingChapters
      }))
    })

    if (res.success) {
      toast.success(res.message || 'Notebook checks saved successfully!')
      // Refresh students to sync with database
      await loadStudents(selectedClassId, effectiveSubject, checkDate)
    } else {
      toast.error(res.error || 'Failed to save checks.')
    }
    setIsSaving(false)
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: students.length,
    complete: students.filter(s => s.status === 'C').length,
    incomplete: students.filter(s => s.status === 'I').length,
    notBrought: students.filter(s => s.status === 'N').length,
    absent: students.filter(s => s.status === 'A').length,
  }

  return (
    <Card className="w-full max-w-4xl bg-card border-border shadow-2xl backdrop-blur-2xl overflow-hidden rounded-3xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
              Interactive Copy Checking
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Select class and subject to view students, record copy statuses, and notify parents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-muted/30 border border-border">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                1. Select Class <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full h-11 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                2. Select Subject <span className="text-red-500">*</span>
              </label>
              {availableSubjects.length > 0 && !isCustomSubject ? (
                <select
                  required
                  value={selectedSubject}
                  disabled={!selectedClassId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full h-11 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedClassId ? 'Select class first...' : 'Select a subject...'}
                  </option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  {!isTeacher && (
                    <option value="__custom__">+ Enter custom subject...</option>
                  )}
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    required
                    placeholder={!selectedClassId ? 'Select class first' : 'e.g. Science, Math'}
                    value={isCustomSubject ? customSubject : selectedSubject}
                    disabled={!selectedClassId}
                    onChange={(e) => {
                      if (isCustomSubject) setCustomSubject(e.target.value)
                      else setSelectedSubject(e.target.value)
                    }}
                    className="h-11 bg-background"
                  />
                  {availableSubjects.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCustomSubject(false)
                        setCustomSubject('')
                        setSelectedSubject('')
                      }}
                      className="h-11 px-3 text-xs whitespace-nowrap rounded-xl"
                    >
                      From List
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                3. Date <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="h-11 bg-background"
              />
            </div>
          </div>

          {!selectedClassId || !effectiveSubject ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-border bg-muted/20 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4 border border-indigo-500/20">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-foreground">
                {!selectedClassId ? 'Select Class & Subject' : 'Select a Subject'}
              </h4>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                {!selectedClassId
                  ? 'Please select a class and subject above to load student records and update copy checks.'
                  : 'Please select a subject to load the students and start checking notebooks.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Toolbar and Status Summary */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">Students List</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                    {stats.total} {stats.total === 1 ? 'student' : 'students'}
                  </span>
                  {hasExistingChecks && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30 font-medium">
                      Loaded saved checks
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllComplete}
                    className="h-9 text-xs rounded-xl border-dashed"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                    All Complete
                  </Button>
                  <div className="relative w-56 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search student..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex items-center justify-between">
                  <span className="font-medium">Complete</span>
                  <span className="font-bold text-sm">{stats.complete}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-between">
                  <span className="font-medium">Incomplete</span>
                  <span className="font-bold text-sm">{stats.incomplete}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-between">
                  <span className="font-medium">Not Brought</span>
                  <span className="font-bold text-sm">{stats.notBrought}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 flex items-center justify-between">
                  <span className="font-medium">Absent</span>
                  <span className="font-bold text-sm">{stats.absent}</span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading copy records...</p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <div className="max-h-[440px] overflow-y-auto">
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
                            <td colSpan={3} className="text-center py-8 text-muted-foreground">
                              {search ? 'No students match your search' : 'No students found in this class'}
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(student => (
                            <tr key={student.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs">{student.rollNumber || '-'}</td>
                              <td className="px-4 py-3 font-medium">{student.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(student.id, 'C')}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'C' ? 'bg-green-500/20 text-green-600 border border-green-500/30 font-semibold' : 'bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-600'}`}
                                    >
                                      <Check className="w-3 h-3" /> Complete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(student.id, 'I')}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'I' ? 'bg-red-500/20 text-red-600 border border-red-500/30 font-semibold' : 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-600'}`}
                                    >
                                      <X className="w-3 h-3" /> Incomplete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(student.id, 'N')}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'N' ? 'bg-purple-500/20 text-purple-600 border border-purple-500/30 font-semibold' : 'bg-muted text-muted-foreground hover:bg-purple-500/10 hover:text-purple-600'}`}
                                    >
                                      <BookX className="w-3 h-3" /> Not Brought
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(student.id, 'A')}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${student.status === 'A' ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30 font-semibold' : 'bg-muted text-muted-foreground hover:bg-orange-500/10 hover:text-orange-600'}`}
                                    >
                                      <UserMinus className="w-3 h-3" /> Absent
                                    </button>
                                  </div>
                                  {student.status === 'I' && (
                                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                      <span className="text-[11px] font-semibold text-red-500/90 whitespace-nowrap">Missing Chapters:</span>
                                      <Input
                                        placeholder="e.g. Ch 3, 4, 5"
                                        value={student.missingChapters || ''}
                                        onChange={(e) => handleMissingChaptersChange(student.id, e.target.value)}
                                        className="h-7 text-xs w-44 bg-background border-red-500/30 focus-visible:ring-red-500/40"
                                      />
                                    </div>
                                  )}
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
              disabled={isSaving || !selectedClassId || !effectiveSubject || students.length === 0}
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
