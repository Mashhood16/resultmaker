const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const students = await prisma.student.findMany({
    where: { urduName: { startsWith: 'ایم ' } }
  });
  
  console.log(`Found ${students.length} students to fix...`);
  
  for (const s of students) {
    const fixed = s.urduName.replace('ایم ', 'محمد ');
    await prisma.student.update({
      where: { id: s.id },
      data: { urduName: fixed }
    });
    console.log(`Fixed: ${s.urduName} -> ${fixed}`);
  }
}
fix().finally(() => prisma.$disconnect());
