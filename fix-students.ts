import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const allStudents = await prisma.student.findMany()
  const nameGroups = new Map<string, any[]>()
  
  for (const s of allStudents) {
    const key = s.classId + '-' + s.name.toLowerCase().trim()
    if (!nameGroups.has(key)) nameGroups.set(key, [])
    nameGroups.get(key)!.push(s)
  }
  
  for (const [key, students] of nameGroups.entries()) {
    if (students.length > 1) {
      const withRoll = students.find((s: any) => s.rollNumber !== null)
      const withoutRoll = students.find((s: any) => s.rollNumber === null)
      
      if (withRoll && withoutRoll) {
        console.log('Merging ' + withoutRoll.name + '...')
        try {
          const scores = await prisma.score.findMany({ where: { studentId: withRoll.id } })
          for (const score of scores) {
            await prisma.score.update({ where: { id: score.id }, data: { studentId: withoutRoll.id } }).catch((e: any) => {})
          }
          const attempts = await prisma.testAttempt.findMany({ where: { studentId: withRoll.id } })
          for (const attempt of attempts) {
            await prisma.testAttempt.update({ where: { id: attempt.id }, data: { studentId: withoutRoll.id } }).catch((e: any) => {})
          }
          
          // DELETE first to avoid unique constraint!
          await prisma.student.delete({ where: { id: withRoll.id } }).catch((e: any) => {})
          
          // Then UPDATE
          await prisma.student.update({ where: { id: withoutRoll.id }, data: { rollNumber: withRoll.rollNumber, showInLeaderboard: true } })
          
          console.log('Merged ' + withoutRoll.name + ' successfully!')
        } catch(e) { console.error('Failed to merge ' + withoutRoll.name, e) }
      }
    }
  }

  await prisma.student.updateMany({
    where: { rollNumber: { not: null }, showInLeaderboard: false },
    data: { showInLeaderboard: true }
  })
  console.log("Cleanup complete!")
}
main().catch(console.error).finally(() => prisma.$disconnect())
