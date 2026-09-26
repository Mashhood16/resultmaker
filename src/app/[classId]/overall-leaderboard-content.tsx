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
        breakdown: [],
        _subjectMap: new Map<string, any>() // Temporary map to group by subject
      })
    } else {
      const existing = studentMap.get(key)!
      if (score.student.name.length > existing.name.length) {
        existing.name = score.student.name
      }
    }

    const sData = studentMap.get(key)!
    
    // We want to skip 'A' (Absent) for obtained, but still include in total if it was a graded test? 
    // Actually, following the logic in leaderboard-content.tsx:
    const isAbsent = score.isAbsent || score.obtainedMarks.toUpperCase() === 'A' || score.obtainedMarks.toUpperCase() === 'ABSENT'
    
    if (!isAbsent) {
      sData.isAbsent = false
    }

    const obtainedNum = isAbsent ? 0 : (parseFloat(score.obtainedMarks) || 0)
    const totalNum = score.totalMarks || 0

    sData.obtained += obtainedNum
    sData.total += totalNum

    // Group by subject
    const subjectName = score.subject.name
    if (!sData._subjectMap.has(subjectName)) {
      sData._subjectMap.set(subjectName, {
        testName: subjectName, // Mapping subject name to testName so LeaderboardView shows it as a column
        testDate: score.testDate, // Just store the latest date to allow month filtering to somewhat work
        obtained: 0,
        total: 0,
        percentage: 0,
        isAbsent: true
      })
    }
    
    const subjectData = sData._subjectMap.get(subjectName)!
    if (!isAbsent) subjectData.isAbsent = false
    subjectData.obtained += obtainedNum
    subjectData.total += totalNum
    
    // Always keep the latest test date for month filtering
    if (score.testDate && (!subjectData.testDate || score.testDate > subjectData.testDate)) {
       subjectData.testDate = score.testDate
    }
  })

  // Finalize calculations
  const finalData = Array.from(studentMap.values()).map(sData => {
    sData.percentage = sData.total > 0 ? (sData.obtained / sData.total) * 100 : 0
    
    sData.breakdown = Array.from(sData._subjectMap.values()).map((subj: any) => {
      subj.percentage = subj.total > 0 ? (subj.obtained / subj.total) * 100 : 0
      return subj
    })
    
    // Sort breakdown by subject name
    sData.breakdown.sort((a: any, b: any) => a.testName.localeCompare(b.testName))
    
    delete sData._subjectMap
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
