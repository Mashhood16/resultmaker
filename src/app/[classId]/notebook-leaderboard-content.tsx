import prisma from '@/lib/prisma'
import { LeaderboardView } from './leaderboard-view'
import { formatCheckStatus } from '@/lib/notebook-utils'

export async function NotebookLeaderboardContent({ 
  classId, 
  subjectId, 
  availableSubjects, 
  isReadOnly = false 
}: { 
  classId: string
  subjectId: string
  availableSubjects: { id: string, name: string }[]
  isReadOnly?: boolean 
}) {
  if (!subjectId) return null

  const isOverall = subjectId === 'overall'

  const checks = await prisma.notebookCheck.findMany({
    where: {
      student: { classId, showInLeaderboard: true },
      ...(isOverall ? {} : { subjectId })
    },
    include: {
      student: {
        include: { badges: true }
      },
      subject: true
    },
    orderBy: { checkDate: 'desc' }
  })

  // Group by student
  const studentMap = new Map<string, any>()
  const dateSet = new Set<string>()

  checks.forEach(check => {
    const key = check.student.rollNumber ? check.student.rollNumber.trim() : check.student.id
    const parsedStatus = formatCheckStatus(check.status)
    const dateFormatted = new Date(check.checkDate).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
    
    // Filter option name for dropdown
    const filterName = isOverall ? `${check.subject.name} - ${dateFormatted}` : dateFormatted
    dateSet.add(filterName)

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        id: check.student.id,
        name: check.student.name,
        rollNumber: check.student.rollNumber,
        section: check.student.section,
        badges: check.student.badges || [],
        obtained: 0, // Number of 'C' checks
        total: 0,    // Total checks
        percentage: 0,
        isAbsent: false,
        copySummary: {
          complete: 0,
          incomplete: 0,
          notBrought: 0,
          absent: 0,
          totalMissingChapters: 0
        },
        breakdown: []
      })
    } else {
      const existing = studentMap.get(key)
      if (check.student.name.length > existing.name.length) {
        existing.name = check.student.name
      }
    }

    const sData = studentMap.get(key)
    sData.total += 1
    
    if (parsedStatus.isComplete) {
      sData.obtained += 1
      sData.copySummary.complete += 1
    } else if (parsedStatus.isIncomplete) {
      sData.copySummary.incomplete += 1
      if (parsedStatus.missingCount) {
        sData.copySummary.totalMissingChapters += parsedStatus.missingCount
      }
    } else if (parsedStatus.isNotBrought) {
      sData.copySummary.notBrought += 1
    } else if (parsedStatus.isAbsent) {
      sData.copySummary.absent += 1
    }

    sData.percentage = Math.round((sData.obtained / sData.total) * 100)

    // Store each check by date in breakdown
    sData.breakdown.push({
      testName: filterName,
      testDate: check.checkDate,
      subjectName: check.subject.name,
      obtained: parsedStatus.isComplete ? 1 : 0,
      total: 1,
      percentage: parsedStatus.isComplete ? 100 : 0,
      isAbsent: parsedStatus.isAbsent || parsedStatus.isNotBrought,
      statusCode: parsedStatus.code,
      statusLabel: parsedStatus.label,
      missingChapters: parsedStatus.missingChapters,
      missingCount: parsedStatus.missingCount,
      fullDescription: parsedStatus.fullDescription,
      feedback: parsedStatus.fullDescription
    })
  })

  const finalStudents = Array.from(studentMap.values())

  // Ensure each student's breakdown is sorted newest to oldest
  finalStudents.forEach(s => {
    s.breakdown.sort((a: any, b: any) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
  })

  // Rank them
  finalStudents.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage
    }
    return b.obtained - a.obtained
  })

  // Assign ranks
  let currentRank = 1
  for (let i = 0; i < finalStudents.length; i++) {
    if (i > 0) {
      const prev = finalStudents[i - 1]
      const curr = finalStudents[i]
      if (prev.percentage === curr.percentage && prev.obtained === curr.obtained) {
        curr.rank = prev.rank
      } else {
        curr.rank = currentRank
      }
    } else {
      finalStudents[i].rank = currentRank
    }
    currentRank++
  }

  const allClassTests = Array.from(dateSet)

  return (
    <LeaderboardView 
      classId={classId} 
      initialData={finalStudents as any} 
      availableSubjects={availableSubjects} 
      isReadOnly={isReadOnly}
      isCopies={true}
      allClassTests={allClassTests}
    />
  )
}
