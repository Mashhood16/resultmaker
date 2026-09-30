const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/notebook-log-view.tsx', 'utf8');
content = "'use client'\n\n" + content;
fs.writeFileSync('src/app/dashboard/notebook-log-view.tsx', content, 'utf8');
console.log('Added use client!');
