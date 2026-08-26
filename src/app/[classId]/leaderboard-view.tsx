'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Medal, Trophy, Star, ChevronDown, ChevronRight, Printer, ScrollText } from 'lucide-react'
import confetti from 'canvas-confetti'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ConsolidatedReport } from '@/components/consolidated-report'
import { toPng, toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { fetchComprehensiveScores } from '@/app/actions/result-card-actions'

type StudentScore = {
  id: string
  rank: number
  name: string
  rollNumber: string | null
  section: string | null
  obtained: number
  total: number
  percentage: number
  isAbsent: boolean
  breakdown: Array<{
    testName: string
    obtained: number
    total: number
    percentage: number
    isAbsent: boolean
    classAverage?: number
  }>
}

interface LeaderboardViewProps {
  initialData: StudentScore[]
  classId: string
  availableSubjects: { id: string, name: string }[]
}

export function LeaderboardView({ initialData, classId, availableSubjects }: LeaderboardViewProps) {
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  
  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportSelectedTests, setReportSelectedTests] = useState<Set<string>>(new Set())
  const [reportSelectedSubjects, setReportSelectedSubjects] = useState<Set<string>>(new Set())
  const [crossSubjectReportData, setCrossSubjectReportData] = useState<any[] | null>(null)

  const uniqueTests = useMemo(() => {
    const tests = new Set<string>()
    initialData.forEach(student => {
      student.breakdown.forEach(b => tests.add(b.testName))
    })
    return Array.from(tests)
  }, [initialData])

  const openReportModal = () => {
    setReportSelectedTests(new Set(uniqueTests))
    setReportSelectedSubjects(new Set(availableSubjects.map(s => s.name)))
    setIsReportModalOpen(true)
  }

  const handleExport = async () => {
    setIsReportModalOpen(false)
    setIsExporting(true)
    const toastId = toast.loading('Fetching multi-subject performance data...')
    try {
      if (selectedStudents.size === 0) throw new Error('No students selected')
      if (reportSelectedSubjects.size === 0) throw new Error('No subjects selected')
      
      const data = await fetchComprehensiveScores(
        classId,
        Array.from(selectedStudents),
        Array.from(reportSelectedTests),
        Array.from(reportSelectedSubjects)
      )

      // Map the multi-subject data to the structure ConsolidatedReport expects,
      // where "testName" becomes the Subject Name so columns are subjects instead of tests!
      const mappedStudents = data.map(s => {
        const totalObtained = s.subjects.reduce((sum, subj) => sum + subj.rawObtained, 0)
        const totalTotal = s.subjects.reduce((sum, subj) => sum + subj.rawTotal, 0)
        const percentage = totalTotal > 0 ? (totalObtained / totalTotal) * 100 : 0
        
        return {
          id: s.studentId,
          name: s.name,
          rank: 0,
          percentage: Number(percentage.toFixed(2)),
          breakdown: s.subjects.map(subj => ({
            testName: subj.subjectName,
            percentage: subj.rawTotal > 0 ? Number(((subj.rawObtained / subj.rawTotal) * 100).toFixed(2)) : 0,
            isAbsent: subj.isAbsent
          }))
        }
      })

      mappedStudents.sort((a, b) => b.percentage - a.percentage)
      mappedStudents.forEach((s, idx) => s.rank = idx + 1)

      setCrossSubjectReportData(mappedStudents)
      
      // Give the DOM a tiny bit of time to render the updated ConsolidatedReport 
      await new Promise(resolve => setTimeout(resolve, 500))

      const JsPDFConstructor = typeof jsPDF === 'function' ? jsPDF : (window as any).jspdf?.jsPDF || (jsPDF as any).jsPDF
      if (!JsPDFConstructor) throw new Error('jsPDF is not loaded correctly')
      
      toast.loading(`Capturing report sections...`, { id: toastId })

      const pdf = new JsPDFConstructor('p', 'pt', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Function to capture an element and add it to the PDF, handling potential multi-page slicing if the element itself is extremely tall (e.g. a huge table)
      const captureAndAdd = async (elementId: string, isFirstPage: boolean) => {
        const el = document.getElementById(elementId)
        if (!el) return;
        
        const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#09090b' })
        const elRect = el.getBoundingClientRect()
        const canvasWidth = elRect.width || 900
        const canvasHeight = elRect.height
        
        const imgWidth = pdfWidth
        const imgHeight = (canvasHeight * pdfWidth) / canvasWidth
        
        if (!isFirstPage) {
          pdf.addPage()
        }
        
        let heightLeft = imgHeight
        let position = 0
        
        // Fill background for the current page
        pdf.setFillColor('#09090b')
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
        
        while (heightLeft > 0) {
          position = position - pdfHeight
          pdf.addPage()
          
          // Fill background for the new page
          pdf.setFillColor('#09090b')
          pdf.rect(0, 0, pdfWidth, pdfHeight, 'F')
          
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pdfHeight
        }
      }

      // Capture sections
      pdf.setFillColor('#09090b')
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F') // Fill first page background before first capture
      
      await captureAndAdd('report-table-section', true)
      await captureAndAdd('report-bar-chart', false)
      await captureAndAdd('report-line-chart', false)
      
      pdf.save('Class_Performance_Report.pdf')
      toast.success(`Exported performance report!`, { id: toastId })
    } catch (e: any) {
      console.error(e)
      toast.error(`Export failed: ${e.message}`, { id: toastId, duration: 5000 })
    } finally {
      setIsExporting(false)
      setCrossSubjectReportData(null)
    }
  }

  const toggleTestForReport = (test: string) => {
    const next = new Set(reportSelectedTests)
    if (next.has(test)) next.delete(test)
    else next.add(test)
    setReportSelectedTests(next)
  }

  const toggleSubjectForReport = (subject: string) => {
    const next = new Set(reportSelectedSubjects)
    if (next.has(subject)) next.delete(subject)
    else next.add(subject)
    setReportSelectedSubjects(next)
  }

  const toggleStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSet = new Set(selectedStudents)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedStudents(newSet)
  }

  const toggleAll = () => {
    if (selectedStudents.size === filteredData.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredData.map(s => s.id)))
    }
  }

  useEffect(() => {
    // Fire confetti on mount if we have podium winners
    if (initialData.length > 0) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#10b981', '#fbbf24']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#10b981', '#fbbf24']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [initialData])

  const filteredData = useMemo(() => {
    if (!search) return initialData
    const lowerSearch = search.toLowerCase()
    return initialData.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerSearch) ||
        (student.section && student.section.toLowerCase().includes(lowerSearch))
    )
  }, [initialData, search])

  // Get Top 3
  const top3 = initialData.slice(0, 3)
  const [first, second, third] = top3

  const getTierBadge = (percentage: number, isAbsent: boolean) => {
    if (isAbsent) return <Badge variant="destructive" className="bg-red-600">Absent</Badge>
    if (percentage >= 85) return <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500">Platinum</Badge>
    if (percentage >= 70) return <Badge className="bg-gradient-to-r from-amber-300 to-yellow-500 text-black">Gold</Badge>
    if (percentage >= 50) return <Badge className="bg-gradient-to-r from-zinc-300 to-zinc-400 text-black">Silver</Badge>
    return <Badge className="bg-amber-700">Bronze</Badge>
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Podium Display */}
      {top3.length > 0 && (
        <div className="flex flex-row justify-center items-end gap-2 sm:gap-4 md:gap-10 pt-8 pb-4 px-2">
          {/* Rank 2 - Silver */}
          {second && (
            <div className="order-2 md:order-1 flex flex-col items-center animate-in slide-in-from-bottom-16 duration-700 delay-300">
              <div className="relative group w-full flex justify-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-zinc-300 to-zinc-500 rounded-2xl blur-md opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-zinc-900 border-zinc-500 w-28 md:w-48 text-center py-4 md:py-8 backdrop-blur-xl rounded-2xl shadow-2xl">
                  <Medal className="w-8 h-8 md:w-10 md:h-10 text-zinc-300 mx-auto mb-2 md:mb-3 drop-shadow-[0_0_10px_rgba(212,212,216,0.4)]" />
                  <div className="font-bold text-zinc-100 text-sm md:text-xl truncate px-2 md:px-4">{second.name}</div>
                  <div className="text-zinc-400 font-bold mt-1 md:mt-2 text-xs md:text-base">{second.percentage}%</div>
                </Card>
              </div>
              <div className="h-16 md:h-32 w-28 md:w-48 bg-gradient-to-t from-zinc-900 to-zinc-800 border-t-4 border-zinc-400 mt-2 md:mt-3 rounded-t-xl flex items-center justify-center text-2xl md:text-4xl font-black text-zinc-600 shadow-inner">
                2
              </div>
            </div>
          )}

          {/* Rank 1 - Gold */}
          {first && (
            <div className="order-1 md:order-2 flex flex-col items-center animate-in slide-in-from-bottom-24 duration-700 delay-500 z-10">
              <div className="relative group w-full flex justify-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 to-yellow-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-zinc-900 border-yellow-500 w-32 md:w-64 text-center py-6 md:py-10 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                  <Trophy className="w-10 h-10 md:w-14 md:h-14 text-yellow-400 mx-auto mb-2 md:mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
                  <div className="font-black text-zinc-100 text-base md:text-3xl truncate px-2 md:px-4">{first.name}</div>
                  <div className="text-yellow-400 font-black text-sm md:text-xl mt-1 md:mt-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{first.percentage}%</div>
                </Card>
              </div>
              <div className="h-24 md:h-48 w-32 md:w-64 bg-gradient-to-t from-zinc-900 to-zinc-800 border-t-4 border-yellow-400 mt-2 md:mt-3 rounded-t-xl flex items-center justify-center text-4xl md:text-6xl font-black text-yellow-600/80 shadow-inner">
                1
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {third && (
            <div className="order-3 md:order-3 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="relative group w-full flex justify-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-700 to-orange-900 rounded-2xl blur-md opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-zinc-900 border-amber-700 w-24 md:w-44 text-center py-4 md:py-8 backdrop-blur-xl rounded-2xl shadow-2xl">
                  <Star className="w-6 h-6 md:w-10 md:h-10 text-amber-600 mx-auto mb-2 md:mb-3 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)]" />
                  <div className="font-bold text-zinc-100 text-xs md:text-lg truncate px-2 md:px-4">{third.name}</div>
                  <div className="text-zinc-500 font-bold mt-1 md:mt-2 text-[10px] md:text-base">{third.percentage}%</div>
                </Card>
              </div>
              <div className="h-12 md:h-24 w-24 md:w-44 bg-gradient-to-t from-zinc-900 to-zinc-800 border-t-4 border-amber-700 mt-2 md:mt-3 rounded-t-xl flex items-center justify-center text-xl md:text-3xl font-black text-zinc-600 shadow-inner">
                3
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <Card className="bg-white/5 border-white/10 max-w-6xl mx-auto overflow-hidden shadow-2xl backdrop-blur-2xl rounded-3xl">
        <CardContent className="p-0">
          <div className="p-6 border-b border-white/10 bg-black/20 flex items-center justify-between">
            <div className="flex-1 max-w-md relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <Input 
                placeholder="Search by student name or section..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 border-white/10 text-white pl-12 h-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
              />
            </div>
            {selectedStudents.size > 0 && (
              <div className="flex gap-2">
                <Button onClick={openReportModal} disabled={isExporting} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  <Printer className="w-4 h-4 mr-2" />
                  {isExporting ? 'Generating...' : `Export Report`}
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-12 pl-6">
                    <input type="checkbox" checked={filteredData.length > 0 && selectedStudents.size === filteredData.length} onChange={toggleAll} className="w-4 h-4 rounded border-zinc-500 bg-zinc-800 accent-emerald-500 cursor-pointer" />
                  </TableHead>
                  <TableHead className="w-20 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Rank</TableHead>
                  <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Student Name</TableHead>
                  <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Roll No.</TableHead>
                  <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Section</TableHead>
                  <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Marks</TableHead>
                  <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Score</TableHead>
                  <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[10px] pr-6">Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-500 py-20 text-lg">
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((student) => (
                    <React.Fragment key={student.id}>
                      <TableRow 
                        className="border-white/5 hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setExpandedRow(expandedRow === student.id ? null : student.id)}
                      >
                        <TableCell className="pl-6" onClick={(e) => toggleStudent(student.id, e)}>
                          <input type="checkbox" checked={selectedStudents.has(student.id)} readOnly className="w-4 h-4 rounded border-zinc-500 bg-zinc-800 accent-emerald-500 cursor-pointer pointer-events-none" />
                        </TableCell>
                        <TableCell className="font-medium py-5">
                          {student.rank === 1 && <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold border border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.3)]">1</div>}
                          {student.rank === 2 && <div className="w-8 h-8 rounded-full bg-zinc-300/20 text-zinc-300 flex items-center justify-center font-bold border border-zinc-300/30">2</div>}
                          {student.rank === 3 && <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center font-bold border border-amber-600/30">3</div>}
                          {student.rank > 3 && <div className="w-8 h-8 rounded-full bg-black/40 text-zinc-500 flex items-center justify-center font-semibold">{student.rank}</div>}
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-700 transition-colors border border-white/5">
                              {expandedRow === student.id ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />}
                            </div>
                            <span className="font-bold text-white text-base tracking-wide">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          {student.rollNumber ? (
                            <Badge variant="outline" className="text-zinc-300 border-white/10 bg-black/40 font-mono tracking-widest px-3 py-1">
                              {student.rollNumber}
                            </Badge>
                          ) : (
                            <span className="text-zinc-700">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-400 font-medium py-5">{student.section || '-'}</TableCell>
                        <TableCell className="text-right text-zinc-400 font-medium py-5 tracking-wide">
                          {student.isAbsent ? <span className="text-red-500">Absent</span> : <><span className="text-zinc-200">{student.obtained}</span> <span className="text-zinc-700">/</span> {student.total}</>}
                        </TableCell>
                        <TableCell className="text-right py-5">
                          {student.isAbsent ? '-' : <span className="text-emerald-400 font-black text-lg drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">{student.percentage}%</span>}
                        </TableCell>
                        <TableCell className="text-right py-5 pr-6">
                          {getTierBadge(student.percentage, student.isAbsent)}
                        </TableCell>
                      </TableRow>
                      {expandedRow === student.id && (
                        <TableRow className="bg-black/60 border-white/5">
                          <TableCell colSpan={8} className="p-0 border-b-0">
                            <div className="px-6 md:px-16 py-8 animate-in slide-in-from-top-4 fade-in duration-300 flex flex-col lg:flex-row gap-8">
                              <div className="flex-1">
                                <h4 className="text-xs font-black text-emerald-500/70 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                  Test Breakdown
                                </h4>
                                <div className="grid gap-3">
                                  {student.breakdown.map((test, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all group/test shadow-sm">
                                    <span className="font-bold text-zinc-200 group-hover/test:text-white transition-colors">{test.testName}</span>
                                    <div className="flex gap-4 md:gap-8 text-sm items-center">
                                      <span className="text-zinc-400 font-medium w-24 text-right tracking-wide">
                                        {test.isAbsent ? <Badge variant="outline" className="text-red-400 border-red-900/50 bg-red-950/40">Absent</Badge> : <><span className="text-zinc-200">{test.obtained}</span> <span className="text-zinc-700">/</span> {test.total}</>}
                                      </span>
                                      <span className="font-black text-blue-400 w-16 text-right text-base drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]">
                                        {test.isAbsent ? '0%' : `${test.percentage}%`}
                                      </span>
                                      <div className="w-20 text-right hidden sm:block">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-zinc-900/50 text-zinc-500 border-zinc-800">Avg {test.classAverage}%</Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {student.breakdown.length === 0 && (
                                  <div className="text-zinc-500 text-sm italic p-4 bg-white/5 rounded-xl border border-white/5 text-center">No tests recorded yet.</div>
                                )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-[300px] h-[300px] bg-black/40 rounded-2xl p-6 border border-white/5">
                                <h4 className="text-xs font-black text-blue-500/70 mb-6 uppercase tracking-[0.2em]">Performance Trend</h4>
                                {student.breakdown.length > 1 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={student.breakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                      <Line type="monotone" dataKey="percentage" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
                                      <CartesianGrid stroke="#333" strokeDasharray="5 5" vertical={false} />
                                      <XAxis dataKey="testName" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                                      <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                                        formatter={(val: any) => [`${val}%`, 'Score']}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm text-center px-8">Need at least 2 tests to show progress trend.</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Consolidated Report for PDF Export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
        {crossSubjectReportData && (
          <ConsolidatedReport 
            students={crossSubjectReportData}
            uniqueTests={Array.from(reportSelectedSubjects)}
            reportType="subjects"
          />
        )}
      </div>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-400" />
              Configure Report
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select which tests and subjects to aggregate for the {selectedStudents.size} selected students.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-3">
              <h4 className="text-sm font-black tracking-widest text-zinc-500 uppercase">Include Tests</h4>
              {uniqueTests.length === 0 ? (
                <p className="text-zinc-500 text-sm">No tests available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {uniqueTests.map(test => (
                    <div key={test} className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => toggleTestForReport(test)}>
                      <Checkbox id={`rep-test-${test}`} checked={reportSelectedTests.has(test)} onCheckedChange={() => toggleTestForReport(test)} />
                      <Label htmlFor={`rep-test-${test}`} className="flex-1 cursor-pointer font-medium text-zinc-300 text-sm">{test}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-black tracking-widest text-zinc-500 uppercase">Include Subjects</h4>
              {availableSubjects.length === 0 ? (
                <p className="text-zinc-500 text-sm">No subjects available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableSubjects.map(sub => (
                    <div key={sub.id} className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-3 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => toggleSubjectForReport(sub.name)}>
                      <Checkbox id={`rep-sub-${sub.id}`} checked={reportSelectedSubjects.has(sub.name)} onCheckedChange={() => toggleSubjectForReport(sub.name)} />
                      <Label htmlFor={`rep-sub-${sub.id}`} className="flex-1 cursor-pointer font-medium text-zinc-300 text-sm">{sub.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)} className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || reportSelectedTests.size === 0 || reportSelectedSubjects.size === 0} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
