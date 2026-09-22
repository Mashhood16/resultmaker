'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TestPerformance {
  testName: string
  average: number
  date?: string
}

interface GradeDistribution {
  grade: string
  count: number
  color: string
}

interface AnalyticsChartsProps {
  trendData: TestPerformance[]
  gradeDistributionData: GradeDistribution[]
}

export function ClassAnalyticsCharts({ trendData, gradeDistributionData }: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-[300px] animate-pulse bg-card/40" />
        <Card className="h-[300px] animate-pulse bg-card/40" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full animate-in fade-in duration-700 delay-200">
      <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-xl overflow-hidden group">
        <CardHeader className="pb-2 border-b border-border/30 bg-background/30">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>Class Performance Trend</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Average %</Badge>
          </CardTitle>
          <CardDescription>Average score across all tests over time</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="h-[220px] w-full">
            {trendData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="testName" 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => \`\${value}%\`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    formatter={(val: any) => [\`\${val}%\`, 'Class Average']}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#000' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <span>Need at least 2 tests to show a trend.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-xl overflow-hidden group">
        <CardHeader className="pb-2 border-b border-border/30 bg-background/30">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>Grade Distribution</span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Latest Test</Badge>
          </CardTitle>
          <CardDescription>Number of students in each grade tier</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="h-[220px] w-full">
            {gradeDistributionData.reduce((sum, item) => sum + item.count, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistributionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="grade" 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [val, 'Students']}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1500}>
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <span>No grades available yet.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
