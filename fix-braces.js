const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/copy-actions.ts', 'utf8');

content = content.replace(
  /\}\r?\n          \} else if \(data\.status === 'N'\) \{/g,
  `} else if (data.status === 'N') {`
);

content = content.replace(
  /\}\r?\n          \} else if \(check\.status === 'N'\) \{/g,
  `} else if (check.status === 'N') {`
);

fs.writeFileSync('src/app/dashboard/copy-actions.ts', content, 'utf8');
console.log('Fixed extra braces.');
