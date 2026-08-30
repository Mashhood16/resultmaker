const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: {
      rollNumber: { not: null }
    }
  })
  
  const map = {}
  let fixed = 0
  for (const s of students) {
    // Unique per class (the user requested no duplicate roll number in any class)
    const key = `${s.classId}-${s.rollNumber}`
    if (map[key]) {
      // It's a duplicate, set to null
      await prisma.student.update({
        where: { id: s.id },
        data: { rollNumber: null }
      })
      fixed++
    } else {
      map[key] = s
    }
  }
  
  console.log(`Fixed ${fixed} duplicate roll numbers by setting them to null.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
