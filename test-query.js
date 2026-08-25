const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // get a real class id
    const c = await prisma.class.findFirst()
    if (!c) {
      console.log('No class found')
      return
    }
    
    const student = await prisma.student.findFirst({ where: { classId: c.id } })
    if (!student) {
      console.log('No student found')
      return
    }

    console.log(`Testing with classId ${c.id} and studentId ${student.id}`)
    
    const students = await prisma.student.findMany({
      where: {
        id: { in: [student.id] },
        classId: c.id
      },
      include: {
        scores: {
          where: {
            testName: { in: ['Bi-Monthly'] }
          },
          include: {
            subject: true
          }
        }
      },
      orderBy: [
        { section: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log(JSON.stringify(students, null, 2))
    
    console.log("Mapping...")
    students.map(student => {
      const subjectMap = new Map()
      student.scores.forEach(score => {
        if (!subjectMap.has(score.subjectId)) {
          subjectMap.set(score.subjectId, {
            subjectName: score.subject.name,
            obtained: 0,
            total: 0,
            absences: 0,
            totalTests: 0
          })
        }
      })
    })
    
    console.log("Success!")
  } catch (e) {
    console.error("ERROR:", e.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
