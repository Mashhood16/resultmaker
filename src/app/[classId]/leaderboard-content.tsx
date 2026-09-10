import prisma from '@/lib/prisma'
import { LeaderboardView } from './leaderboard-view'

export async function LeaderboardContent({ classId, subjectId, availableSubjects, isReadOnly = false }: { classId: string, subjectId: string, availableSubjects: {id: string, name: string}[], isReadOnly?: boolean }) {
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

    const validTests = student.breakdown.filter(b => !b.isAbsent)
    
    // Consistent Scholar: Maintained a highly consistent score (>= 80%) across 3+ tests
    if (validTests.length >= 3) {
      const avg = validTests.reduce((acc, b) => acc + b.percentage, 0) / validTests.length
      const isHigh = avg >= 80
      const isConsistent = validTests.every(b => Math.abs(b.percentage - avg) <= 5)
      if (isHigh && isConsistent) {
        dynamicBadges.push({ id: 'dyn_consistent', name: 'Consistent Scholar', icon: '🎯', description: 'Maintained a consistently high score across all tests.' })
      }
    }

    // Negative Badges
    if (validTests.length >= 2) {
      const firstScore = validTests[0].percentage
      const lastScore = validTests[validTests.length - 1].percentage
      
      // Needs Attention: dropped 15% or more
      if (firstScore - lastScore >= 15) {
        dynamicBadges.push({ id: 'dyn_attention', name: 'Needs Attention', icon: '⚠️', description: 'Performance has dropped significantly (-15% or more).' })
      }
    }

    if (validTests.length >= 1) {
      const avg = validTests.reduce((acc, b) => acc + b.percentage, 0) / validTests.length
      if (avg < 40) {
        dynamicBadges.push({ id: 'dyn_struggling', name: 'At Risk', icon: '📉', description: 'Overall average is currently below 40%.' })
      }
    }

    // Ghost: Absent for the last 2 consecutive tests
    if (student.breakdown.length >= 2) {
      const lastTwo = student.breakdown.slice(-2)
      if (lastTwo.every(b => b.isAbsent)) {
        dynamicBadges.push({ id: 'dyn_ghost', name: 'Ghost', icon: '👻', description: 'Has been absent for the last 2 consecutive tests.' })
      }
    }

    // Add dynamic badges to the student's badge array
    student.badges = [...student.badges, ...dynamicBadges]

    return student
  })

  // Determine chronological test order and identify the last test added
  const testOrder: string[] = []
  scores.forEach(s => {
    if (!testOrder.includes(s.testName)) {
      testOrder.push(s.testName)
    }
  })
  const lastTestName = testOrder.length > 0 ? testOrder[testOrder.length - 1] : null

  // If there are at least 2 tests, calculate rank before the last test was added
  const prevRankMap = new Map<string, number>()
  if (testOrder.length >= 2 && lastTestName) {
    const prevPerformance = aggregatedData.map(student => {
      const priorTests = student.breakdown.filter(b => b.testName !== lastTestName)
      let priorObtained = 0
      let priorTotal = 0
      priorTests.forEach(b => {
        if (!b.isAbsent) priorObtained += b.obtained
        priorTotal += b.total
      })
      const priorPercentage = priorTotal > 0 ? Number(((priorObtained / priorTotal) * 100).toFixed(2)) : 0
      return {
        id: student.id,
        priorPercentage,
        hasPrior: priorTests.length > 0
      }
    })

    prevPerformance.sort((a, b) => b.priorPercentage - a.priorPercentage)
    let pRank = 1
    prevPerformance.forEach((p, idx) => {
      if (!p.hasPrior) return
      if (idx > 0 && p.priorPercentage < prevPerformance[idx - 1].priorPercentage) {
        pRank = idx + 1
      }
      prevRankMap.set(p.id, pRank)
    })
  }

  // Sort by percentage descending
  aggregatedData.sort((a, b) => b.percentage - a.percentage)

  // Assign ranks and calculate rank change
  let currentRank = 1;
  const rankedData = aggregatedData.map((student, index) => {
    if (index > 0 && student.percentage < aggregatedData[index - 1].percentage) {
      currentRank = index + 1;
    }
    const previousRank = prevRankMap.get(student.id) ?? null
    const rankChange = previousRank !== null ? previousRank - currentRank : null

    return {
      ...student,
      rank: currentRank,
      previousRank,
      rankChange
    }
  })

  // Find all distinct tests for this class across all subjects in chronological order
  const allClassScores = await prisma.score.findMany({
    where: {
      student: { classId, showInLeaderboard: true }
    },
    select: { testName: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })
  const allClassTests: string[] = []
  allClassScores.forEach(s => {
    if (!allClassTests.includes(s.testName)) {
      allClassTests.push(s.testName)
    }
  })

  return (
    <LeaderboardView 
      initialData={rankedData} 
      classId={classId} 
      availableSubjects={availableSubjects} 
      lastTestName={lastTestName}
      allClassTests={allClassTests}
      isReadOnly={isReadOnly}
    />
  )
}
