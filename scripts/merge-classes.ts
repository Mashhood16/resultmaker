import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const classes = await prisma.class.findMany()
  const schoolClassMap = new Map()

  for (const c of classes) {
    const key = `${c.schoolId}_${c.name.toLowerCase()}`
    if (!schoolClassMap.has(key)) {
      schoolClassMap.set(key, [])
    }
    schoolClassMap.get(key).push(c)
  }

  const entries = Array.from(schoolClassMap.entries());
  for (const [key, classGroup] of entries) {
    if (classGroup.length > 1) {
      console.log(`Found duplicate for ${key}:`, classGroup.map((c: any) => c.name))
      
      let keep = classGroup.find((c: any) => c.name.match(/^[A-Z]/))
      if (!keep) keep = classGroup[0]
      
      const mergeFrom = classGroup.filter((c: any) => c.id !== keep.id)

      for (const source of mergeFrom) {
        console.log(`Moving students and relations from "${source.name}" (${source.id}) to "${keep.name}" (${keep.id})`)
        
        await prisma.student.updateMany({
          where: { classId: source.id },
          data: { classId: keep.id }
        })

        const accesses = await prisma.teacherSubjectAccess.findMany({ where: { classId: source.id } })
        for (const acc of accesses) {
          const existing = await prisma.teacherSubjectAccess.findFirst({
            where: { userId: acc.userId, subjectId: acc.subjectId, classId: keep.id }
          })
          if (existing) {
            await prisma.teacherSubjectAccess.delete({ where: { id: acc.id } })
          } else {
            await prisma.teacherSubjectAccess.update({
              where: { id: acc.id },
              data: { classId: keep.id }
            })
          }
        }

        await prisma.onlineTest.updateMany({
          where: { classId: source.id },
          data: { classId: keep.id }
        })

        const usersWithSourceClass = await prisma.user.findMany({
          where: { classes: { some: { id: source.id } } },
          include: { classes: true }
        })
        for (const user of usersWithSourceClass) {
          const hasKeepClass = user.classes.some((c: any) => c.id === keep.id)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              classes: {
                disconnect: { id: source.id },
                ...(hasKeepClass ? {} : { connect: { id: keep.id } })
              }
            }
          })
        }

        await prisma.class.delete({ where: { id: source.id } })
        console.log(`Deleted duplicate class ${source.id}`)
      }
    }
  }
  console.log("Merge completed.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
