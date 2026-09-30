const fs = require('fs');
let content = fs.readFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', 'utf8');
content = content.replace(/students={formattedStudents as any}/, "initialData={formattedStudents as any}");
content = content.replace(/students={finalStudents}/, "initialData={finalStudents as any}");
fs.writeFileSync('src/app/[classId]/notebook-leaderboard-content.tsx', content, 'utf8');
console.log('Fixed prop name!');
