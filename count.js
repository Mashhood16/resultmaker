const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const classes = await prisma.class.findMany({
    include: { _count: { select: { students: true } } }
  });
  console.log("Students per class:");
  classes.forEach(c => console.log(`${c.name}: ${c._count.students}`));
}
check().finally(() => prisma.$disconnect());
