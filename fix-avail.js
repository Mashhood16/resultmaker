const fs = require('fs');
let content = fs.readFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', 'utf8');

// Fix first return
content = content.replace(
  /return <LeaderboardView\s+classId={classId}\s+initialData={formattedStudents as any}\s+isReadOnly={isReadOnly}/,
  `return <LeaderboardView \n      classId={classId} \n      initialData={formattedStudents as any} \n      availableSubjects={availableSubjects} \n      isReadOnly={isReadOnly}`
);

// Fix second return
content = content.replace(
  /return <LeaderboardView\s+classId={classId}\s+initialData={finalStudents as any}\s+subjectId={subjectId}\s+isReadOnly={isReadOnly}\s+\/>/,
  `return <LeaderboardView \n    classId={classId} \n    initialData={finalStudents as any} \n    subjectId={subjectId} \n    availableSubjects={availableSubjects} \n    isReadOnly={isReadOnly} \n  />`
);

fs.writeFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', content, 'utf8');
console.log('Fixed missing availableSubjects prop!');
