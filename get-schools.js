const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany();
  console.log('Schools in DB:');
  schools.forEach(s => console.log(`- Name: ${s.name} | Username: ${s.username}`));
}

main().finally(() => prisma.$disconnect());
