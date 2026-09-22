const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function translateToUrdu(text) {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    return text;
  } catch (error) {
    return text;
  }
}

async function backfill() {
  console.log("Starting backfill...");
  
  const subjects = await prisma.subject.findMany({ where: { urduName: null } });
  for (const sub of subjects) {
    const translated = await translateToUrdu(sub.name);
    await prisma.subject.update({ where: { id: sub.id }, data: { urduName: translated } });
    console.log(`Translated Subject: ${sub.name} -> ${translated}`);
  }

  const students = await prisma.student.findMany({ where: { urduName: null } });
  console.log(`Translating ${students.length} students...`);
  
  for (const stu of students) {
    const translated = await translateToUrdu(stu.name);
    await prisma.student.update({ where: { id: stu.id }, data: { urduName: translated } });
    console.log(`Translated Student: ${stu.name} -> ${translated}`);
    // Sleep a tiny bit to avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log("Done backfilling!");
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
