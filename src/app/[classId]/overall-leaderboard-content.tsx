import prisma from '@/lib/prisma'
import { LeaderboardView } from './leaderboard-view'

export async function OverallLeaderboardContent({ classId, availableSubjects, isReadOnly = false }: { classId: string, availableSubjects: {id: string, name: string}[], isReadOnly?: boolean }) {
  const scores = await prisma.score.findMany({
    where: {
      student: { classId, showInLeaderboard: true }
    },
    include: {
      student: {
        include: {
          badges: true
        }
      },
      subject: true
    },
    orderBy: { createdAt: 'asc' }
  })

  // Group by student
  const studentMap = new Map<string, any>()

  scores.forEach(score => {
    const key = score.student.rollNumber ? score.student.rollNumber.trim() : score.student.id
    
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        id: score.student.id,
        name: score.student.name,
        rollNumber: score.student.rollNumber,
        section: score.student.section,
        badges: score.student.badges || [],
        obtained: 0,
        total: 0,
        percentage: 0,
        isAbsent: true,
        breakdown: []
      })
    } else {
      const existing = studentMap.get(key)!
      if (score.student.name.length > existing.name.length) {
        existing.name = score.student.name
      }
    }

    const sData = studentMap.get(key)!
    
    const isAbsent = score.isAbsent
    
    if (!isAbsent) {
      sData.isAbsent = false
    }

    const obtainedNum = isAbsent ? 0 : (score.marksObtained || 0)
    const totalNum = score.totalMarks || 0

    sData.obtained += obtainedNum
    sData.total += totalNum

    // Preserve individual tests to allow client-side month filtering to work
    sData.breakdown.push({
      testName: `${score.subject.name} - ${score.testName}`,
      testDate: score.testDate,
      obtained: obtainedNum,
      total: totalNum,
      percentage: totalNum > 0 ? Number(((obtainedNum / totalNum) * 100).toFixed(2)) : 0,
      isAbsent: isAbsent
    })
  })

  // Finalize calculations
  const finalData = Array.from(studentMap.values()).map(sData => {
    sData.percentage = sData.total > 0 ? Number(((sData.obtained / sData.total) * 100).toFixed(2)) : 0
    return sData
  })

  // Sort by percentage descending
  finalData.sort((a, b) => b.percentage - a.percentage)

  return (
    <LeaderboardView 
      initialData={finalData} 
      classId={classId} 
      availableSubjects={availableSubjects} 
      isReadOnly={isReadOnly}
    />
  )
}
