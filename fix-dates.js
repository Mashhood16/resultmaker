const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const result = await prisma.score.updateMany({
    where: { testName: { contains: '11 sept', mode: 'insensitive' } },
    data: {
      testDate: new Date('2026-09-11T00:00:00.000Z')
    }
  })
  console.log(`Updated ${result.count} tests successfully.`)
}
main().finally(() => prisma.$disconnect())
