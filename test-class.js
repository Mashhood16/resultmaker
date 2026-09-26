const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const scores = await prisma.score.findMany({
    where: { student: { name: { contains: 'Ayyan' } } },
    include: { student: true, subject: true }
  })
  for (const s of scores) {
     console.log(`- ${s.subject.name} | ${s.testName} | ClassId: ${s.student.classId}`)
  }
}
main().finally(() => prisma.$disconnect())
