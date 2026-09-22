const fs = require('fs');

function fixActionsTS() {
  let text = fs.readFileSync('src/app/dashboard/actions.ts', 'utf8');
  if (!text.includes('translateToUrdu')) {
    text = text.replace("import prisma from '@/lib/prisma'", "import prisma from '@/lib/prisma'\nimport { translateToUrdu } from '@/lib/translate'");
  }
  
  // Replace the student loop whatsapp message block
  const oldMsgBlock = `        if (student.fatherPhone) {
          const formattedDate = new Date(testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
          
          let urduMessage = '';
          if (data.isAbsent) {
            urduMessage = \`Assalam o Alaikum. Aap ka bacha \${student.name} (Class \${classRecord.name}) \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.\\n\\nالسلام علیکم! آپ کا بچہ مذکورہ امتحان میں غیر حاضر تھا۔ براہ مہربانی اس بات کا خیال رکھیں کہ بچہ باقاعدگی سے امتحان دے۔\`;
          } else {
            const isGoodMarks = data.percentage >= 50;
            if (isGoodMarks) {
              urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ne \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein bohot achi karkardagi dikhai hai. Us ne \${data.totalMarks} mein se \${data.marksObtained} marks haasil kiye hain. Shabash!\\n\\nالسلام علیکم! آپ کے بچے نے مذکورہ امتحان میں بہت اچھی کارکردگی دکھائی ہے۔ اس نے \${data.totalMarks} میں سے \${data.marksObtained} نمبر حاصل کیے ہیں۔ شاباش!\`;
            } else {
              urduMessage = \`Assalam o Alaikum. Aap ke bache \${student.name} (Class \${classRecord.name}) ne \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein \${data.totalMarks} mein se sirf \${data.marksObtained} marks haasil kiye hain. Barae meharbani bache ki parhai par tawajah dein.\\n\\nالسلام علیکم! آپ کے بچے نے مذکورہ امتحان میں \${data.totalMarks} میں سے صرف \${data.marksObtained} نمبر حاصل کیے ہیں۔ براہ مہربانی بچے کی پڑھائی پر توجہ دیں۔\`;
            }
          }
          
          urduMessage += '\\n\\nMuhammad Mashhood Tariq';`;

  const newMsgBlock = `        if (student.fatherPhone) {
          let studentUrduName = student.urduName;
          if (!studentUrduName) {
             studentUrduName = await translateToUrdu(student.name);
             await tx.student.update({ where: { id: student.id }, data: { urduName: studentUrduName } })
          }
          let subjectUrduName = subjectRecord.urduName;
          if (!subjectUrduName) {
             subjectUrduName = await translateToUrdu(subjectRecord.name);
             await tx.subject.update({ where: { id: subjectRecord.id }, data: { urduName: subjectUrduName } })
          }
          const d = new Date(testDate);
          const urduDate = \`\${d.getDate()}-\${d.getMonth()+1}-\${d.getFullYear()}\`;
          const formattedDate = new Date(testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
          
          let urduMessage = '';
          if (data.isAbsent) {
            urduMessage = \`Assalam o Alaikum. Aap ka bacha \${student.name} (Class \${classRecord.name}) \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} تاریخ \${urduDate} کو ہونے والے \${subjectUrduName} کے امتحان میں غیر حاضر تھا۔ براہ مہربانی اس بات کا خیال رکھیں کہ بچہ باقاعدگی سے امتحان دے۔\`;
          } else {
            const isGoodMarks = data.percentage >= 50;
            if (isGoodMarks) {
              urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ne \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein bohot achi karkardagi dikhai hai. Us ne \${data.totalMarks} mein se \${data.marksObtained} marks haasil kiye hain. Shabash!\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} نے تاریخ \${urduDate} کو ہونے والے \${subjectUrduName} کے امتحان میں بہت اچھی کارکردگی دکھائی ہے۔ اس نے \${data.totalMarks} میں سے \${data.marksObtained} نمبر حاصل کیے ہیں۔ شاباش!\`;
            } else {
              urduMessage = \`Assalam o Alaikum. Aap ke bache \${student.name} (Class \${classRecord.name}) ne \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein \${data.totalMarks} mein se sirf \${data.marksObtained} marks haasil kiye hain. Barae meharbani bache ki parhai par tawajah dein.\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} نے تاریخ \${urduDate} کو ہونے والے \${subjectUrduName} کے امتحان میں \${data.totalMarks} میں سے صرف \${data.marksObtained} نمبر حاصل کیے ہیں۔ براہ مہربانی بچے کی پڑھائی پر توجہ دیں۔\`;
            }
          }
          
          urduMessage += '\\n\\nMuhammad Mashhood Tariq';`;

  text = text.replace(oldMsgBlock, newMsgBlock);
  
  // Also replace roster student absent block
  const oldRosterBlock = `          if (rosterStudent.fatherPhone) {
            const formattedDate = new Date(testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
            let urduMessage = \`Assalam o Alaikum. Aap ka bacha \${rosterStudent.name} (Class \${classRecord.name}) \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.\\n\\nالسلام علیکم! آپ کا بچہ مذکورہ امتحان میں غیر حاضر تھا۔ براہ مہربانی اس بات کا خیال رکھیں کہ بچہ باقاعدگی سے امتحان دے。\`;
            urduMessage += '\\n\\nMuhammad Mashhood Tariq';`;

  const newRosterBlock = `          if (rosterStudent.fatherPhone) {
            let studentUrduName = rosterStudent.urduName;
            if (!studentUrduName) {
               studentUrduName = await translateToUrdu(rosterStudent.name);
               await tx.student.update({ where: { id: rosterStudent.id }, data: { urduName: studentUrduName } })
            }
            let subjectUrduName = subjectRecord.urduName; // already fetched above if any student triggered it, but we can safely assume it was done, or fetch it. Actually it's cached in subjectRecord, but let's re-fetch if needed. We'll just assume subjectUrduName is there or fallback.
            if (!subjectUrduName) {
               subjectUrduName = await translateToUrdu(subjectRecord.name);
               await tx.subject.update({ where: { id: subjectRecord.id }, data: { urduName: subjectUrduName } })
               subjectRecord.urduName = subjectUrduName;
            }
            const d = new Date(testDate);
            const urduDate = \`\${d.getDate()}-\${d.getMonth()+1}-\${d.getFullYear()}\`;
            const formattedDate = new Date(testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
            let urduMessage = \`Assalam o Alaikum. Aap ka bacha \${rosterStudent.name} (Class \${classRecord.name}) \${formattedDate} ko hone wale \${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.\\n\\nالسلام علیکم! آپ کا بچہ \${studentUrduName} تاریخ \${urduDate} کو ہونے والے \${subjectUrduName} کے امتحان میں غیر حاضر تھا۔ براہ مہربانی اس بات کا خیال رکھیں کہ بچہ باقاعدگی سے امتحان دے。\`;
            urduMessage += '\\n\\nMuhammad Mashhood Tariq';`;

  text = text.replace(oldRosterBlock, newRosterBlock);
  fs.writeFileSync('src/app/dashboard/actions.ts', text, 'utf8');
}

