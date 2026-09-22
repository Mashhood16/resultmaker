const fs = require('fs');

function updateDashboardAnalytics() {
  let text = fs.readFileSync('src/app/dashboard/analytics-client.tsx', 'utf8');
  
  // Replace import
  text = text.replace(
    "import { ClassTrendChart } from \"@/components/analytics/class-trend-chart\"",
    "import { ClassAnalyticsCharts } from \"@/components/analytics/class-analytics-charts\""
  );

  // Compute Grade Distribution Data
  const oldDataLogic = `  const { chartData, overallAvg } = useMemo(() => {
    if (filteredScores.length === 0) return { chartData: [], overallAvg: 0 }`;

  const newDataLogic = `  const { chartData, overallAvg, gradeDistributionData } = useMemo(() => {
    if (filteredScores.length === 0) return { chartData: [], overallAvg: 0, gradeDistributionData: [] }`;
    
  text = text.replace(oldDataLogic, newDataLogic);

  const oldReturnData = `    return { chartData: cData, overallAvg: avg }
  }, [filteredScores])`;

  const newReturnData = `    // Calculate Grade Distribution (A, B, C, F) for all filtered scores
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
  }, [filteredScores])`;

  text = text.replace(oldReturnData, newReturnData);

  // Replace UI
  const oldUI = `      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>`;

  const newUI = `      <div className="w-full">
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
      </div>`;

  text = text.replace(oldUI, newUI);

  fs.writeFileSync('src/app/dashboard/analytics-client.tsx', text, 'utf8');
}

updateDashboardAnalytics();
console.log("Done");
