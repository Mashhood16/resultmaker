const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  const school = await prisma.school.findFirst({
    where: { username: 'Tariq' },
    include: { classes: { include: { students: true } } }
  });
  
  if (!school) {
    console.log("School not found!");
    return;
  }

  const studentIds = school.classes.flatMap(c => c.students.map(s => s.id));
  
  console.log(`Deleting ${studentIds.length} students...`);
  
  // Delete all nested records for these students
  await prisma.score.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.testAttempt.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.badge.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.whatsAppQueue.deleteMany({ where: { studentId: { in: studentIds } } });
  await prisma.notebookCheck.deleteMany({ where: { studentId: { in: studentIds } } });
  
  // Now delete the students
  await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
  
  // Now we can safely delete the school
  await prisma.school.delete({ where: { id: school.id } });
  
  console.log("Cleaned up successfully!");
}
cleanup().finally(() => prisma.$disconnect());
