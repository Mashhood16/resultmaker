"use client"

import React, { useState, useMemo } from "react"
import { ClassAnalyticsCharts } from "@/components/analytics/class-analytics-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScoreData {
  testName: string
  percentage: number
  createdAt: Date
  subjectName: string
  className: string
  classId: string
}

export function AnalyticsClient({ scores, classes }: { scores: ScoreData[], classes: {id: string, name: string}[] }) {
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  // Get unique subjects for the selected class (or all classes)
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>()
    scores.forEach(s => {
      if (selectedClass === "all" || s.classId === selectedClass) {
        subjects.add(s.subjectName)
      }
    })
    return Array.from(subjects).sort()
  }, [scores, selectedClass])

  // Filter scores
  const filteredScores = useMemo(() => {
    return scores.filter(s => {
      if (selectedClass !== "all" && s.classId !== selectedClass) return false
      if (selectedSubject !== "all" && s.subjectName !== selectedSubject) return false
      return true
    })
  }, [scores, selectedClass, selectedSubject])

  // Process data for chart
  const { chartData, overallAvg, gradeDistributionData } = useMemo(() => {
    if (filteredScores.length === 0) return { chartData: [], overallAvg: 0, gradeDistributionData: [] }

    const testAverages = new Map<string, { total: number; count: number; date: Date }>()
    
    filteredScores.forEach(score => {
      const existing = testAverages.get(score.testName)
      if (existing) {
        existing.total += score.percentage
        existing.count += 1
      } else {
        testAverages.set(score.testName, { total: score.percentage, count: 1, date: score.createdAt })
      }
    })

    const cData = Array.from(testAverages.entries())
      .map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        average: Math.round(data.total / data.count),
        timestamp: data.date.getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10) // Show last 10 tests

    const avg = cData.length > 0 
      ? Math.round(cData.reduce((acc, curr) => acc + curr.average, 0) / cData.length)
      : 0

    // Calculate Grade Distribution (A, B, C, F) for all filtered scores
    const dist = { A: 0, B: 0, C: 0, F: 0 }
    filteredScores.forEach(score => {
      if (score.percentage >= 85) dist.A++
      else if (score.percentage >= 70) dist.B++
      else if (score.percentage >= 50) dist.C++
      else dist.F++
    })
    
    const gradeDistributionData = [
      { grade: 'Platinum (85%+)', count: dist.A, color: '#3b82f6' },
      { grade: 'Gold (70-84%)', count: dist.B, color: '#f59e0b' },
      { grade: 'Silver (50-69%)', count: dist.C, color: '#a1a1aa' },
      { grade: 'Bronze (<50%)', count: dist.F, color: '#b45309' },
    ]

    return { chartData: cData, overallAvg: avg, gradeDistributionData }
  }, [filteredScores])

  if (scores.length === 0) {
    return (
      <Card className="mb-10 bg-card border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
          <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
          <p>Not enough data for analytics yet. Start generating results to see insights!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full sm:w-auto">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="all">All Classes</TabsTrigger>
            {classes.map(c => (
              <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {availableSubjects.length > 0 && (
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {availableSubjects.map(sub => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="w-full">
        {chartData.length > 0 ? (
          <ClassAnalyticsCharts 
            trendData={chartData.map(d => ({ testName: d.name, average: d.average, date: new Date(d.timestamp).toISOString() }))} 
            gradeDistributionData={gradeDistributionData} 
          />
        ) : (
          <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl border-border">
            No data available for the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
