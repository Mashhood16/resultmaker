import React from 'react'
import { ComprehensiveStudentScore } from '@/app/actions/result-card-actions'
import { SubjectConfig } from './result-card-modal'

interface FederalResultCardProps {
  students: ComprehensiveStudentScore[]
  schoolName?: string
}

function getGrade(percentage: number, passPercent: number) {
  if (percentage < passPercent) return { grade: 'F', remarks: 'Fail' }
  if (percentage >= 80) return { grade: 'A+', remarks: 'Excellent' }
  if (percentage >= 70) return { grade: 'A', remarks: 'Very Good' }
  if (percentage >= 60) return { grade: 'B', remarks: 'Good' }
  if (percentage >= 50) return { grade: 'C', remarks: 'Satisfactory' }
  return { grade: 'D', remarks: 'Pass' }
}

export function FederalResultCard({ students, schoolName = "Government High School" }: FederalResultCardProps) {
  return (
    <div id="federal-result-cards-container" className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none">
      {students.map((student, index) => {
        
        let grandTotalPossible = 0
        let grandTotalObtained = 0
        let hasFailed = false

        const subjectRows = student.subjects.map(subj => {
          const passPercent = 40
          const isAbsent = subj.isAbsent || subj.rawTotal === 0
          
          let scaledObtained = 0
          if (!isAbsent) {
            scaledObtained = subj.rawObtained
          }
          
          const percentage = subj.rawTotal > 0 ? (scaledObtained / subj.rawTotal) * 100 : 0
          const { grade, remarks } = isAbsent ? { grade: 'F', remarks: 'Absent' } : getGrade(percentage, passPercent)
          
          if (grade === 'F') hasFailed = true

          grandTotalPossible += subj.rawTotal
          grandTotalObtained += scaledObtained

          return {
            ...subj,
            config: { total: subj.rawTotal, passPercent },
            scaledObtained,
            percentage,
            grade,
            remarks,
            isAbsent
          }
        })

        const overallPercentage = grandTotalPossible > 0 ? (grandTotalObtained / grandTotalPossible) * 100 : 0
        const overallGrade = hasFailed ? 'F' : getGrade(overallPercentage, 40).grade

        return (
          <div 
            key={student.studentId} 
            id={`federal-result-card-${student.studentId}`}
            className="student-result-card bg-white text-black p-12 mx-auto relative flex flex-col font-serif overflow-hidden"
            style={{ width: '900px', height: '1272px' }} // Strict A4 proportions for 1 page
          >
            {/* Border Graphics */}
            <div className="absolute inset-4 border-[12px] border-double border-emerald-800/80 pointer-events-none"></div>
            <div className="absolute inset-6 border-[2px] border-solid border-emerald-800/50 pointer-events-none"></div>

            {/* Header */}
            <div className="text-center mt-8 mb-10">
              <h1 className="text-4xl font-black text-emerald-900 uppercase tracking-widest mb-2 font-serif">{schoolName}</h1>
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="h-[2px] w-16 bg-emerald-800"></div>
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Secondary School Certificate</h2>
                <div className="h-[2px] w-16 bg-emerald-800"></div>
              </div>
              <h3 className="text-lg font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 inline-block px-6 py-1 rounded-full border border-emerald-300">
                Final Result Card
              </h3>
            </div>

            {/* Student Info */}
            <div className="flex flex-col gap-y-6 mb-12 px-8 text-lg">
              {/* Row 1: Student Name, Roll Number */}
              <div className="grid grid-cols-2 gap-x-12">
                <div className="flex border-b border-gray-300 pb-1">
                  <span className="font-bold text-gray-600 w-32 uppercase text-sm self-end whitespace-nowrap mr-2">Student Name</span>
                  <span className="font-bold text-gray-900 uppercase flex-1">{student.name}</span>
                </div>
                <div className="flex border-b border-gray-300 pb-1">
                  <span className="font-bold text-gray-600 w-32 uppercase text-sm self-end whitespace-nowrap mr-2">Roll Number</span>
                  <span className="font-bold text-gray-900 uppercase flex-1">{student.rollNumber || 'N/A'}</span>
                </div>
              </div>
              
              {/* Row 2: Class, Section, Academic Year */}
              <div className="grid grid-cols-3 gap-x-8">
                <div className="flex border-b border-gray-300 pb-1">
                  <span className="font-bold text-gray-600 w-16 uppercase text-sm self-end whitespace-nowrap mr-2">Class</span>
                  <span className="font-bold text-gray-900 uppercase flex-1">{student.className}</span>
                </div>
                <div className="flex border-b border-gray-300 pb-1">
                  <span className="font-bold text-gray-600 w-20 uppercase text-sm self-end whitespace-nowrap mr-2">Section</span>
                  <span className="font-bold text-gray-900 uppercase flex-1">{student.section || 'N/A'}</span>
                </div>
                <div className="flex border-b border-gray-300 pb-1">
                  <span className="font-bold text-gray-600 w-32 uppercase text-sm self-end whitespace-nowrap mr-2">Academic Year</span>
                  <span className="font-bold text-gray-900 uppercase flex-1">{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="px-4 mb-10 flex-1">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="border border-gray-400 py-3 px-4 text-left font-bold text-emerald-900 uppercase text-sm">Subjects</th>
                    <th className="border border-gray-400 py-3 px-2 text-center font-bold text-emerald-900 uppercase text-sm w-24">Max Marks</th>
                    <th className="border border-gray-400 py-3 px-2 text-center font-bold text-emerald-900 uppercase text-sm w-24">Passing Marks</th>
                    <th className="border border-gray-400 py-3 px-2 text-center font-bold text-emerald-900 uppercase text-sm w-28">Marks Obtained</th>
                    <th className="border border-gray-400 py-3 px-2 text-center font-bold text-emerald-900 uppercase text-sm w-20">Grade</th>
                    <th className="border border-gray-400 py-3 px-2 text-center font-bold text-emerald-900 uppercase text-sm w-32">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map(row => (
                    <tr key={row.subjectId}>
                      <td className="border border-gray-400 py-3 px-4 font-bold text-gray-800 uppercase text-sm">{row.subjectName}</td>
                      <td className="border border-gray-400 py-3 px-2 text-center font-medium text-gray-700">{row.config.total}</td>
                      <td className="border border-gray-400 py-3 px-2 text-center font-medium text-gray-700">
                        {Math.ceil((row.config.passPercent / 100) * row.config.total)}
                      </td>
                      <td className="border border-gray-400 py-3 px-2 text-center font-bold text-gray-900">
                        {row.isAbsent ? 'ABS' : row.scaledObtained}
                      </td>
                      <td className="border border-gray-400 py-3 px-2 text-center font-bold text-gray-900">{row.grade}</td>
                      <td className="border border-gray-400 py-3 px-2 text-center font-medium text-gray-600 text-sm italic">{row.remarks}</td>
                    </tr>
                  ))}
                  {/* Grand Total Row */}
                  <tr className="bg-emerald-50/50">
                    <td className="border border-gray-400 py-4 px-4 font-black text-emerald-900 uppercase text-right" colSpan={1}>Grand Total</td>
                    <td className="border border-gray-400 py-4 px-2 text-center font-black text-emerald-900">{grandTotalPossible}</td>
                    <td className="border border-gray-400 py-4 px-2 text-center font-bold text-gray-500">-</td>
                    <td className="border border-gray-400 py-4 px-2 text-center font-black text-emerald-900 text-xl">{grandTotalObtained}</td>
                    <td className="border border-gray-400 py-4 px-2 text-center font-black text-emerald-900 text-xl">{overallGrade}</td>
                    <td className="border border-gray-400 py-4 px-2 text-center font-bold text-emerald-900">
                      {overallPercentage.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Handwritten Fields Section */}
            <div className="px-8 mb-16 space-y-8">
              <div className="flex gap-4 items-end">
                <span className="font-bold text-gray-700 uppercase text-sm w-48">Attendance Percentage:</span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 h-6"></div>
              </div>
              <div className="flex gap-4 items-end">
                <span className="font-bold text-gray-700 uppercase text-sm w-48">General Discipline:</span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 h-6"></div>
              </div>
              <div className="flex gap-4 items-end">
                <span className="font-bold text-gray-700 uppercase text-sm w-48">Class Teacher Remarks:</span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 h-6"></div>
              </div>
            </div>

            {/* Signatures */}
            <div className="px-8 flex justify-between mt-auto mb-8">
              <div className="text-center w-48">
                <div className="border-b border-gray-800 h-16 mb-2"></div>
                <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Class Teacher</span>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-gray-800 h-16 mb-2"></div>
                <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Parents / Guardian</span>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-gray-800 h-16 mb-2"></div>
                <span className="font-bold text-gray-600 uppercase text-xs tracking-widest">Principal</span>
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}
