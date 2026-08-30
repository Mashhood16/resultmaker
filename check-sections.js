const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: {
      rollNumber: { not: null }
    }
  })
  
  const map = {}
  let sameSection = 0
  let diffSection = 0
  for (const s of students) {
    const key = `${s.classId}-${s.rollNumber}`
    if (map[key]) {
      if (map[key].section === s.section) {
        sameSection++
      } else {
        diffSection++
      }
    } else {
      map[key] = s
    }
  }
  
  console.log(`Same section duplicates: ${sameSection}`)
  console.log(`Diff section duplicates: ${diffSection}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
