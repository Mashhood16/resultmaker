import prisma from "@/lib/prisma"
import { AnalyticsClient } from "./analytics-client"

export async function AnalyticsSection({ classIds }: { classIds: string[] }) {
  if (classIds.length === 0) return null

  // Fetch classes for the tabs
  const classesData = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  // Fetch recent scores to calculate trends
  const recentScores = await prisma.score.findMany({
    where: { student: { classId: { in: classIds } } },
    select: {
      testName: true,
      percentage: true,
      createdAt: true,
      subject: { select: { name: true } },
      student: { select: { classId: true, class: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'asc' },
    take: 5000 // reasonable limit for overview
  })

  // Format data for the client component
  const formattedScores = recentScores.map(score => ({
    testName: score.testName,
    percentage: score.percentage,
    createdAt: score.createdAt,
    subjectName: score.subject.name,
    classId: score.student.classId,
    className: score.student.class.name
  }))

  return (
    <AnalyticsClient scores={formattedScores} classes={classesData} />
  )
}
