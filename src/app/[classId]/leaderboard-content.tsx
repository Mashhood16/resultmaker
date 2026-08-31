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
      student: {
        include: {
          badges: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const attempts = await prisma.testAttempt.findMany({
    where: {
      student: { classId, showInLeaderboard: true },
      test: { subjectId }
    },
    select: {
      studentId: true,
      test: { select: { testName: true } },
      annotatedImage: true,
      feedback: true,
      answers: true,
      questionMarks: true
    }
  })

  const attemptDataMap = new Map<string, { image: string | null, feedback: string | null, answers: string | null, questionMarks: any }>()
  attempts.forEach(a => {
    attemptDataMap.set(`${a.studentId}_${a.test.testName}`, {
      image: a.annotatedImage,
      feedback: a.feedback,
      answers: a.answers,
      questionMarks: a.questionMarks
    })
  })

  // Group by student
  const studentMap = new Map<string, {
    id: string
    name: string
    rollNumber: string | null
    section: string | null
    badges: Array<{ id: string, name: string, icon: string, description: string }>
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
      annotatedImage?: string | null
      feedback?: string | null
      answers?: string | null
      questionMarks?: string[] | null
    }>
  }>()

  const testStatsMap = new Map<string, { totalPercentage: number, count: number }>()

  scores.forEach(score => {
    // Group by rollNumber if available, fallback to ID
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
        isAbsent: true, // Will be false if they attended at least one test
        breakdown: []
      })
    } else {
      // If we merge students, keep the longer name (e.g. "Muhammad Wasif" vs "Wasif")
      const existing = studentMap.get(key)!
      if (score.student.name.length > existing.name.length) {
        existing.name = score.student.name
      }
    }

    const sData = studentMap.get(key)!
    
    // Prevent duplicate scores for the same testName if students were merged
    const existingTest = sData.breakdown.find(b => b.testName === score.testName)
    if (!existingTest) {
      const attemptInfo = attemptDataMap.get(`${score.studentId}_${score.testName}`)
      // Add to breakdown
      sData.breakdown.push({
        testName: score.testName,
        obtained: score.marksObtained,
        total: score.totalMarks,
        percentage: Number(score.percentage.toFixed(2)),
        isAbsent: score.isAbsent,
        annotatedImage: attemptInfo?.image,
        feedback: attemptInfo?.feedback,
        answers: attemptInfo?.answers,
        questionMarks: attemptInfo?.questionMarks ? (typeof attemptInfo.questionMarks === 'string' ? JSON.parse(attemptInfo.questionMarks) : attemptInfo.questionMarks) : null
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
    }
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
    
    // Evaluate Dynamic Badges based on performance history
    const dynamicBadges = []
    
    if (student.breakdown.length >= 2) {
      const validTests = student.breakdown.filter(b => !b.isAbsent)
      if (validTests.length >= 2) {
        const firstScore = validTests[0].percentage
        const lastScore = validTests[validTests.length - 1].percentage
        
        // Most Improved: +15% or more from first to last test
        if (lastScore - firstScore >= 15) {
          dynamicBadges.push({ id: 'dyn_improved', name: 'Most Improved', icon: '📈', description: 'Showed significant improvement over time (+15% or more).' })
        }
        
        // Comeback: Below 50% initially, but hit 80% or higher recently
        if (firstScore < 50 && lastScore >= 80) {
          dynamicBadges.push({ id: 'dyn_comeback', name: 'Comeback', icon: '🚀', description: 'Bounced back from a low score to achieve excellence.' })
        }
      }
    }
    
    // Perfect Scorer: 100% on any test
    if (student.breakdown.some(b => !b.isAbsent && b.percentage === 100)) {
      dynamicBadges.push({ id: 'dyn_perfect', name: 'Perfect Scorer', icon: '🌟', description: 'Achieved a perfect 100% on at least one test.' })
    }

    // Consistent Scholar: Maintained a highly consistent score (>= 80%) across 3+ tests
    const validTests = student.breakdown.filter(b => !b.isAbsent)
    if (validTests.length >= 3) {
      const avg = validTests.reduce((acc, b) => acc + b.percentage, 0) / validTests.length
      const isHigh = avg >= 80
      const isConsistent = validTests.every(b => Math.abs(b.percentage - avg) <= 5)
      if (isHigh && isConsistent) {
        dynamicBadges.push({ id: 'dyn_consistent', name: 'Consistent Scholar', icon: '🎯', description: 'Maintained a consistently high score across all tests.' })
      }
    }

    // Add dynamic badges to the student's badge array
    student.badges = [...student.badges, ...dynamicBadges]

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
