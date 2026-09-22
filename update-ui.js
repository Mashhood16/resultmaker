const fs = require('fs');

function updateLeaderboardView() {
  let text = fs.readFileSync('src/app/[classId]/leaderboard-view.tsx', 'utf8');
  
  // 1. Add imports
  if (!text.includes('ClassAnalyticsCharts')) {
    text = text.replace(
      "import { sanitizeHtml } from '@/lib/sanitize'",
      "import { sanitizeHtml } from '@/lib/sanitize'\nimport { ClassAnalyticsCharts } from '@/components/analytics/class-analytics-charts'\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'"
    );
  }

  // 2. Add state for Month Filter
  if (!text.includes('selectedMonthFilter')) {
    text = text.replace(
      "const [selectedTestFilter, setSelectedTestFilter] = useState<string>('all')",
      "const [selectedTestFilter, setSelectedTestFilter] = useState<string>('all')\n  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all')"
    );
  }

  // 3. Extract unique months from tests
  const monthsLogic = `
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    initialData.forEach(student => {
      student.breakdown.forEach(b => {
        if (b.testDate) {
          const d = new Date(b.testDate)
          if (!isNaN(d.getTime())) {
            const monthYear = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            months.add(monthYear)
          }
        }
      })
    })
    return Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [initialData])
  `;

  if (!text.includes('availableMonths = useMemo')) {
    text = text.replace(
      "const uniqueTests = useMemo(() => {",
      monthsLogic + "\n  const uniqueTests = useMemo(() => {"
    );
  }

  // 4. Update activeData to respect month filter
  const oldActiveData = `  const activeData = useMemo(() => {
    if (selectedTestFilter === 'all') {
      return initialData
    }`;
    
  const newActiveData = `  const activeData = useMemo(() => {
    let filteredStudents = initialData;

    // Filter by Month first if selected
    if (selectedMonthFilter !== 'all') {
      filteredStudents = initialData.map(student => {
        // Only keep breakdown items that match the month
        const filteredBreakdown = student.breakdown.filter(b => {
          if (!b.testDate) return false;
          const d = new Date(b.testDate);
          if (isNaN(d.getTime())) return false;
          return d.toLocaleString('en-US', { month: 'long', year: 'numeric' }) === selectedMonthFilter;
        });
        
        let newObtained = 0;
        let newTotal = 0;
        let isAbsent = true;
        
        filteredBreakdown.forEach(b => {
          if (!b.isAbsent) {
            newObtained += b.obtained;
            isAbsent = false;
          }
          newTotal += b.total; // total is always added
        });
        
        return {
          ...student,
          breakdown: filteredBreakdown,
          obtained: newObtained,
          total: newTotal,
          percentage: newTotal > 0 ? Number(((newObtained / newTotal) * 100).toFixed(2)) : 0,
          isAbsent: filteredBreakdown.length === 0 ? true : isAbsent
        };
      }).filter(s => s.breakdown.length > 0); // Only keep students who have tests in this month

      // Recalculate ranks for the month
      filteredStudents.sort((a, b) => b.percentage - a.percentage);
      let rank = 1;
      filteredStudents.forEach((student, idx) => {
        if (idx > 0 && student.percentage < filteredStudents[idx - 1].percentage) {
          rank = idx + 1;
        }
        student.rank = rank;
        student.rankChange = student.overallRank ? student.overallRank - rank : 0;
      });
    }

    if (selectedTestFilter === 'all') {
      return filteredStudents;
    }

    // Filter and recalculate ranks and scores for the selected test
    const testStudents = filteredStudents.map(student => {
      const testScore = student.breakdown.find(b => b.testName === selectedTestFilter)
      const obtained = testScore && !testScore.isAbsent ? testScore.obtained : 0
      const total = testScore ? testScore.total : 0
      const percentage = testScore && !testScore.isAbsent ? testScore.percentage : 0
      const isAbsent = !testScore || testScore.isAbsent

      return {
        ...student,
        obtained,
        total,
        percentage,
        isAbsent,
        overallRank: student.rank,
        rank: 0,
        previousRank: student.rank, // Compare against overall standing
        rankChange: 0
      }
    })`;

  text = text.replace(oldActiveData, newActiveData);

  // 5. Generate Analytics Data
  const analyticsLogic = `
  const analyticsData = useMemo(() => {
    // 1. Trend Data (Line Chart)
    const testAverages = new Map<string, { total: number, count: number, date?: string }>()
    activeData.forEach(student => {
      student.breakdown.forEach(b => {
        if (!b.isAbsent) {
          if (!testAverages.has(b.testName)) {
            testAverages.set(b.testName, { total: 0, count: 0, date: b.testDate as string })
          }
          const t = testAverages.get(b.testName)!
          t.total += b.percentage
          t.count += 1
        }
      })
    })
    
    const trendData = Array.from(testAverages.entries()).map(([testName, data]) => ({
      testName,
      average: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0,
      date: data.date
    }))
    
    // Sort chronologically if possible
    trendData.sort((a, b) => {
      if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime()
      return 0
    })

    // 2. Grade Distribution (Bar Chart) for the latest test (or all if 'all')
    const distribution = { A: 0, B: 0, C: 0, F: 0 }
    activeData.forEach(student => {
      if (student.isAbsent) return
      if (student.percentage >= 85) distribution.A++
      else if (student.percentage >= 70) distribution.B++
      else if (student.percentage >= 50) distribution.C++
      else distribution.F++
    })

    const gradeDistributionData = [
      { grade: 'Platinum (85%+)', count: distribution.A, color: '#3b82f6' },
      { grade: 'Gold (70-84%)', count: distribution.B, color: '#f59e0b' },
      { grade: 'Silver (50-69%)', count: distribution.C, color: '#a1a1aa' },
      { grade: 'Bronze (<50%)', count: distribution.F, color: '#b45309' },
    ]

    return { trendData, gradeDistributionData }
  }, [activeData])
  `;

  if (!text.includes('analyticsData = useMemo')) {
    text = text.replace(
      "const filteredData = useMemo(() => {",
      analyticsLogic + "\n  const filteredData = useMemo(() => {"
    );
  }

  // 6. Insert UI for Analytics Chart and Month Filter
  const uiInsert = `
      {/* Test Filter Info Banner */}
      {selectedTestFilter !== 'all' && (
        <div className="flex justify-center pt-2">
          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-4 py-1.5 text-xs font-bold flex items-center gap-2 shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            Filtered to Test: <span className="underline">{selectedTestFilter}</span>
          </Badge>
        </div>
      )}

      {/* Analytics Charts */}
      {selectedTestFilter === 'all' && (
        <ClassAnalyticsCharts 
          trendData={analyticsData.trendData} 
          gradeDistributionData={analyticsData.gradeDistributionData} 
        />
      )}
`;

  text = text.replace(
    `      {/* Test Filter Info Banner */}
      {selectedTestFilter !== 'all' && (
        <div className="flex justify-center pt-2">
          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary px-4 py-1.5 text-xs font-bold flex items-center gap-2 shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            Filtered to Test: <span className="underline">{selectedTestFilter}</span>
          </Badge>
        </div>
      )}`,
    uiInsert
  );

  // 7. Add Month Filter UI to the Table Header
  const filterUI = `
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 max-w-md relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  placeholder="Search by student name or section..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-border text-foreground pl-12 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </div>

              {/* Month Filter */}
              {availableMonths.length > 0 && (
                <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                  <SelectTrigger className="w-[180px] h-11 bg-card/80 border-border rounded-xl">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    {availableMonths.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
`;

  text = text.replace(
    `            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 max-w-md relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input 
                  placeholder="Search by student name or section..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-border text-foreground pl-12 h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </div>`,
    filterUI
  );

  fs.writeFileSync('src/app/[classId]/leaderboard-view.tsx', text, 'utf8');
}

updateLeaderboardView();
console.log("Done");
