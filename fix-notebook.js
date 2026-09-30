const fs = require('fs');
let content = fs.readFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', 'utf8');
content = content.replace("import { OverallLeaderboardView } from './overall-leaderboard-view'\n", "");
content = content.replace(/return <OverallLeaderboardView[\s\S]*?\/>/, `return <LeaderboardView 
      classId={classId} 
      students={formattedStudents as any} 
      isReadOnly={isReadOnly}
      title="Overall Notebook Checks"
      unit="Copies"
    />`);
fs.writeFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', content, 'utf8');
console.log('Fixed import!');
