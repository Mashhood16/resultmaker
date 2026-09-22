const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } }, school: true }
  });
  console.log("Classes by School:");
  classes.forEach(c => console.log(`School: ${c.school.name} (${c.school.username}) - Class: ${c.name} - Students: ${c._count.students}`));
}
check().finally(() => prisma.$disconnect());
