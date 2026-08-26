import prisma from '@/lib/prisma'
import { LeaderboardView } from './leaderboard-view'

export async function LeaderboardContent({ classId, subjectId, availableSubjects }: { classId: string, subjectId: string, availableSubjects: {id: string, name: string}[] }) {
  if (!subjectId) return null;

  const scores = await prisma.score.findMany({
    where: {
      subjectId,
      student: { classId, showInLeaderboard: true }
    },
    include: {
      student: true
    }
  })

  // Group by student
  const studentMap = new Map<string, {
    id: string
    name: string
    rollNumber: string | null
    section: string | null
    obtained: number
    total: number
    percentage: number
    isAbsent: boolean
    breakdown: Array<{
      testName: string
      obtained: number
      total: number
      percentage: number
      isAbsent: boolean
      classAverage?: number
    }>
  }>()

  const testStatsMap = new Map<string, { totalPercentage: number, count: number }>()

  scores.forEach(score => {
    const sId = score.student.id
    if (!studentMap.has(sId)) {
      studentMap.set(sId, {
        id: sId,
        name: score.student.name,
        rollNumber: score.student.rollNumber,
        section: score.student.section,
        obtained: 0,
        total: 0,
        percentage: 0,
        isAbsent: true, // Will be false if they attended at least one test
        breakdown: []
      })
    }

    const sData = studentMap.get(sId)!
    
    // Add to breakdown
    sData.breakdown.push({
      testName: score.testName,
      obtained: score.marksObtained,
      total: score.totalMarks,
      percentage: score.percentage,
      isAbsent: score.isAbsent
    })

    // Aggregate Student totals
    if (!score.isAbsent) {
      sData.obtained += score.marksObtained
      sData.isAbsent = false
      
      // Test Stats for Class Average
      if (!testStatsMap.has(score.testName)) {
        testStatsMap.set(score.testName, { totalPercentage: 0, count: 0 })
      }
      const tStats = testStatsMap.get(score.testName)!
      tStats.totalPercentage += score.percentage
      tStats.count += 1
    }
    
    // We add the total marks even if absent to accurately calculate percentage penalty
    sData.total += score.totalMarks
  })

  // Calculate test averages
  const testAverages = new Map<string, number>()
  testStatsMap.forEach((stats, testName) => {
    testAverages.set(testName, stats.count > 0 ? Number((stats.totalPercentage / stats.count).toFixed(2)) : 0)
  })

  // Calculate cumulative percentage and convert to array with classAverages injected
  const aggregatedData = Array.from(studentMap.values()).map(student => {
    student.percentage = student.total > 0 ? Number(((student.obtained / student.total) * 100).toFixed(2)) : 0
    student.breakdown = student.breakdown.map(b => ({
      ...b,
      classAverage: testAverages.get(b.testName) || 0
    }))
    return student
  })

  // Sort by percentage descending
  aggregatedData.sort((a, b) => b.percentage - a.percentage)

  // Assign ranks
  let currentRank = 1;
  const rankedData = aggregatedData.map((student, index) => {
    if (index > 0 && student.percentage < aggregatedData[index - 1].percentage) {
      currentRank = index + 1;
    }
    return {
      ...student,
      rank: currentRank
    }
  })

  return (
    <LeaderboardView initialData={rankedData} classId={classId} availableSubjects={availableSubjects} />
  )
}
