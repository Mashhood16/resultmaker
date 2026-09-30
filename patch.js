const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/copy-actions.ts', 'utf8');

// 1. Add N to StudentCheck type in saveInteractiveCopyChecksAction
content = content.replace(
  /studentChecks: \{ studentId: string, status: 'C' \| 'I' \| 'A' \}\[\]/,
  "studentChecks: { studentId: string, status: 'C' | 'I' | 'A' | 'N' }[]"
);

// 2. Add N to status check in saveInteractiveCopyChecksAction
content = content.replace(
  /if \(student\.fatherPhone && \(check\.status === 'I' \|\| check\.status === 'A'\)\)/,
  "if (student.fatherPhone && (check.status === 'C' || check.status === 'I' || check.status === 'A' || check.status === 'N'))"
);

// 3. Add N to status mapping logic in uploadCopyCheckingAction
// Original:
//      if (statusRaw === 'C' || statusRaw === 'COMPLETE') status = 'C'
//      if (statusRaw === 'I' || statusRaw === 'INCOMPLETE') status = 'I'
//      if (statusRaw === 'A' || statusRaw === 'ABSENT') status = 'A'
const statusMapping = `      if (statusRaw === 'C' || statusRaw === 'COMPLETE') status = 'C'
      if (statusRaw === 'I' || statusRaw === 'INCOMPLETE') status = 'I'
      if (statusRaw === 'A' || statusRaw === 'ABSENT') status = 'A'
      if (statusRaw === 'N' || statusRaw === 'NOT BROUGHT' || statusRaw === 'NOT') status = 'N'`;
content = content.replace(
  /      if \(statusRaw === 'C' \|\| statusRaw === 'COMPLETE'\) status = 'C'\r?\n      if \(statusRaw === 'I' \|\| statusRaw === 'INCOMPLETE'\) status = 'I'\r?\n      if \(statusRaw === 'A' \|\| statusRaw === 'ABSENT'\) status = 'A'/,
  statusMapping
);

// 4. Also update the typescript type for status in uploadCopyCheckingAction
content = content.replace(
  /let status: 'C' \| 'I' \| 'A' \| null = null/,
  "let status: 'C' | 'I' | 'A' | 'N' | null = null"
);

// 5. Add N to condition in uploadCopyCheckingAction
content = content.replace(
  /if \(student && student\.fatherPhone && \(data\.status === 'I' \|\| data\.status === 'A' \|\| data\.status === 'C'\)\)/,
  "if (student && student.fatherPhone && (data.status === 'I' || data.status === 'A' || data.status === 'C' || data.status === 'N'))"
);

// 6. Update the interactive copy messages.
const cInteractive = `          if (check.status === 'C') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${data.subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} کی \${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!\`
          } else if (check.status === 'I') {`;

content = content.replace(/          if \(check\.status === 'I'\) \{/, cInteractive);

const nInteractive = `} else if (check.status === 'N') {
             urduMessage = \`Assalam o Alaikum! Aap ka bacha \${student.name} (Class \${classRecord.name}) aaj \${data.subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} آج \${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے.\`
          }`;
content = content.replace(
  /\} else if \(check\.status === 'A'\) \{([\s\S]*?)ki copy check nahi ho saki.\\n\\nالسلام علیکم! آپ کا بچہ \$\{studentUrduName\} آج غیر حاضر تھا جس کی وجہ سے \$\{subjectUrduName\} کی کاپی چیک نہیں ہو سکی۔`\r?\n          \}/,
  function(match) {
    return match + "\n          " + nInteractive;
  }
);

// 7. Update the upload copy messages.
const nUpload = `} else if (data.status === 'N') {
            urduMessage = \`Assalam o Alaikum! Aap ka bacha \${student.name} (Class \${classRecord.name}) aaj \${subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} آج \${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے.\`
          }`;
content = content.replace(
  /\} else if \(data\.status === 'A'\) \{([\s\S]*?)ki copy check nahi ho saki.\\n\\nالسلام علیکم! آپ کا بچہ \$\{studentUrduName\} آج غیر حاضر تھا جس کی وجہ سے \$\{subjectUrduName\} کی کاپی چیک نہیں ہو سکی۔`\r?\n          \}/,
  function(match) {
    return match + "\n          " + nUpload;
  }
);

fs.writeFileSync('src/app/dashboard/copy-actions.ts', content, 'utf8');
console.log('Patched copy-actions.ts surgically.');
