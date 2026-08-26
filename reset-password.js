const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newPasswordHash = await bcrypt.hash('password123', 10);
  
  await prisma.school.update({
    where: { username: 'Tariq' },
    data: { passwordHash: newPasswordHash }
  });
  
  console.log('Password for school "Tariq" reset to password123');
}

main().finally(() => prisma.$disconnect());
