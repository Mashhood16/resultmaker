'use client'

import React, { useState, useEffect } from 'react'
import * as xlsx from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Users,
  Info,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassesForTemplateAction,
  getStudentsForClassTemplateAction,
  TemplateClassOption
} from '@/app/dashboard/template-actions'

export type TemplateActionType =
  | 'marks'
  | 'copy-checking'
  | 'contacts'
  | 'roster'
  | 'term-single'
  | 'term-master'

export interface DownloadTemplateModalProps {
  actionType: TemplateActionType
  classes?: { id: string; name: string; studentCount?: number }[]
  selectedClassName?: string
  subjectName?: string
  subjects?: string[]
  totalMarks?: number
  trigger?: React.ReactNode
  variant?: 'link' | 'button' | 'outline' | 'ghost' | 'icon'
  buttonText?: string
  className?: string
}

export function DownloadTemplateModal({
  actionType,
  classes: passedClasses,
  selectedClassName: initialSelectedClassName,
  subjectName,
  subjects = [],
  totalMarks = 100,
  trigger,
  variant = 'link',
  buttonText,
  className = '',
}: DownloadTemplateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classList, setClassList] = useState<TemplateClassOption[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)

  // Configure action metadata
  const actionConfig = {
    marks: {
      title: 'Marks Upload Template',
      badge: 'Test / Exam Marks',
      description:
        'Download an Excel sheet pre-filled with all enrolled students to quickly enter and upload exam scores.',
      columns: ['Roll Number', 'Name', 'Section', 'Obtained Marks', 'Total Marks'],
      defaultButtonText: 'Download Example Format',
      sheetName: 'Marks',
    },
    'copy-checking': {
      title: 'Notebook Checking Template',
      badge: 'Copy Checking',
      description:
        'Download an Excel sheet pre-filled with all enrolled students to record notebook completion statuses (C, I, A, N).',
      columns: ['Roll Number', 'Name', 'Status (C / I / A / N)'],
      defaultButtonText: 'Download Example Format',
      sheetName: 'Notebook Checks',
    },
    contacts: {
      title: 'Contacts Upload Template',
      badge: 'Student Contacts',
      description:
        'Download an Excel sheet with all students to add or update WhatsApp & mobile contact numbers for parent alerts.',
      columns: ['Roll Number', 'Name', 'Contact Number'],
      defaultButtonText: 'Download Example Format',
      sheetName: 'Contacts',
    },
    roster: {
      title: 'Student Roster Template',
      badge: 'Master Roster',
      description:
        'Download an Excel template to view, update, or import student profile and enrollment information.',
      columns: [
        'Name',
        'Class',
        'Section',
        'Registration Number',
        'Roll Number',
        'Father Name',
        'Father Phone',
        'Father CNIC',
      ],
      defaultButtonText: 'Download Template',
      sheetName: 'Students',
    },
    'term-single': {
      title: `${subjectName || 'Subject'} Marks Template`,
      badge: 'Single Subject Term',
      description: `Download an Excel template with all students of this class ready for ${
        subjectName || 'subject'
      } marks entry.`,
      columns: ['Roll Number', 'Name', 'Obtained Marks', 'Total Marks'],
      defaultButtonText: `Download ${subjectName || 'Subject'} Template`,
      sheetName: 'Marks',
    },
    'term-master': {
      title: 'Master Result Sheet Template',
      badge: 'Consolidated Term',
      description:
        'Download an Excel sheet with all students and separate columns for each required subject in the term report.',
      columns: ['Roll Number', 'Name', ...subjects],
      defaultButtonText: 'Download Master Template',
      sheetName: 'Master Marks',
    },
  }[actionType]

  // Synchronize initialSelectedClassName whenever prop changes or dialog opens
  useEffect(() => {
    if (initialSelectedClassName) {
      setSelectedClass(initialSelectedClassName)
    }
  }, [initialSelectedClassName, isOpen])

  // Fetch classes when modal opens if not provided via props
  useEffect(() => {
    if (!isOpen) return

    if (passedClasses && passedClasses.length > 0) {
      setClassList(
        passedClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c.studentCount ?? 0,
        }))
      )
      if (!selectedClass && !initialSelectedClassName && passedClasses[0]) {
        setSelectedClass(passedClasses[0].name)
      }
    } else {
      setIsLoadingClasses(true)
      getClassesForTemplateAction()
        .then((res) => {
          if (res.success && res.classes) {
            setClassList(res.classes)
            if (!selectedClass && !initialSelectedClassName && res.classes[0]) {
              setSelectedClass(res.classes[0].name)
            }
          }
        })
        .finally(() => setIsLoadingClasses(false))
    }
  }, [isOpen, passedClasses])

  // Get current student count for the selected class if available
  const selectedClassOption = classList.find(
    (c) => c.name === selectedClass || c.id === selectedClass
  )

  const handleDownload = async () => {
    if (!selectedClass) {
      toast.error('Please select a class.')
      return
    }

    setIsDownloading(true)
    const toastId = toast.loading('Preparing your custom Excel template...')

    try {
      let students: any[] = []
      let resolvedClassName = selectedClass

      if (selectedClass !== '__blank__') {
        const res = await getStudentsForClassTemplateAction(selectedClass)
        if (!res.success) {
          toast.error(res.error || 'Failed to fetch students for this class', { id: toastId })
          setIsDownloading(false)
          return
        }
        students = res.students || []
        if (res.className) resolvedClassName = res.className
      }

      const cleanClassName = resolvedClassName.replace(/[^\w\d-_]/g, '_')
      const wb = xlsx.utils.book_new()

      // Build data array according to actionType
      let sheetData: Record<string, any>[] = []
      let colWidths: { wch: number }[] = []

      if (actionType === 'marks') {
        colWidths = [{ wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 16 }, { wch: 14 }]
        if (students.length > 0) {
          sheetData = students.map((s) => ({
            'Roll Number': s.rollNumber || '',
            'Name': s.name,
            'Section': s.section || '',
            'Obtained Marks': '',
            'Total Marks': totalMarks,
          }))
        } else {
          sheetData = [
            {
              'Roll Number': '1',
              'Name': 'Sample Student Name',
              'Section': 'A',
              'Obtained Marks': '',
              'Total Marks': totalMarks,
            },
          ]
        }
      } else if (actionType === 'copy-checking') {
        colWidths = [{ wch: 14 }, { wch: 25 }, { wch: 14 }]
        if (students.length > 0) {
          sheetData = students.map((s) => ({
            'Roll Number': s.rollNumber || '',
            'Name': s.name,
            'Status': '',
          }))
        } else {
          sheetData = [
            {
              'Roll Number': '1',
              'Name': 'Sample Student Name',
              'Status': 'C',
            },
          ]
        }
      } else if (actionType === 'contacts') {
        colWidths = [{ wch: 14 }, { wch: 25 }, { wch: 20 }]
        if (students.length > 0) {
          sheetData = students.map((s) => ({
            'Roll Number': s.rollNumber || '',
            'Name': s.name,
            'Contact Number': s.fatherPhone || '',
          }))
        } else {
          sheetData = [
            {
              'Roll Number': '1',
              'Name': 'Sample Student Name',
              'Contact Number': '03001234567',
            },
          ]
        }
      } else if (actionType === 'roster') {
        colWidths = [
          { wch: 25 },
          { wch: 15 },
          { wch: 12 },
          { wch: 20 },
          { wch: 14 },
          { wch: 22 },
          { wch: 18 },
          { wch: 18 },
        ]
        if (students.length > 0) {
          sheetData = students.map((s) => ({
            'Name': s.name,
            'Class': s.className || (resolvedClassName === '__all__' ? '' : resolvedClassName),
            'Section': s.section || '',
            'Registration Number': s.registrationNumber || '',
            'Roll Number': s.rollNumber || '',
            'Father Name': s.fatherName || '',
            'Father Phone': s.fatherPhone || '',
            'Father CNIC': s.fatherCnic || '',
          }))
        } else {
          sheetData = [
            {
              'Name': 'Sample Student',
              'Class': resolvedClassName !== '__blank__' ? resolvedClassName : 'Class 10',
              'Section': 'A',
              'Registration Number': 'REG-001',
              'Roll Number': '1',
              'Father Name': 'Father Name',
              'Father Phone': '03001234567',
              'Father CNIC': '35201-1234567-1',
            },
          ]
        }
      } else if (actionType === 'term-single') {
        colWidths = [{ wch: 14 }, { wch: 25 }, { wch: 16 }, { wch: 14 }]
        if (students.length > 0) {
          sheetData = students.map((s) => ({
            'Roll Number': s.rollNumber || '',
            'Name': s.name,
            'Obtained Marks': '',
            'Total Marks': totalMarks,
          }))
        } else {
          sheetData = [
            {
              'Roll Number': '1',
              'Name': 'Sample Student',
              'Obtained Marks': '',
              'Total Marks': totalMarks,
            },
          ]
        }
      } else if (actionType === 'term-master') {
        colWidths = [{ wch: 14 }, { wch: 25 }, ...subjects.map(() => ({ wch: 16 }))]
        if (students.length > 0) {
          sheetData = students.map((s) => {
            const row: Record<string, any> = {
              'Roll Number': s.rollNumber || '',
              'Name': s.name,
            }
            subjects.forEach((sub) => {
              row[sub] = ''
            })
            return row
          })
        } else {
          const sampleRow: Record<string, any> = {
            'Roll Number': '1',
            'Name': 'Sample Student',
          }
          subjects.forEach((sub) => {
            sampleRow[sub] = ''
          })
          sheetData = [sampleRow]
        }
      }

      // Convert json to sheet
      const ws = xlsx.utils.json_to_sheet(sheetData)
      ws['!cols'] = colWidths
      xlsx.utils.book_append_sheet(wb, ws, actionConfig.sheetName)

      // If copy-checking, append a convenient instruction sheet
      if (actionType === 'copy-checking') {
        const guideRows = [
          {
            'Status Code': 'C',
            'Full Name': 'Completed',
            'Meaning': 'Copy checked & work complete.',
            'WhatsApp Message': 'No message queued',
          },
          {
            'Status Code': 'I',
            'Full Name': 'Incomplete',
            'Meaning': 'Work is incomplete.',
            'WhatsApp Message': 'Urgent completion alert sent',
          },
          {
            'Status Code': 'A',
            'Full Name': 'Absent',
            'Meaning': 'Student was absent on checking date.',
            'WhatsApp Message': 'Absence alert sent',
          },
          {
            'Status Code': 'N',
            'Full Name': 'Not Brought',
            'Meaning': 'Did not bring copy to school.',
            'WhatsApp Message': 'Copy reminder sent',
          },
        ]
        const guideWs = xlsx.utils.json_to_sheet(guideRows)
        guideWs['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 35 }, { wch: 30 }]
        xlsx.utils.book_append_sheet(wb, guideWs, 'Status Codes Guide')
      }

      // Generate filename
      let fileName = ''
      if (actionType === 'marks') {
        fileName = `${cleanClassName}_Marks_Template.xlsx`
      } else if (actionType === 'copy-checking') {
        fileName = `${cleanClassName}_Copy_Checking_Template.xlsx`
      } else if (actionType === 'contacts') {
        fileName = `${cleanClassName}_Contacts_Template.xlsx`
      } else if (actionType === 'roster') {
        fileName = `${cleanClassName}_Roster_Template.xlsx`
      } else if (actionType === 'term-single') {
        const cleanSubj = (subjectName || 'Subject').replace(/[^\w\d-_]/g, '_')
        fileName = `${cleanClassName}_${cleanSubj}_Template.xlsx`
      } else if (actionType === 'term-master') {
        fileName = `Master_${cleanClassName}_Template.xlsx`
      }

      xlsx.writeFile(wb, fileName)

      toast.success(
        students.length > 0
          ? `Downloaded template for ${resolvedClassName} with ${students.length} students!`
          : `Downloaded blank ${actionConfig.badge} template!`,
        { id: toastId }
      )

      setIsOpen(false)
    } catch (err: any) {
      console.error('Download template error:', err)
      toast.error('Failed to generate template: ' + (err.message || 'Unknown error'), {
        id: toastId,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Render trigger element
  const renderTrigger = () => {
    if (trigger) {
      return (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      )
    }

    const text = buttonText || actionConfig.defaultButtonText

    if (variant === 'link') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`text-primary/80 hover:text-primary text-xs flex items-center gap-1.5 transition-colors hover:underline font-medium cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{text}</span>
        </button>
      )
    }

    if (variant === 'outline') {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={`border-primary/40 text-primary hover:bg-primary/10 rounded-xl transition-all ${className}`}
        >
          <Download className="w-4 h-4 mr-2" />
          {text}
        </Button>
      )
    }

    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`bg-card hover:bg-muted text-foreground border-border rounded-xl ${className}`}
      >
        <Download className="w-4 h-4 mr-2" />
        {text}
      </Button>
    )
  }

  return (
    <>
      {renderTrigger()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  {actionConfig.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 bg-primary/5 text-primary border-primary/20">
                    {actionConfig.badge}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Excel (.xlsx)</span>
                </div>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {actionConfig.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Class selection dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-class-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Class / Grade
                </Label>
                {isLoadingClasses && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading classes...
                  </span>
                )}
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="template-class-select" className="w-full h-11 rounded-xl bg-background border-border text-foreground">
                  <SelectValue placeholder="Choose a class to prefill..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground max-h-60">
                  {classList.map((c) => (
                    <SelectItem key={c.id || c.name} value={c.name}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{c.name}</span>
                        {c.studentCount !== undefined && c.studentCount > 0 ? (
                          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                            {c.studentCount} {c.studentCount === 1 ? 'student' : 'students'}
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}

                  {actionType === 'roster' && (
                    <SelectItem value="__all__">
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        <Users className="w-4 h-4" />
                        <span>All Classes (Full School Roster)</span>
                      </div>
                    </SelectItem>
                  )}

                  <SelectItem value="__blank__">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Blank Template (Empty / No students)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Preview Card */}
            <div className="rounded-xl bg-muted/40 border border-border/80 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  Included Columns
                </span>
                {selectedClass && selectedClass !== '__blank__' ? (
                  <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto pre-fills names & roll numbers
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Empty column headers</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {actionConfig.columns.map((col) => (
                  <span
                    key={col}
                    className="text-[11px] px-2 py-0.5 bg-background rounded-md border border-border/80 text-foreground font-mono font-medium"
                  >
                    {col}
                  </span>
                ))}
              </div>

              {actionType === 'copy-checking' && (
                <div className="pt-1 text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    Status column supports <strong className="text-foreground">C</strong> (Completed),{' '}
                    <strong className="text-foreground">I</strong> (Incomplete),{' '}
                    <strong className="text-foreground">A</strong> (Absent), and{' '}
                    <strong className="text-foreground">N</strong> (Not Brought). Includes guide sheet!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || !selectedClass}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md transition-all active:scale-[0.98] px-5"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel (.xlsx)
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
