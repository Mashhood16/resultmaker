'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getStudentsByClassId(classId: string) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  try {
    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: { rollNumber: 'asc' }
    })
    return { success: true, students }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uploadManualMarksAction(data: {
  classId: string
  subjectName: string
  testName: string
  testDate: string
  totalMarks: number
  students: { id: string, marksObtained: number, isAbsent: boolean }[]
}) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  try {
    const schoolId = session.user.role === 'school' ? session.user.id : session.user.schoolId

    // Upsert Subject
    const subjectRecord = await prisma.subject.upsert({
      where: { name_schoolId: { name: data.subjectName, schoolId } },
      update: {},
      create: { name: data.subjectName, schoolId }
    })

    const classRecord = await prisma.class.findUnique({ where: { id: data.classId } })
    if (!classRecord) throw new Error('Class not found')

    for (const studentData of data.students) {
      const percentage = studentData.isAbsent ? 0 : (studentData.marksObtained / data.totalMarks) * 100
      
      await prisma.score.upsert({
        where: {
          studentId_subjectId_testName: {
            studentId: studentData.id,
            subjectId: subjectRecord.id,
            testName: data.testName
          }
        },
        update: {
          marksObtained: studentData.isAbsent ? 0 : studentData.marksObtained,
          totalMarks: data.totalMarks,
          percentage: Number(percentage.toFixed(2)),
          isAbsent: studentData.isAbsent
        },
        create: {
          studentId: studentData.id,
          subjectId: subjectRecord.id,
          testName: data.testName,
          marksObtained: studentData.isAbsent ? 0 : studentData.marksObtained,
          totalMarks: data.totalMarks,
          percentage: Number(percentage.toFixed(2)),
          isAbsent: studentData.isAbsent
        }
      })

      // Generate WhatsApp messages
      const student = await prisma.student.findUnique({ where: { id: studentData.id } })
      if (student && student.fatherPhone) {
        const formattedDate = new Date(data.testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
        
        let urduMessage = '';
        if (studentData.isAbsent) {
          urduMessage = `Assalam o Alaikum. Aap ka bacha ${student.name} (Class ${classRecord.name}) ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.`;
        } else {
          const isGoodMarks = percentage >= 50;
          if (isGoodMarks) {
            urduMessage = `Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ne ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein bohot achi karkardagi dikhai hai. Us ne ${data.totalMarks} mein se ${studentData.marksObtained} marks haasil kiye hain. Shabash!`;
          } else {
            urduMessage = `Assalam o Alaikum. Aap ke bache ${student.name} (Class ${classRecord.name}) ne ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein ${data.totalMarks} mein se sirf ${studentData.marksObtained} marks haasil kiye hain. Barae meharbani bache ki parhai par tawajah dein.`;
          }
        }
        
        await prisma.whatsAppQueue.create({
          data: {
            studentId: student.id,
            phone: student.fatherPhone,
            message: urduMessage,
            status: 'PENDING'
          }
        })
      }
    }

    revalidatePath('/dashboard/uploads')
    return { success: true, message: `Successfully uploaded manual results for ${data.students.length} students.` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
