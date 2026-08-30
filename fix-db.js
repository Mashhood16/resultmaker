const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: {
      rollNumber: ""
    }
  })
  
  console.log(`Found ${students.length} students with empty string rollNumber.`)
  
  for (const student of students) {
    await prisma.student.update({
      where: { id: student.id },
      data: { rollNumber: null }
    })
  }
  
  console.log('Fixed.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
