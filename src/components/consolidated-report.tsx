import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { ReportCardStudent } from './report-card'

export function ConsolidatedReport({ students: initialStudents, uniqueTests, reportType = 'tests' }: { students: ReportCardStudent[], uniqueTests: string[], reportType?: 'tests' | 'subjects' }) {
  // Ensure students are strictly sorted by overall percentage (highest to lowest) 
  // so the Legend and color mappings match the exact rank order.
  const students = [...initialStudents].sort((a, b) => b.percentage - a.percentage)

  const chartData = uniqueTests.map(testName => {
    const dataPoint: any = { name: testName }
    students.forEach(student => {
      const test = student.breakdown.find(t => t.testName === testName)
      if (test && !test.isAbsent) {
        dataPoint[student.id] = test.percentage
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
    <div id="consolidated-report" className="bg-zinc-950 text-white p-8 relative font-sans w-[900px] mx-auto overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Table Section */}
      <div id="report-table-section" className="mb-12 relative z-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight mb-2 uppercase drop-shadow-sm">Class Performance Report</h1>
          <h2 className="text-lg text-zinc-400 font-bold tracking-widest uppercase">Consolidated Result & Comparative Analysis</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-2 font-black text-zinc-400 uppercase tracking-widest text-xs text-center">Rank</th>
                <th className="py-4 px-4 font-black text-zinc-400 uppercase tracking-widest text-xs">Student Name</th>
                <th className="py-4 px-4 font-black text-zinc-400 uppercase tracking-widest text-xs text-center border-r border-white/5">Score</th>
                {uniqueTests.map(test => (
                  <th key={test} className="py-4 px-2 font-black text-zinc-400 uppercase tracking-widest text-xs text-center">{test}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr key={student.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 bg-transparent">
                  <td className="py-3 px-2 font-black text-zinc-500 text-center text-lg">
                    {student.rank === 1 && <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">1</span>}
                    {student.rank === 2 && <span className="text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.5)]">2</span>}
                    {student.rank === 3 && <span className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]">3</span>}
                    {student.rank > 3 && student.rank}
                  </td>
                  <td className="py-3 px-4 font-bold text-white text-sm">
                    {student.name}
                  </td>
                  <td className="py-3 px-4 text-center border-r border-white/5">
                    {student.percentage > 0 ? (
                      <span className="font-black text-emerald-400 text-sm">{student.percentage}%</span>
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
                          <span className="font-bold text-zinc-300 text-sm">{test.percentage}%</span>
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

      {/* Chart Section */}
      {students.length > 1 && uniqueTests.length > 0 && (
        <div className="flex flex-col gap-8">
          {/* Grouped Bar Chart (Individual Test Comparison) */}
          <div id="report-bar-chart" className="relative z-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-zinc-300 uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-4">
              <span className="w-12 h-1 bg-gradient-to-r from-transparent to-blue-500/50 rounded-full"></span>
              {reportType === 'subjects' ? 'Subject Breakdown' : 'Individual Test Breakdown'}
              <span className="w-12 h-1 bg-gradient-to-l from-transparent to-emerald-500/50 rounded-full"></span>
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 0 }}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="5 5" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 16, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 16, fontWeight: 'bold' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '20px' }}
                    itemStyle={{ fontWeight: 'black', fontSize: '18px', padding: '6px 0' }}
                    formatter={(val: number) => [`${val}%`, 'Score']}
                  />
                  {students.map((student, idx) => {
                    const color = getStudentColor(idx, students.length)
                    const barWidth = Math.max(8, 40 - students.length * 2)
                    return (
                      <Bar 
                        key={student.id}
                        dataKey={student.id} 
                        name={student.name}
                        fill={color} 
                        barSize={barWidth}
                        shape={(props: any) => {
                          const { x, y, width, height, fill } = props;
                          if (height == null || isNaN(height)) return null;
                          const isTall = height > 60;
                          return (
                            <g>
                              {/* The Bar */}
                              <path d={`M${x},${y + height} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + width - 4},${y} Q${x + width},${y} ${x + width},${y + 4} L${x + width},${y + height} Z`} fill={fill} />
                              
                              {/* The Name Label (only if wide enough!) */}
                              {width > 16 && (
                                <text 
                                  x={x + width / 2} 
                                  y={isTall ? y + height - 10 : y - 10} 
                                  fill={isTall ? "#09090b" : fill} 
                                  textAnchor="start" 
                                  transform={`rotate(-90, ${x + width / 2}, ${isTall ? y + height - 10 : y - 10})`}
                                  style={{ fontSize: `${Math.max(10, Math.min(14, width - 2))}px`, fontWeight: 'black', pointerEvents: 'none', filter: !isTall ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' : 'none' }}
                                >
                                  {student.name}
                                </text>
                              )}
                            </g>
                          )
                        }}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Custom HTML Legend to Guarantee Order */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 mt-6 px-4">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getStudentColor(idx, students.length) }}></div>
                  <span className="text-zinc-300 font-bold text-sm tracking-wide">{student.name} <span className="text-zinc-500">({student.percentage}%)</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Chart (Line for Time Series, Radar for Cross-Subject) */}
          <div id="report-line-chart" className="relative z-10 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl p-6 shadow-2xl mt-4">
            <h3 className="text-xl font-black text-zinc-300 uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-4">
              <span className="w-12 h-1 bg-gradient-to-r from-transparent to-amber-500/50 rounded-full"></span>
              {reportType === 'subjects' ? 'Skill Profile Comparison' : 'Performance Trajectory'}
              <span className="w-12 h-1 bg-gradient-to-l from-transparent to-rose-500/50 rounded-full"></span>
            </h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'subjects' ? (
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#ffffff20" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 14, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a' }} stroke="#71717a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '20px' }}
                      itemStyle={{ fontWeight: 'black', fontSize: '18px', padding: '6px 0' }}
                      formatter={(val: number) => [`${val}%`, 'Score']}
                    />
                    {students.map((student, idx) => {
                      const color = getStudentColor(idx, students.length)
                      return (
                        <Radar 
                          key={student.id}
                          name={student.name} 
                          dataKey={student.id} 
                          stroke={color} 
                          fill={color} 
                          fillOpacity={0.3} 
                        />
                      )
                    })}
                  </RadarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="#ffffff10" strokeDasharray="5 5" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 16, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 16, fontWeight: 'bold' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '20px' }}
                      itemStyle={{ fontWeight: 'black', fontSize: '18px', padding: '6px 0' }}
                      formatter={(val: number) => [`${val}%`, 'Score']}
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
                          strokeWidth={5} 
                          dot={{ fill: '#09090b', r: 8, strokeWidth: 4, stroke: color }} 
                          activeDot={{ r: 12, fill: color, stroke: '#fff', strokeWidth: 4 }} 
                          connectNulls
                        />
                      )
                    })}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            {/* Custom HTML Legend to Guarantee Order */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 mt-6 px-4">
              {students.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getStudentColor(idx, students.length) }}></div>
                  <span className="text-zinc-300 font-bold text-sm tracking-wide">{student.name} <span className="text-zinc-500">({student.percentage}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 text-center text-sm text-zinc-600 pt-8 font-bold uppercase tracking-widest relative z-10 flex flex-col items-center gap-4">
        <div className="w-32 h-1 bg-white/5 rounded-full"></div>
        Generated securely by Leaderboard Engine
      </div>
    </div>
  )
}
