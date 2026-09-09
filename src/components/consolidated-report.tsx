import React from 'react'
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { ReportCardStudent } from './report-card'

export function ConsolidatedReport({ 
  students: initialStudents, 
  uniqueTests, 
  selectedTests,
  reportType = 'tests' 
}: { 
  students: ReportCardStudent[], 
  uniqueTests: string[], 
  selectedTests?: string[],
  reportType?: 'tests' | 'subjects' 
}) {
  // Ensure students are strictly sorted by overall percentage (highest to lowest) 
  // so the Legend and color mappings match the exact rank order.
  const students = [...initialStudents].sort((a, b) => {
    if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank
    return b.percentage - a.percentage
  })

  // Graph 1 Data: Total Scores Comparison across all tests
  const totalScoreChartData = students.map((student, idx) => ({
    id: student.id,
    name: student.name,
    score: student.percentage,
    obtained: student.obtained,
    total: student.total,
    rank: student.rank || idx + 1,
    isAbsent: student.isAbsent
  }))

  // Graph 2 Data: Comparative trend between all tests selected
  const testsForTrend = (selectedTests && selectedTests.length > 0) ? selectedTests : uniqueTests

  const trendChartData = testsForTrend.map(testName => {
    const dataPoint: any = { name: testName }
    students.forEach(student => {
      const testRecord = (student.testBreakdown || student.breakdown).find(t => t.testName === testName)
      if (testRecord) {
        if (testRecord.isAbsent) {
          dataPoint[student.id] = 0
          dataPoint[`${student.id}_isAbsent`] = true
        } else {
          dataPoint[student.id] = testRecord.percentage
          dataPoint[`${student.id}_isAbsent`] = false
        }
      } else {
        dataPoint[student.id] = null
        dataPoint[`${student.id}_isAbsent`] = false
      }
    })
    return dataPoint
  })

  const getStudentColor = (index: number, total: number) => {
    // Generate distinct hues distributed across the 360 degree color wheel
    // This creates a beautiful rainbow gradient mapped exactly to their rank!
    const hue = (index * (360 / Math.max(total, 1))) % 360
    return `hsl(${hue}, 90%, 65%)` 
  }

  return (
    <div id="consolidated-report" className="bg-card text-foreground p-8 relative font-sans w-[900px] mx-auto overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Table Section */}
      <div id="report-table-section" className="mb-12 relative z-10 bg-background/40 backdrop-blur-2xl border border-border rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight mb-2 uppercase drop-shadow-sm">Class Performance Report</h1>
          <h2 className="text-lg text-muted-foreground font-bold tracking-widest uppercase">Consolidated Result & Comparative Analysis</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="py-4 px-2 font-black text-muted-foreground uppercase tracking-widest text-xs text-center">Rank</th>
                <th className="py-4 px-4 font-black text-muted-foreground uppercase tracking-widest text-xs">Student Name</th>
                <th className="py-4 px-4 font-black text-muted-foreground uppercase tracking-widest text-xs text-center border-r border-border">Score</th>
                {uniqueTests.map(test => (
                  <th key={test} className="py-4 px-2 font-black text-muted-foreground uppercase tracking-widest text-xs text-center">{test}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} className="hover:bg-card transition-colors border-b border-border last:border-0 bg-transparent">
                  <td className="py-3 px-2 font-black text-muted-foreground text-center text-lg">
                    {student.rank === 1 && <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">1</span>}
                    {student.rank === 2 && <span className="text-muted-foreground drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]">2</span>}
                    {student.rank === 3 && <span className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]">3</span>}
                    {student.rank > 3 && student.rank}
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground text-sm">
                    {student.name}
                  </td>
                  <td className="py-3 px-4 text-center border-r border-border">
                    {student.percentage > 0 ? (
                      <span className="font-black text-primary text-sm">{student.percentage}%</span>
                    ) : (
                      <span className="font-black text-zinc-600 text-sm">0%</span>
                    )}
                  </td>
                  {uniqueTests.map(testName => {
                    const test = student.breakdown.find(t => t.testName === testName)
                    return (
                      <td key={testName} className="py-3 px-2 text-center">
                        {!test ? (
                          <span className="text-zinc-700 font-medium text-xs">-</span>
                        ) : test.isAbsent ? (
                          <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase bg-red-500/10 px-2 py-1 rounded">Absent</span>
                        ) : (
                          <span className="font-bold text-muted-foreground text-sm">{test.percentage}%</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Section: 2 Graphs */}
      {students.length > 0 && (
        <div className="flex flex-col gap-8">
          {/* Graph 1: Total Scores Comparison in All Tests */}
          <div id="report-bar-chart" className="relative z-10 bg-background/40 backdrop-blur-2xl border border-border rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-muted-foreground uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-4">
              <span className="w-12 h-1 bg-gradient-to-r from-transparent to-purple-500/50 rounded-full"></span>
              Total Score Comparison (All Tests)
              <span className="w-12 h-1 bg-gradient-to-l from-transparent to-emerald-500/50 rounded-full"></span>
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalScoreChartData} margin={{ top: 25, right: 30, bottom: 50, left: 10 }}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="5 5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    tick={{ fill: '#a1a1aa', fontSize: students.length > 15 ? 10 : 12, fontWeight: 'bold' }} 
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    tick={{ fill: '#a1a1aa', fontSize: 14, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]} 
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#ffffff08' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '16px' }}
                    formatter={(val: number, name: string, item: any) => [
                      item.payload.total > 0
                        ? `${val}% (${item.payload.obtained} / ${item.payload.total} marks)`
                        : `${val}%`,
                      `Total Score (#${item.payload.rank})`
                    ]}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[8, 8, 0, 0]}
                    barSize={Math.max(14, Math.min(48, Math.floor(700 / Math.max(students.length, 1))))}
                    isAnimationActive={false}
                  >
                    <LabelList 
                      dataKey="score" 
                      position="top" 
                      formatter={(val: number) => `${val}%`} 
                      fill="#e4e4e7" 
                      fontSize={students.length > 15 ? 9 : 11} 
                      fontWeight="black" 
                    />
                    {totalScoreChartData.map((entry, index) => (
                      <Cell key={`cell-${entry.id}`} fill={getStudentColor(index, students.length)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend showing students in rank order with their total scores */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4 px-4">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: getStudentColor(idx, students.length) }}></div>
                  <span className="text-muted-foreground font-bold text-xs tracking-wide">
                    #{student.rank} {student.name} <span className="text-primary font-black">({student.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Graph 2: Comparative Trend Across All Tests Selected */}
          <div id="report-line-chart" className="relative z-10 bg-background/40 backdrop-blur-2xl border border-border rounded-xl p-6 shadow-2xl mt-4">
            <h3 className="text-xl font-black text-muted-foreground uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-4">
              <span className="w-12 h-1 bg-gradient-to-r from-transparent to-amber-500/50 rounded-full"></span>
              Comparative Performance Trend (All Tests)
              <span className="w-12 h-1 bg-gradient-to-l from-transparent to-rose-500/50 rounded-full"></span>
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 25, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="5 5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    tick={{ fill: '#a1a1aa', fontSize: 14, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    tick={{ fill: '#a1a1aa', fontSize: 14, fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]} 
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '16px' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '14px', padding: '4px 0' }}
                    formatter={(val: number, name: string, item: any) => {
                      const studentId = item.dataKey
                      const isAbsent = item.payload?.[`${studentId}_isAbsent`]
                      if (isAbsent) {
                        return ['Absent (0%)', name]
                      }
                      return [`${val}%`, name]
                    }}
                  />
                  {students.map((student, idx) => {
                    const color = getStudentColor(idx, students.length)
                    return (
                      <Line 
                        key={student.id}
                        type="monotone" 
                        dataKey={student.id} 
                        name={student.name} 
                        stroke={color} 
                        strokeWidth={4} 
                        dot={{ fill: '#09090b', r: 6, strokeWidth: 3, stroke: color }} 
                        activeDot={{ r: 10, fill: color, stroke: '#fff', strokeWidth: 3 }} 
                        connectNulls
                        isAnimationActive={false}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend to Match Lines */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4 px-4">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: getStudentColor(idx, students.length) }}></div>
                  <span className="text-muted-foreground font-bold text-xs tracking-wide">
                    #{student.rank} {student.name} <span className="text-muted-foreground">({student.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 text-center text-sm text-zinc-600 pt-8 font-bold uppercase tracking-widest relative z-10 flex flex-col items-center gap-4">
        <div className="w-32 h-1 bg-card rounded-full"></div>
        Generated securely by Leaderboard Engine
      </div>
    </div>
  )
}
