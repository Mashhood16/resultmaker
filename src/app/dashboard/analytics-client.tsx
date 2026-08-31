"use client"

import React, { useState, useMemo } from "react"
import { ClassTrendChart } from "@/components/analytics/class-trend-chart"
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
  const { chartData, overallAvg } = useMemo(() => {
    if (filteredScores.length === 0) return { chartData: [], overallAvg: 0 }

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

    return { chartData: cData, overallAvg: avg }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg border-border bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Class Performance Trend
            </CardTitle>
            <CardDescription>Average percentage score across recent tests</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ClassTrendChart data={chartData} />
            ) : (
              <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
                No data available for the selected filters.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-border bg-gradient-to-br from-primary/10 to-transparent flex flex-col justify-center">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Overall Average
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-black text-primary">
              {overallAvg}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on the last {chartData.length} tests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
