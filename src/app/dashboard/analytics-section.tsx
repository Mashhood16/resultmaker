import prisma from '@/lib/prisma'
import { ClassTrendChart } from '@/components/analytics/class-trend-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp } from 'lucide-react'

export async function AnalyticsSection({ classIds }: { classIds: string[] }) {
  if (classIds.length === 0) return null

  // Fetch recent scores to calculate trends
  const recentScores = await prisma.score.findMany({
    where: { student: { classId: { in: classIds } } },
    select: {
      testName: true,
      percentage: true,
      createdAt: true,
      student: { select: { class: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'asc' },
    take: 5000 // reasonable limit for overview
  })

  if (recentScores.length === 0) {
    return (
      <Card className="mb-10 bg-card border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
          <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
          <p>Not enough data for analytics yet. Start generating results to see insights!</p>
        </CardContent>
      </Card>
    )
  }

  // Group by testName and calculate average
  const testAverages = new Map<string, { total: number; count: number; date: Date }>()
  
  recentScores.forEach(score => {
    const existing = testAverages.get(score.testName)
    if (existing) {
      existing.total += score.percentage
      existing.count += 1
    } else {
      testAverages.set(score.testName, { total: score.percentage, count: 1, date: score.createdAt })
    }
  })

  // Format data for Recharts
  const chartData = Array.from(testAverages.entries())
    .map(([name, data]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      average: Math.round(data.total / data.count),
      timestamp: data.date.getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-10) // Show last 10 tests

  const overallAvg = chartData.length > 0 
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.average, 0) / chartData.length)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <Card className="md:col-span-2 shadow-lg border-border bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Class Performance Trend
          </CardTitle>
          <CardDescription>Average percentage score across recent tests</CardDescription>
        </CardHeader>
        <CardContent>
          <ClassTrendChart data={chartData} />
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
  )
}
