'use client'

import { useState, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UploadCloud, Trash2, Search, Loader2, Users, Pencil, Layers, X, Eye, EyeOff } from 'lucide-react'
import { uploadStudentRosterAction, deleteStudentAction, editStudentAction, bulkMoveStudentsAction, toggleStudentVisibilityAction, bulkToggleVisibilityAction } from './student-actions'
import { toast } from 'sonner'
import { Student, Class } from '@prisma/client'

type StudentWithClass = Student & { class: Class }

export function StudentRosterView({ initialStudents }: { initialStudents: StudentWithClass[] }) {
  const [students, setStudents] = useState(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  
  // Filtering
  const [filterClass, setFilterClass] = useState('all')
  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.class.name))).sort()
  }, [students])

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false)
  const [promoteTargetClass, setPromoteTargetClass] = useState('')
  const [isPromoting, setIsPromoting] = useState(false)

  // Editing
  const [editingStudent, setEditingStudent] = useState<StudentWithClass | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', registrationNumber: '', rollNumber: '', section: '', fatherName: '', fatherPhone: '', fatherCnic: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.rollNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = filterClass === 'all' || s.class.name === filterClass
    return matchesSearch && matchesClass
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

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
        setSelectedIds(prev => { const next = new Set(prev); next.delete(studentId); return next; })
        toast.success('Student deleted')
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error('Failed to delete student')
    }
  }

  async function handleToggleVisibility(studentId: string, currentVis: boolean) {
    try {
      // Optimistic UI update
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, showInLeaderboard: !currentVis } : s))
      const result = await toggleStudentVisibilityAction(studentId, !currentVis)
      if (result.success) {
        toast.success(currentVis ? 'Hidden from leaderboard' : 'Published to leaderboard')
      } else {
        // Revert on failure
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, showInLeaderboard: currentVis } : s))
        toast.error(result.error)
      }
    } catch (e) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, showInLeaderboard: currentVis } : s))
      toast.error('Failed to update visibility')
    }
  }

  async function handleBulkVisibility(isVisible: boolean) {
    if (selectedIds.size === 0) return
    const idsArray = Array.from(selectedIds)
    try {
      // Optimistic UI update
      setStudents(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, showInLeaderboard: isVisible } : s))
      const result = await bulkToggleVisibilityAction(idsArray, isVisible)
      if (result.success) {
        toast.success(`Successfully ${isVisible ? 'published' : 'hidden'} ${selectedIds.size} students.`)
      } else {
        // Ideally we would revert carefully, but reloading is safer for bulk failure
        toast.error(result.error)
        window.location.reload()
      }
    } catch (e) {
      toast.error('Failed to update visibility')
      window.location.reload()
    }
  }

  function openEditModal(student: StudentWithClass) {
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      registrationNumber: student.registrationNumber || '',
      rollNumber: student.rollNumber || '',
      section: student.section || '',
      fatherName: student.fatherName || '',
      fatherPhone: student.fatherPhone || '',
      fatherCnic: student.fatherCnic || ''
    })
  }

  async function handleSaveEdit() {
    if (!editingStudent) return
    setIsSavingEdit(true)
    try {
      const res = await editStudentAction(editingStudent.id, editForm)
      if (res.success) {
        toast.success('Student updated successfully')
        setStudents(prev => prev.map(s => {
          if (s.id === editingStudent.id) {
            return { ...s, ...editForm }
          }
          return s
        }))
        setEditingStudent(null)
      } else {
        toast.error(res.error)
      }
    } catch (e) {
      toast.error('Failed to update student')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleBulkPromote() {
    if (selectedIds.size === 0 || !promoteTargetClass.trim()) return
    if (!confirm(`Are you sure you want to move ${selectedIds.size} students to ${promoteTargetClass}?`)) return

    setIsPromoting(true)
    try {
      const idsArray = Array.from(selectedIds)
      const res = await bulkMoveStudentsAction(idsArray, promoteTargetClass)
      if (res.success) {
        toast.success(`Successfully moved ${selectedIds.size} students to ${promoteTargetClass}`)
        window.location.reload()
      } else {
        toast.error(res.error)
      }
    } catch (e) {
      toast.error('Failed to promote students')
    } finally {
      setIsPromoting(false)
      setIsPromoteModalOpen(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full relative">
      
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-black/40 p-4 rounded-xl border border-white/5">
        <div className="flex gap-4 w-full md:w-auto items-center flex-wrap">
          <div className="relative max-w-sm w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="w-40">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">All Classes</SelectItem>
                {availableClasses.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

      {selectedIds.size > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex flex-wrap gap-4 justify-between items-center animate-in slide-in-from-top-2">
          <div className="text-emerald-400 font-medium px-2">
            {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:text-emerald-300"
              onClick={() => handleBulkVisibility(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button 
              variant="outline" 
              className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white"
              onClick={() => handleBulkVisibility(false)}
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </Button>
            <Button 
              variant="outline" 
              className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30 hover:text-indigo-300"
              onClick={() => setIsPromoteModalOpen(true)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Promote
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-black/20 border-b border-white/10">
          <CardTitle className="flex items-center text-xl text-white">
            <Users className="w-5 h-5 mr-2 text-emerald-400" />
            Master Student Roster
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {filteredStudents.length} Students {filterClass !== 'all' ? `in ${filterClass}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer accent-emerald-500"
                      checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-zinc-400">Reg No.</TableHead>
                  <TableHead className="text-zinc-400">Roll No.</TableHead>
                  <TableHead className="text-zinc-400 font-bold">Name</TableHead>
                  <TableHead className="text-zinc-400">Class</TableHead>
                  <TableHead className="text-zinc-400 text-center">Leaderboard</TableHead>
                  <TableHead className="text-zinc-400">Father's Name</TableHead>
                  <TableHead className="text-right text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 cursor-pointer accent-emerald-500"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)}
                        />
                      </TableCell>
                      <TableCell className="text-zinc-300 font-mono text-xs">{student.registrationNumber || '-'}</TableCell>
                      <TableCell className="text-zinc-300 font-mono">{student.rollNumber || '-'}</TableCell>
                      <TableCell className="font-semibold text-white">{student.name}</TableCell>
                      <TableCell className="text-zinc-300">
                        <span className="bg-white/10 px-2 py-1 rounded text-xs">{student.class.name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleVisibility(student.id, student.showInLeaderboard)}
                          className={`h-8 w-8 ${student.showInLeaderboard ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                          title={student.showInLeaderboard ? "Visible on Leaderboard" : "Hidden from Leaderboard"}
                        >
                          {student.showInLeaderboard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-zinc-300">{student.fatherName || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditModal(student)}
                            className="text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Student Modal Overlay */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <CardTitle className="text-white text-lg">Edit Student</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditingStudent(null)} className="h-8 w-8 text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Student Name</Label>
                <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Roll Number</Label>
                  <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.rollNumber} onChange={e => setEditForm({...editForm, rollNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Section</Label>
                  <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.section} onChange={e => setEditForm({...editForm, section: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Registration Number</Label>
                <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.registrationNumber} onChange={e => setEditForm({...editForm, registrationNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Father's Name</Label>
                <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Father's Phone</Label>
                  <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.fatherPhone} onChange={e => setEditForm({...editForm, fatherPhone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Father's CNIC</Label>
                  <Input className="bg-zinc-900 border-zinc-800 text-white" value={editForm.fatherCnic} onChange={e => setEditForm({...editForm, fatherCnic: e.target.value})} />
                </div>
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold mt-4" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Promote Modal Overlay */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-sm bg-zinc-950 border-zinc-800 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <CardTitle className="text-white text-lg">Bulk Move Class</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsPromoteModalOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-zinc-400 text-sm">
                You are about to move <strong>{selectedIds.size} selected students</strong> to a new class. This is useful for year-end promotions.
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Target Class Name</Label>
                <Input 
                  className="bg-zinc-900 border-zinc-800 text-white" 
                  placeholder="e.g. Class 7"
                  value={promoteTargetClass} 
                  onChange={e => setPromoteTargetClass(e.target.value)} 
                />
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold mt-4" onClick={handleBulkPromote} disabled={isPromoting}>
                {isPromoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                Confirm Move
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
