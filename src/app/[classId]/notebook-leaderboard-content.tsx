import prisma from '@/lib/prisma'
import { LeaderboardView } from './leaderboard-view'

export async function NotebookLeaderboardContent({ classId, subjectId, availableSubjects, isReadOnly = false }: { classId: string, subjectId: string, availableSubjects: {id: string, name: string}[], isReadOnly?: boolean }) {
  if (!subjectId) return null;

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
    orderBy: { checkDate: 'asc' }
  })

  // Group by student
  const studentMap = new Map<string, any>()

  checks.forEach(check => {
    const key = check.student.rollNumber ? check.student.rollNumber.trim() : check.student.id
    
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        id: check.student.id,
        name: check.student.name,
        rollNumber: check.student.rollNumber,
        section: check.student.section,
        badges: check.student.badges || [],
        obtained: 0, // This will be number of 'C' checks
        total: 0,    // Total checks
        percentage: 0,
        isAbsent: false, // We'll just say false for notebooks if they have a record
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
    
    let obtainedScore = 0
    // Give 1 point for complete, 0 for incomplete/absent/not brought
    if (check.status === 'C') {
      sData.obtained += 1
      obtainedScore = 1
    }

    sData.percentage = Math.round((sData.obtained / sData.total) * 100)

    const dateStr = new Date(check.checkDate).toLocaleDateString('en-GB')
    
    // Ensure we handle breakdowns correctly for overall vs subject
    // In subject view, breakdown item is by date.
    // In overall view, we typically want breakdown by subject.
    if (isOverall) {
      // For overall, let's aggregate by subject in the breakdown
      let subjBreakdown = sData.breakdown.find((b: any) => b.testName === check.subject.name)
      if (!subjBreakdown) {
        subjBreakdown = {
          testName: check.subject.name,
          testDate: null,
          obtained: 0,
          total: 0,
          percentage: 0,
          isAbsent: false
        }
        sData.breakdown.push(subjBreakdown)
      }
      subjBreakdown.total += 1
      if (check.status === 'C') subjBreakdown.obtained += 1
      subjBreakdown.percentage = Math.round((subjBreakdown.obtained / subjBreakdown.total) * 100)
    } else {
      // For single subject, breakdown by date
      sData.breakdown.push({
        testName: `Check ${dateStr}`,
        testDate: check.checkDate,
        obtained: obtainedScore,
        total: 1,
        percentage: obtainedScore * 100,
        isAbsent: check.status === 'A' || check.status === 'N',
        statusLabel: check.status // Custom field just in case
      })
    }
  })

  let finalStudents = Array.from(studentMap.values())
  
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

  if (isOverall) {
    // For OverallLeaderboardView, we need to map the breakdowns so they match subjects exactly
    // OverallLeaderboardView expects subjectBreakdown map
    const formattedStudents = finalStudents.map(s => {
      const subjectBreakdown: Record<string, { obtained: number, total: number, percentage: number }> = {}
      s.breakdown.forEach((b: any) => {
        subjectBreakdown[b.testName] = {
          obtained: b.obtained,
          total: b.total,
          percentage: b.percentage
        }
      })
      return {
        ...s,
        subjectBreakdown
      }
    })

    return <LeaderboardView 
      classId={classId} 
      students={formattedStudents as any} 
      isReadOnly={isReadOnly}
      title="Overall Notebook Checks"
      unit="Copies"
    />
  }

  return <LeaderboardView 
    classId={classId} 
    students={finalStudents} 
    subjectId={subjectId} 
    isReadOnly={isReadOnly} 
  />
}
