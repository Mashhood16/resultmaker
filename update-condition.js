const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/copy-actions.ts', 'utf8');

// Replace the condition in uploadCopyCheckingAction
content = content.replace(
  /data\.status === 'I' \|\| data\.status === 'A' \|\| data\.status === 'C' \|\| data\.status === 'N'/,
  "data.status === 'I' || data.status === 'A' || data.status === 'N'"
);

// Replace the condition in saveInteractiveCopyChecksAction
content = content.replace(
  /check\.status === 'C' \|\| check\.status === 'I' \|\| check\.status === 'A' \|\| check\.status === 'N'/,
  "check.status === 'I' || check.status === 'A' || check.status === 'N'"
);

fs.writeFileSync('src/app/dashboard/copy-actions.ts', content, 'utf8');
console.log('Successfully updated the message condition.');
