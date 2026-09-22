const fs = require('fs');

function updateCert() {
  let text = fs.readFileSync('src/components/monthly-certificate.tsx', 'utf8');
  
  const oldText = `  const first = topStudents.find(s => s.rank === 1) || topStudents[0]
  const second = topStudents.find(s => s.rank === 2) || topStudents[1]
  const third = topStudents.find(s => s.rank === 3) || topStudents[2]`;

  const newText = `  const first = topStudents.find(s => s.rank === 1) || topStudents[0]
  const second = topStudents.find(s => s.rank === 2) || topStudents[1]
  const third = topStudents.find(s => s.rank === 3) || topStudents[2]

  // Try to parse class and subject from URL if possible
  let displayClass = className;
  let displaySubject = subjectName;
  try {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'leaderboard') {
        if (parts[2]) displayClass = decodeURIComponent(parts[2]);
        if (parts[3]) displaySubject = decodeURIComponent(parts[3]);
      }
    }
  } catch (e) {}
`;

  text = text.replace(oldText, newText);

  // Replace usage
  text = text.replace(
    "{className} {subjectName ? `• ${subjectName}` : ''}",
    "{displayClass} {displaySubject ? `• ${displaySubject}` : ''}"
  );

  fs.writeFileSync('src/components/monthly-certificate.tsx', text, 'utf8');
}
updateCert();
