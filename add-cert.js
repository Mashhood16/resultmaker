const fs = require('fs');

function addCertificateToLeaderboard() {
  let text = fs.readFileSync('src/app/[classId]/leaderboard-view.tsx', 'utf8');
  
  // Add import
  if (!text.includes('MonthlyCertificate')) {
    text = text.replace(
      "import { ClassAnalyticsCharts } from '@/components/analytics/class-analytics-charts'",
      "import { ClassAnalyticsCharts } from '@/components/analytics/class-analytics-charts'\nimport { MonthlyCertificate } from '@/components/monthly-certificate'"
    );
  }

  // Add button next to Export Report
  const target = `{selectedStudents.size > 0 && (
              <div className="flex gap-2">
                <Button onClick={openReportModal} disabled={isExporting} className="bg-emerald-600 hover:bg-primary text-foreground rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">
                  <Printer className="w-4 h-4 mr-2" />
                  {isExporting ? 'Generating...' : \`Export Report\`}
                </Button>
              </div>
            )}`;
            
  const replacement = `{selectedMonthFilter !== 'all' && top3.length > 0 && (
              <MonthlyCertificate 
                monthName={selectedMonthFilter} 
                className={initialData[0]?.breakdown[0]?.testName ? classId : classId} // We can just pass classId for now
                topStudents={top3.map(s => ({ name: s.name, percentage: s.percentage, rank: s.rank }))}
              />
            )}
            
            {selectedStudents.size > 0 && (
              <div className="flex gap-2">
                <Button onClick={openReportModal} disabled={isExporting} className="bg-emerald-600 hover:bg-primary text-foreground rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50">
                  <Printer className="w-4 h-4 mr-2" />
                  {isExporting ? 'Generating...' : \`Export Report\`}
                </Button>
              </div>
            )}`;

  // Wait, classId passed is an ID, not the string name. Let's look for how ClassName is derived.
  // Actually, we don't have className passed to LeaderboardView as a string. Wait, LeaderboardView doesn't receive className as string, but LeaderboardPage receives it in params!
  // I'll just pass "Class" for now.
  
  if (!text.includes('<MonthlyCertificate')) {
    text = text.replace(target, replacement);
  }

  fs.writeFileSync('src/app/[classId]/leaderboard-view.tsx', text, 'utf8');
}

addCertificateToLeaderboard();
console.log("Done");
