import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TermResultPDFPage({
  searchParams,
}: {
  searchParams: { className?: string; testNames?: string; testName?: string }
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  if (!schoolId) {
    redirect('/login')
  }

  // Block unauthorized roles
  if (role === 'student' || role === 'admin') {
    redirect('/')
  }

  const { className } = searchParams
  const rawTestNames = searchParams.testNames || searchParams.testName
  
  if (!className || !rawTestNames) {
    return <div className="p-8 text-center text-muted-foreground">Missing className or testNames parameters</div>
  }

  if (typeof className !== 'string' || className.length > 100) {
    return <div className="p-8 text-center text-red-500">Invalid class name parameter.</div>
  }

  if (typeof rawTestNames !== 'string' || rawTestNames.length > 5000) {
    return <div className="p-8 text-center text-red-500">Invalid test names parameter.</div>
  }

  // Look up school for official display name
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true }
  })
  const schoolName = school?.name || session.user.name || 'SCHOOL NAME'

  // Look up the target class and enforce class-level teacher authorization
  const targetClass = await prisma.class.findFirst({
    where: {
      name: { equals: className, mode: 'insensitive' },
      schoolId: schoolId,
    }
  })

  if (!targetClass) {
    return <div className="p-8 text-center text-red-500">Class "{className}" not found for this school.</div>
  }

  if (role === 'teacher') {
    const classIds = session.user.classIds || []
    if (!classIds.includes(targetClass.id)) {
      redirect('/')
    }
  }

  const testNamesArray = rawTestNames.split(',').map(t => t.trim()).filter(Boolean).slice(0, 50)
  const isLandscape = testNamesArray.length > 1

  const rawStudents = await prisma.student.findMany({
    where: {
      classId: targetClass.id,
    },
    include: {
      scores: {
        where: { testName: { in: testNamesArray } },
        include: { subject: true }
      }
    }
  })

  // Merge students that share the same rollNumber
  const mergedStudentsMap = new Map<string, typeof rawStudents[0]>()
  rawStudents.forEach(student => {
    // Group by rollNumber if it exists, otherwise use their unique ID
    const key = student.rollNumber ? student.rollNumber.trim() : student.id
    
    if (mergedStudentsMap.has(key)) {
      const existing = mergedStudentsMap.get(key)!
      // Merge scores from both records
      existing.scores = [...existing.scores, ...student.scores]
      // Use the longer name (e.g. "Muhammad Wasif" over "Wasif")
      if (student.name.length > existing.name.length) {
        existing.name = student.name
      }
      if (!existing.section && student.section) existing.section = student.section
    } else {
      // Clone the student so we can safely modify their scores array above
      mergedStudentsMap.set(key, { ...student, scores: [...student.scores] })
    }
  })

  const students = Array.from(mergedStudentsMap.values())

  // Pre-calculate cumulative totals to determine ranks
  const studentTotals = students.map(s => {
    let cumulativeObtained = 0
    let cumulativeMax = 0
    s.scores.forEach(score => {
      if (!score.isAbsent) {
        cumulativeObtained += score.marksObtained
      }
      cumulativeMax += score.totalMarks
    })
    const percentage = cumulativeMax > 0 ? (cumulativeObtained / cumulativeMax) * 100 : 0
    return {
      id: s.id,
      cumulativeObtained,
      cumulativeMax,
      percentage,
      student: s
    }
  })

  // Sort for ranking (highest percentage first)
  const rankedStudents = [...studentTotals].sort((a, b) => b.percentage - a.percentage)
  
  // Assign positions
  const positions = new Map<string, number>()
  rankedStudents.forEach((st, index) => {
    positions.set(st.id, index + 1)
  })

  function getPositionString(rank: number) {
    if (rank === 1) return '1st'
    if (rank === 2) return '2nd'
    if (rank === 3) return '3rd'
    return `${rank}th`
  }

  // Sort students strictly by Roll Number for display
  const sortedStudents = studentTotals.sort((a, b) => {
    const rollA = parseInt(a.student.rollNumber || '0') || 0
    const rollB = parseInt(b.student.rollNumber || '0') || 0
    if (rollA !== rollB) return rollA - rollB
    return a.student.name.localeCompare(b.student.name)
  })

  return (
    <div className="bg-zinc-200 min-h-screen text-black flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');
        
        @media print {
          @page { 
            margin: 0; 
            size: A4 ${isLandscape ? 'landscape' : 'portrait'}; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          
          /* Force page constraints to avoid blank pages */
          .result-card-container {
            width: ${isLandscape ? '296mm' : '210mm'};
            height: ${isLandscape ? '209mm' : '296mm'};
            overflow: hidden;
            box-sizing: border-box;
            page-break-after: always;
            page-break-inside: avoid;
            background: white;
            margin: 0;
            padding: 5mm;
          }
        }

        .result-card-container {
          width: ${isLandscape ? '296mm' : '210mm'};
          height: ${isLandscape ? '209mm' : '296mm'};
          padding: 5mm;
        }

        .font-serif { font-family: 'Merriweather', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}} />
      
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 no-print flex justify-between items-center sticky top-0 z-10 shadow-sm w-full text-white">
        <p className="font-medium">Term Result: {testNamesArray.join(', ')} - {className}</p>
        <button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="print-container flex flex-col items-center w-full">
        {sortedStudents.map((data) => {
          const { student, cumulativeObtained, cumulativeMax, percentage } = data
          const rank = positions.get(student.id) || 0
          
          return (
            <div key={student.id} className="result-card-container relative bg-white mx-auto my-8 shadow-2xl flex flex-col">
              
              {/* Double Border wrapper */}
              <div className="border-[3px] border-[#0A4B3A] p-1.5 h-full w-full">
                <div className="border border-[#0A4B3A] h-full w-full p-4 sm:p-6 flex flex-col">
                  
                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#0A4B3A] uppercase tracking-wider mb-2">
                      {schoolName || 'SCHOOL NAME'}
                    </h1>
                    <div className="flex items-center justify-center gap-4 mb-2">
                      <div className="h-px bg-black w-12 sm:w-16"></div>
                      <h2 className="font-serif text-[10px] sm:text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
                        SECONDARY SCHOOL CERTIFICATE
                      </h2>
                      <div className="h-px bg-black w-12 sm:w-16"></div>
                    </div>
                    
                    <div className="inline-block bg-[#E5F5ED] text-[#0A4B3A] px-4 sm:px-8 py-1 sm:py-2 rounded-full font-bold text-[10px] sm:text-sm tracking-widest uppercase border border-[#BDE4D0]">
                      {isLandscape ? 'CUMULATIVE RESULT CARD' : `${testNamesArray[0]} RESULT CARD`}
                    </div>
                  </div>

                  {/* Student Info Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4 font-serif text-[10px] sm:text-xs uppercase border-b border-zinc-300 pb-2">
                    <div className="flex flex-col"><span className="font-bold text-zinc-500 text-[8px] sm:text-[10px]">STUDENT NAME</span><span className="font-black text-black">{student.name}</span></div>
                    <div className="flex flex-col"><span className="font-bold text-zinc-500 text-[8px] sm:text-[10px]">ROLL NUMBER</span><span className="font-black text-black">{student.rollNumber || '-'}</span></div>
                    <div className="flex flex-col"><span className="font-bold text-zinc-500 text-[8px] sm:text-[10px]">CLASS / SEC</span><span className="font-black text-black">{className.replace('Class ', '')} {student.section ? `/ ${student.section}` : ''}</span></div>
                    <div className="flex flex-col"><span className="font-bold text-zinc-500 text-[8px] sm:text-[10px]">ACADEMIC YEAR</span><span className="font-black text-black">{new Date().getFullYear()}</span></div>
                  </div>

                  {/* Terms Grid */}
                  <div className={`flex-1 grid gap-4 ${isLandscape ? (testNamesArray.length >= 3 ? 'grid-cols-3' : 'grid-cols-2') : 'grid-cols-1'}`}>
                    {testNamesArray.map(termName => {
                      const termScores = student.scores.filter(s => s.testName === termName)
                      
                      let termObt = 0
                      let termMax = 0
                      let termAbsent = false
                      termScores.forEach(s => {
                        termMax += s.totalMarks
                        if (s.isAbsent) termAbsent = true
                        else termObt += s.marksObtained
                      })
                      const termPerc = termMax > 0 ? (termObt / termMax) * 100 : 0
                      const termGrade = termPerc >= 90 ? 'A+' : termPerc >= 80 ? 'A' : termPerc >= 70 ? 'B' : termPerc >= 60 ? 'C' : termPerc >= 50 ? 'D' : 'F'
                      
                      return (
                        <div key={termName} className="flex flex-col border-r border-zinc-200 pr-4 last:border-r-0 last:pr-0 h-full">
                          <h3 className="font-black font-serif text-center bg-[#E5F5ED] text-[#0A4B3A] py-1 mb-2 text-[10px] sm:text-xs uppercase tracking-widest border border-[#BDE4D0]">{termName}</h3>
                          
                          {/* Term Table */}
                          <div className="font-serif flex-1">
                            {termScores.length > 0 ? (
                              <table className="w-full border-collapse border border-[#BDE4D0] text-center text-[8px] sm:text-[10px]">
                                <thead>
                                  <tr className="bg-zinc-100 font-bold uppercase tracking-wider text-zinc-700">
                                    <th className="border border-[#BDE4D0] p-1 text-left w-1/3">SUBJ</th>
                                    <th className="border border-[#BDE4D0] p-1">MAX</th>
                                    <th className="border border-[#BDE4D0] p-1">PASS</th>
                                    <th className="border border-[#BDE4D0] p-1">OBT</th>
                                    <th className="border border-[#BDE4D0] p-1">GRD</th>
                                    <th className="border border-[#BDE4D0] p-1">REM</th>
                                  </tr>
                                </thead>
                                <tbody className="text-black font-semibold">
                                  {termScores.map(score => {
                                    const p = (score.marksObtained / score.totalMarks) * 100
                                    const grade = p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F'
                                    const remarks = p >= 50 ? 'Pass' : 'Fail'
                                    const passingMarks = Math.ceil(score.totalMarks * 0.4)
                                    
                                    return (
                                      <tr key={score.id}>
                                        <td className="border border-[#BDE4D0] p-1 text-left uppercase truncate max-w-[50px]" title={score.subject.name}>{score.subject.name}</td>
                                        <td className="border border-[#BDE4D0] p-1">{score.totalMarks}</td>
                                        <td className="border border-[#BDE4D0] p-1">{passingMarks}</td>
                                        <td className="border border-[#BDE4D0] p-1">{score.isAbsent ? 'ABS' : score.marksObtained}</td>
                                        <td className="border border-[#BDE4D0] p-1">{score.isAbsent ? '-' : grade}</td>
                                        <td className="border border-[#BDE4D0] p-1 italic text-zinc-600">{score.isAbsent ? 'Absent' : remarks}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="font-black text-black bg-[#E5F5ED]">
                                    <td className="border border-[#BDE4D0] p-1 text-right">TOTAL</td>
                                    <td className="border border-[#BDE4D0] p-1">{termMax}</td>
                                    <td className="border border-[#BDE4D0] p-1">-</td>
                                    <td className="border border-[#BDE4D0] p-1">{termObt}</td>
                                    <td className="border border-[#BDE4D0] p-1">{termGrade}</td>
                                    <td className="border border-[#BDE4D0] p-1">{termPerc.toFixed(1)}%</td>
                                  </tr>
                                </tfoot>
                              </table>
                            ) : (
                              <div className="text-center text-zinc-400 italic py-4 text-xs">No records found for this term.</div>
                            )}
                          </div>

                          {/* Remarks & Signatures at the bottom of EACH term */}
                          <div className="mt-4 pt-2 border-t border-dashed border-zinc-300">
                            <div className="space-y-3 font-serif text-[8px] sm:text-[9px] font-bold text-zinc-800">
                              <div className="flex items-end">
                                <span className="w-24">ATTENDANCE:</span>
                                <div className="flex-1 border-b border-dashed border-zinc-400 ml-2"></div>
                              </div>
                              <div className="flex items-end">
                                <span className="w-24">REMARKS:</span>
                                <div className="flex-1 border-b border-dashed border-zinc-400 ml-2"></div>
                              </div>
                            </div>

                            <div className="mt-8 grid grid-cols-3 gap-2 font-serif text-[7px] sm:text-[8px] font-bold text-center tracking-widest text-[#1a1a1a]">
                              <div><div className="border-t border-black pt-1 mx-1">TEACHER</div></div>
                              <div><div className="border-t border-black pt-1 mx-1">PARENT</div></div>
                              <div><div className="border-t border-black pt-1 mx-1">PRINCIPAL</div></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Overall Cumulative Status Box (Always shown at the bottom) */}
                  <div className="mt-4 border-t-2 border-[#0A4B3A] pt-3 flex flex-wrap justify-between items-center bg-[#E5F5ED] px-4 py-2 sm:py-3 rounded-md font-serif border border-[#BDE4D0]">
                     <div className="text-center flex-1 border-r border-[#BDE4D0] last:border-r-0">
                       <div className="font-bold text-[8px] sm:text-[10px] text-[#0A4B3A] uppercase tracking-wider mb-1">Overall Marks</div>
                       <div className="font-black text-sm sm:text-base">{cumulativeObtained} / {cumulativeMax}</div>
                     </div>
                     <div className="text-center flex-1 border-r border-[#BDE4D0] last:border-r-0">
                       <div className="font-bold text-[8px] sm:text-[10px] text-[#0A4B3A] uppercase tracking-wider mb-1">Percentage</div>
                       <div className="font-black text-sm sm:text-base">{percentage.toFixed(1)}%</div>
                     </div>
                     <div className="text-center flex-1 border-r border-[#BDE4D0] last:border-r-0">
                       <div className="font-bold text-[8px] sm:text-[10px] text-[#0A4B3A] uppercase tracking-wider mb-1">Class Position</div>
                       <div className="font-black text-sm sm:text-base text-red-600">{getPositionString(rank)}</div>
                     </div>
                     <div className="text-center flex-1">
                       <div className="font-bold text-[8px] sm:text-[10px] text-[#0A4B3A] uppercase tracking-wider mb-1">Status</div>
                       <div className={`font-black text-sm sm:text-base ${percentage >= 40 ? 'text-emerald-600' : 'text-red-600'}`}>
                         {percentage >= 40 ? 'PROMOTED' : 'FAILED'}
                       </div>
                     </div>
                  </div>

                </div>
              </div>

            </div>
          )
        })}
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          const btn = document.querySelector('button');
          if (btn) btn.onclick = () => window.print();
        `
      }} />
    </div>
  )
}
