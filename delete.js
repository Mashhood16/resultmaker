const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteSchool() {
  const school = await prisma.school.findFirst({
    where: { username: 'Tariq' }
  });
  
  if (school) {
    await prisma.school.delete({
      where: { id: school.id }
    });
    console.log(`Deleted school: ${school.name}`);
  } else {
    console.log("School not found!");
  }
}
deleteSchool().finally(() => prisma.$disconnect());
