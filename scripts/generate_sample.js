const xlsx = require('xlsx');

const wsData = [
  ['Roll No.', 'Student Name', 'Section', 'Marks Obtained', 'Total Marks'],
  ['101', 'John Doe', 'A', '18', '20'],
  ['102', 'Jane Smith', 'A', '15', '20'],
  ['103', 'Ayyan', 'B', '19', '20'],
  ['104', 'Absent Student', 'B', 'A', '20'],
];

const ws = xlsx.utils.aoa_to_sheet(wsData);

// add some column widths
ws['!cols'] = [
  { wch: 10 },
  { wch: 20 },
  { wch: 10 },
  { wch: 15 },
  { wch: 15 }
];

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Scores');

const fs = require('fs');
fs.mkdirSync('public', { recursive: true });
xlsx.writeFile(wb, 'public/sample_format.xlsx');
console.log('Sample format generated successfully!');
