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

const cUpload = `          if (data.status === 'C') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} کی \${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!\`
          } else if (data.status === 'I') {`;

content = content.replace(
  /          if \(data\.status === 'C'\) \{\n            urduMessage = `Assalam[\s\S]*?\} else if \(data\.status === 'I'\) \{/,
  cUpload
);

const aUploadOriginalEnd = "check nahi ho saki.\\n\\nالسلام علیکم! آپ کا بچہ ${studentUrduName} آج غیر حاضر تھا جس کی وجہ سے ${subjectUrduName} کی کاپی چیک نہیں ہو سکی۔`\n          }";

const nUpload = `} else if (data.status === 'N') {
            urduMessage = \`Assalam o Alaikum! Aap ka bacha \${student.name} (Class \${classRecord.name}) aaj \${subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} آج \${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے۔\`
          }`;

content = content.replace(aUploadOriginalEnd, aUploadOriginalEnd + "\n          " + nUpload);

const cInteractive = `          if (check.status === 'C') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${data.subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} کی \${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!\`
          } else if (check.status === 'I') {`;

content = content.replace(/          if \(check\.status === 'I'\) \{/, cInteractive);

const aInteractiveOriginalEnd = "check nahi ho saki.\\n\\nالسلام علیکم! آپ کا بچہ ${studentUrduName} آج غیر حاضر تھا جس کی وجہ سے ${subjectUrduName} کی کاپی چیک نہیں ہو سکی۔`\n          }";

const nInteractive = `} else if (check.status === 'N') {
             urduMessage = \`Assalam o Alaikum! Aap ka bacha \${student.name} (Class \${classRecord.name}) aaj \${data.subjectName} ki copy school nahi laya jis ki wajah se checking nahi ho saki. Barae meharbani yaqeeni banayen ke bacha rozana apna mukammal bag school laye.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} آج \${subjectUrduName} کی کاپی سکول نہیں لایا جس کی وجہ سے چیکنگ نہیں ہو سکی۔ براہ مہربانی یقینی بنائیں کہ بچہ روزانہ اپنا مکمل بیگ سکول لائے۔\`
          }`;

content = content.replace(aInteractiveOriginalEnd, aInteractiveOriginalEnd + "\n          " + nInteractive);

fs.writeFileSync('src/app/dashboard/copy-actions.ts', content, 'utf8');
console.log('Fixed copy-actions.ts completely!');