function fixCopyActionsTS() {
  let text = fs.readFileSync('src/app/dashboard/copy-actions.ts', 'utf8');
  if (!text.includes('translateToUrdu')) {
    text = text.replace("import prisma from '@/lib/prisma'", "import prisma from '@/lib/prisma'\nimport { translateToUrdu } from '@/lib/translate'");
  }

  const oldBlock = `          let urduMessage = ''
          
          if (data.status === 'C') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!\`
          } else if (data.status === 'I') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${subjectName} ki copy namukammal (incomplete) hai. Barae meharbani is par tawajah dein aur bache ka kaam mukammal karwayen.\\n\\nالسلام علیکم! آپ کے بچے کی کاپی نامکمل ہے۔ براہ مہربانی اس پر توجہ دیں اور بچے کا کام مکمل کروائیں۔\`
          }`;
          
  const newBlock = `          let studentUrduName = student.urduName;
          if (!studentUrduName) {
             studentUrduName = await translateToUrdu(student.name);
             await tx.student.update({ where: { id: student.id }, data: { urduName: studentUrduName } })
          }
          let subjectUrduName = subjectRecord.urduName;
          if (!subjectUrduName) {
             subjectUrduName = await translateToUrdu(subjectRecord.name);
             await tx.subject.update({ where: { id: subjectRecord.id }, data: { urduName: subjectUrduName } })
          }

          let urduMessage = ''
          
          if (data.status === 'C') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} کی \${subjectUrduName} کی کاپی مکمل ہے اور چیک کر لی گئی ہے۔ شاباش!\`
          } else if (data.status === 'I') {
            urduMessage = \`Assalam o Alaikum! Aap ke bache \${student.name} (Class \${classRecord.name}) ki \${subjectName} ki copy namukammal (incomplete) hai. Barae meharbani is par tawajah dein aur bache ka kaam mukammal karwayen.\\n\\nالسلام علیکم! آپ کے بچے \${studentUrduName} کی \${subjectUrduName} کی کاپی نامکمل ہے۔ براہ مہربانی اس پر توجہ دیں اور بچے کا کام مکمل کروائیں۔\`
          }`;

  text = text.replace(oldBlock, newBlock);
  fs.writeFileSync('src/app/dashboard/copy-actions.ts', text, 'utf8');
}

fixActionsTS();
fixCopyActionsTS();
console.log("Done");
