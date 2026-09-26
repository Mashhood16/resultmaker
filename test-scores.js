const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const scores = await prisma.score.findMany({
    where: {
      student: { name: { contains: 'Ayyan' } }
    },
    include: {
      student: true,
      subject: true
    }
  })
  
  console.log("Ayyan's Scores:")
  let totalObtained = 0;
  let totalTotal = 0;
  for (const s of scores) {
     console.log(`- ${s.subject.name} | ${s.testName} | Date: ${s.testDate} | Obt: ${s.marksObtained} / ${s.totalMarks} | Absent: ${s.isAbsent}`)
     totalObtained += s.marksObtained;
     totalTotal += s.totalMarks;
  }
  console.log(`TOTAL: ${totalObtained} / ${totalTotal} = ${(totalObtained/totalTotal)*100}%`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
