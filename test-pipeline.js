const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const classId = "cmt95k59300bcvhg9hpt6sspg"
  
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

  const studentMap = new Map()

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
    }

    const sData = studentMap.get(key)
    const isAbsent = score.isAbsent
    if (!isAbsent) sData.isAbsent = false

    const obtainedNum = isAbsent ? 0 : (score.marksObtained || 0)
    const totalNum = score.totalMarks || 0

    sData.obtained += obtainedNum
    sData.total += totalNum

    sData.breakdown.push({
      testName: `${score.subject.name} - ${score.testName}`,
      testDate: score.testDate,
      obtained: obtainedNum,
      total: totalNum,
      percentage: totalNum > 0 ? Number(((obtainedNum / totalNum) * 100).toFixed(2)) : 0,
      isAbsent: isAbsent
    })
  })

  const finalData = Array.from(studentMap.values()).map(sData => {
    sData.percentage = sData.total > 0 ? Number(((sData.obtained / sData.total) * 100).toFixed(2)) : 0
    return sData
  })

  const ayyan = finalData.find(s => s.name.includes("Ayyan"))
  console.log("Ayyan Initial Data:")
  console.log("Total:", ayyan.total, "Obtained:", ayyan.obtained)

  const selectedMonthFilter = "September 2026"
  
  const filteredBreakdown = ayyan.breakdown.filter(b => {
    if (!b.testDate) return false;
    const d = new Date(b.testDate);
    if (isNaN(d.getTime())) return false;
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) === selectedMonthFilter;
  });
  
  let newObtained = 0;
  let newTotal = 0;
  
  filteredBreakdown.forEach(b => {
    if (!b.isAbsent) newObtained += b.obtained;
    newTotal += b.total;
  });
  
  console.log("\nAyyan Filtered for September:")
  console.log("Filtered Breakdown Tests:", filteredBreakdown.map(b => b.testName))
  console.log("New Total:", newTotal, "New Obtained:", newObtained)
  console.log("Percentage:", (newObtained / newTotal * 100).toFixed(2) + "%")
}

main().finally(() => prisma.$disconnect())
