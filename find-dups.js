const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: {
      rollNumber: { not: null }
    }
  })
  
  const map = {}
  let hasDups = false
  for (const s of students) {
    const key = `${s.classId}-${s.rollNumber}`
    if (map[key]) {
      console.log(`Duplicate found! Class: ${s.classId}, Roll: ${s.rollNumber}`)
      console.log(` Student 1: ${map[key].name} (${map[key].id})`)
      console.log(` Student 2: ${s.name} (${s.id})`)
      hasDups = true
    } else {
      map[key] = s
    }
  }
  
  if (!hasDups) {
    console.log("No duplicates found with non-null roll numbers.")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
