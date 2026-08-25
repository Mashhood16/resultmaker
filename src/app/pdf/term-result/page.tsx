import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TermResultPDFPage({
  searchParams,
}: {
  searchParams: { className?: string; testName?: string }
}) {
  const session = await auth()
  const schoolId = session?.user?.id
  const schoolName = session?.user?.name

  if (!schoolId) {
    redirect('/login')
  }

  const { className, testName } = searchParams

  if (!className || !testName) {
    return <div>Missing className or testName parameters</div>
  }

  // Fetch all students for this class and school, along with their scores for the specific testName
  const students = await prisma.student.findMany({
    where: {
      class: {
        name: className,
        schoolId: schoolId,
      }
    },
    include: {
      scores: {
        where: { testName },
        include: { subject: true }
      }
    }
  })

  // Sort students strictly by Roll Number
  const sortedStudents = students.sort((a, b) => {
    const rollA = parseInt(a.rollNumber || '0') || 0
    const rollB = parseInt(b.rollNumber || '0') || 0
    if (rollA !== rollB) return rollA - rollB
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="bg-zinc-200 min-h-screen text-black flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');
        
        @media print {
          @page { margin: 0; size: A4; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: white !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          
          /* Force page constraints to avoid blank pages */
          .result-card-container {
            width: 210mm;
            height: 296mm; /* slightly less than 297mm to prevent overflow */
            overflow: hidden;
            box-sizing: border-box;
            page-break-after: always;
            page-break-inside: avoid;
            background: white;
            margin: 0;
            padding: 10mm;
          }
        }

        .font-serif { font-family: 'Merriweather', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}} />
      
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 no-print flex justify-between items-center sticky top-0 z-10 shadow-sm w-full text-white">
        <p className="font-medium">Term Result: {testName} - {className}</p>
        <button 
          onClick="window.print()" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="print-container flex flex-col items-center w-full">
        {sortedStudents.map((student, index) => {
          let totalObtained = 0
          let maxTotal = 0
          let isAbsent = false

          student.scores.forEach(score => {
            totalObtained += score.marksObtained
            maxTotal += score.totalMarks
            if (score.isAbsent) isAbsent = true
          })

          const percentage = maxTotal > 0 ? ((totalObtained / maxTotal) * 100).toFixed(1) : '0.0'

          return (
            <div key={student.id} className="result-card-container relative bg-white mx-auto my-8 shadow-2xl p-[10mm] w-[210mm] h-[297mm] flex flex-col">
              
              {/* Double Border wrapper */}
              <div className="border-[3px] border-[#0A4B3A] p-1.5 h-full w-full">
                <div className="border border-[#0A4B3A] h-full w-full p-8 flex flex-col">
                  
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-black text-[#0A4B3A] uppercase tracking-wider mb-3">
                      {schoolName || 'SCHOOL NAME'}
                    </h1>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="h-px bg-black w-16"></div>
                      <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
                        SECONDARY SCHOOL CERTIFICATE
                      </h2>
                      <div className="h-px bg-black w-16"></div>
                    </div>
                    
                    <div className="inline-block bg-[#E5F5ED] text-[#0A4B3A] px-8 py-2 rounded-full font-bold text-sm tracking-widest uppercase border border-[#BDE4D0]">
                      {testName} RESULT CARD
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 font-serif text-sm uppercase">
                    <div className="flex justify-between items-end border-b border-zinc-300 pb-1">
                      <span className="font-bold text-zinc-700">STUDENT NAME</span>
                      <span className="font-black text-black">{student.name}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-zinc-300 pb-1">
                      <span className="font-bold text-zinc-700">ROLL NUMBER</span>
                      <span className="font-black text-black">{student.rollNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-zinc-300 pb-1">
                      <span className="font-bold text-zinc-700">CLASS</span>
                      <span className="font-black text-black">{className.replace('Class ', '')}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-zinc-300 pb-1">
                      <span className="font-bold text-zinc-700">SECTION</span>
                      <span className="font-black text-black">{student.section || '-'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-zinc-300 pb-1">
                      <span className="font-bold text-zinc-700">ACADEMIC YEAR</span>
                      <span className="font-black text-black">{new Date().getFullYear()}</span>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <div className="mb-auto font-serif">
                    <table className="w-full border-collapse border border-[#BDE4D0] text-center text-sm">
                      <thead>
                        <tr className="bg-[#E5F5ED] text-[#0A4B3A] font-bold text-xs uppercase tracking-wider">
                          <th className="border border-[#BDE4D0] p-3 text-left w-1/3">SUBJECTS</th>
                          <th className="border border-[#BDE4D0] p-3">MAX<br/>MARKS</th>
                          <th className="border border-[#BDE4D0] p-3">PASSING<br/>MARKS</th>
                          <th className="border border-[#BDE4D0] p-3">MARKS<br/>OBTAINED</th>
                          <th className="border border-[#BDE4D0] p-3">GRADE</th>
                          <th className="border border-[#BDE4D0] p-3">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody className="text-black font-semibold">
                        {student.scores.map(score => {
                          const p = (score.marksObtained / score.totalMarks) * 100
                          const grade = p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F'
                          const remarks = p >= 50 ? 'Pass' : 'Fail'
                          const passingMarks = Math.ceil(score.totalMarks * 0.4) // Assuming 40% passing
                          
                          return (
                            <tr key={score.id}>
                              <td className="border border-[#BDE4D0] p-3 text-left uppercase tracking-wide">{score.subject.name}</td>
                              <td className="border border-[#BDE4D0] p-3">{score.totalMarks}</td>
                              <td className="border border-[#BDE4D0] p-3">{passingMarks}</td>
                              <td className="border border-[#BDE4D0] p-3">{score.isAbsent ? 'ABS' : score.marksObtained}</td>
                              <td className="border border-[#BDE4D0] p-3">{score.isAbsent ? '-' : grade}</td>
                              <td className="border border-[#BDE4D0] p-3 text-xs italic text-zinc-600 font-serif">{score.isAbsent ? 'Absent' : remarks}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="font-black text-black">
                          <td className="border border-[#BDE4D0] p-3 text-right uppercase tracking-wider">GRAND TOTAL</td>
                          <td className="border border-[#BDE4D0] p-3">{maxTotal}</td>
                          <td className="border border-[#BDE4D0] p-3">-</td>
                          <td className="border border-[#BDE4D0] p-3">{totalObtained}</td>
                          <td className="border border-[#BDE4D0] p-3">
                            {parseFloat(percentage) >= 90 ? 'A+' : parseFloat(percentage) >= 80 ? 'A' : parseFloat(percentage) >= 70 ? 'B' : parseFloat(percentage) >= 60 ? 'C' : parseFloat(percentage) >= 50 ? 'D' : 'F'}
                          </td>
                          <td className="border border-[#BDE4D0] p-3">{percentage}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Remarks and Attendance */}
                  <div className="space-y-6 mt-8 font-serif text-sm font-bold text-zinc-800">
                    <div className="flex items-end">
                      <span className="w-48">ATTENDANCE<br/>PERCENTAGE:</span>
                      <div className="flex-1 border-b border-dashed border-zinc-400 ml-4"></div>
                    </div>
                    <div className="flex items-end">
                      <span className="w-48">GENERAL DISCIPLINE:</span>
                      <div className="flex-1 border-b border-dashed border-zinc-400 ml-4"></div>
                    </div>
                    <div className="flex items-end">
                      <span className="w-48">CLASS TEACHER<br/>REMARKS:</span>
                      <div className="flex-1 border-b border-dashed border-zinc-400 ml-4"></div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-16 grid grid-cols-3 gap-8 font-serif text-xs font-bold text-center tracking-widest text-[#1a1a1a]">
                    <div>
                      <div className="border-t border-black pt-2 mx-4">CLASS TEACHER</div>
                    </div>
                    <div>
                      <div className="border-t border-black pt-2 mx-4">PARENTS / GUARDIAN</div>
                    </div>
                    <div>
                      <div className="border-t border-black pt-2 mx-4">PRINCIPAL</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )
        })}
      </div>
      
      {/* Script for Print Button */}
      <script dangerouslySetInnerHTML={{
        __html: `
          const btn = document.querySelector('button');
          if (btn) btn.onclick = () => window.print();
        `
      }} />
    </div>
  )
}
