import React from 'react'

export type ReportCardStudent = {
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

export function ReportCard({ student }: { student: ReportCardStudent }) {
  return (
    <div id={`report-card-${student.id}`} className="w-[800px] bg-white text-black p-12 relative font-sans">
      {/* Header */}
      <div className="text-center mb-10 border-b-4 border-primary pb-6">
        <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-2 uppercase">Academic Report</h1>
        <h2 className="text-2xl text-zinc-600 font-medium tracking-wide">Performance Record</h2>
      </div>
      
      {/* Student Info */}
      <div className="grid grid-cols-2 gap-6 mb-12 bg-zinc-50 p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Student Name</div>
          <div className="text-3xl font-black text-zinc-900">{student.name}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Roll Number</div>
          <div className="text-2xl font-bold text-zinc-800">{student.rollNumber || '-'}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Class Rank</div>
          <div className="text-2xl font-bold text-emerald-600">#{student.rank}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-1">Overall Percentage</div>
          <div className="text-2xl font-bold text-zinc-800">{student.percentage}%</div>
        </div>
      </div>
      
      {/* Test Breakdown */}
      <div className="mb-12">
        <h3 className="text-lg font-black text-zinc-800 uppercase tracking-widest mb-4">Assessment Breakdown</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-100">
              <th className="p-4 border-b-2 border-zinc-300 font-bold text-zinc-700 uppercase tracking-wider text-sm">Assessment Name</th>
              <th className="p-4 border-b-2 border-zinc-300 font-bold text-zinc-700 uppercase tracking-wider text-sm text-center">Obtained</th>
              <th className="p-4 border-b-2 border-zinc-300 font-bold text-zinc-700 uppercase tracking-wider text-sm text-center">Total</th>
              <th className="p-4 border-b-2 border-zinc-300 font-bold text-zinc-700 uppercase tracking-wider text-sm text-center">Class Avg</th>
              <th className="p-4 border-b-2 border-zinc-300 font-bold text-zinc-700 uppercase tracking-wider text-sm text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {student.breakdown.map((b, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                <td className="p-4 border-b border-zinc-200 font-medium text-zinc-800">{b.testName}</td>
                <td className="p-4 border-b border-zinc-200 text-center font-medium text-zinc-800">{b.isAbsent ? 'Absent' : b.obtained}</td>
                <td className="p-4 border-b border-zinc-200 text-center font-medium text-zinc-800">{b.total}</td>
                <td className="p-4 border-b border-zinc-200 text-center font-medium text-muted-foreground">{b.classAverage}%</td>
                <td className="p-4 border-b border-zinc-200 text-right font-bold text-emerald-600">{b.isAbsent ? '0%' : `${b.percentage}%`}</td>
              </tr>
            ))}
            {student.breakdown.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No assessments recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground border-t border-zinc-200 pt-6 font-medium">
        Generated automatically by Leaderboard System
      </div>
    </div>
  )
}
