const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/copy-actions.ts', 'utf8');

content = content.replace(
  /studentChecks: \{ studentId: string, status: 'C' \| 'I' \| 'A' \}?\[\]/g,
  "studentChecks: { studentId: string, status: 'C' | 'I' | 'A' | 'N' }[]"
);

content = content.replace(
  /if \(student\.fatherPhone && \(check\.status === 'I' \|\| check\.status === 'A'\)\)/g,
  "if (student.fatherPhone && (check.status === 'C' || check.status === 'I' || check.status === 'A' || check.status === 'N'))"
);

content = content.replace(
  /if \(student && student\.fatherPhone && \(data\.status === 'I' \|\| data\.status === 'A' \|\| data\.status === 'C'\)\)/g,
  "if (student && student.fatherPhone && (data.status === 'I' || data.status === 'A' || data.status === 'C' || data.status === 'N'))"
);

// Now let's inject the missing 'C' and 'N' messages correctly.
// For uploadCopyCheckingAction (uses data.status)
const cMessageUrdu = "Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ki ${subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے ${studentUrduName} کی ${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!";
const nMessageUrdu = "Assalam o Alaikum! Aap ka bacha ${student.name} (Class ${classRecord.name}) aaj ${subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ ${studentUrduName} آج ${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے۔";

content = content.replace(
  /\} else if \(data\.status === 'A'\) \{([\s\S]*?)\}/,
  `} else if (data.status === 'A') {$1} else if (data.status === 'N') {\n            urduMessage = \`${nMessageUrdu}\`\n          }`
);

// For saveInteractiveCopyChecksAction (uses check.status)
const cMessageUrduInteractive = "Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ki ${data.subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے ${studentUrduName} کی ${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!";
const nMessageUrduInteractive = "Assalam o Alaikum! Aap ka bacha ${student.name} (Class ${classRecord.name}) aaj ${data.subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ ${studentUrduName} آج ${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے۔";

content = content.replace(
  /if \(check\.status === 'I'\) \{/,
  `if (check.status === 'C') {\n            urduMessage = \`${cMessageUrduInteractive}\`\n          } else if (check.status === 'I') {`
);

content = content.replace(
  /\} else if \(check\.status === 'A'\) \{([\s\S]*?)\}/,
  `} else if (check.status === 'A') {$1} else if (check.status === 'N') {\n             urduMessage = \`${nMessageUrduInteractive}\`\n          }`
);

fs.writeFileSync('src/app/dashboard/copy-actions.ts', content, 'utf8');
console.log('Updated copy-actions.ts completely!');
