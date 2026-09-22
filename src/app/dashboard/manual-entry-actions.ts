'use server'

import prisma from '@/lib/prisma'
import { translateToUrdu } from '@/lib/translate'
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
          isAbsent: studentData.isAbsent,
          testDate: new Date(data.testDate)
        },
        create: {
          studentId: studentData.id,
          subjectId: subjectRecord.id,
          testName: data.testName,
          testDate: new Date(data.testDate),
          marksObtained: studentData.isAbsent ? 0 : studentData.marksObtained,
          totalMarks: data.totalMarks,
          percentage: Number(percentage.toFixed(2)),
          isAbsent: studentData.isAbsent
        }
      })

      // Generate WhatsApp messages
      const student = await prisma.student.findUnique({ where: { id: studentData.id } })
      if (student && student.fatherPhone) {
        let studentUrduName = student.urduName;
        if (!studentUrduName) {
           studentUrduName = await translateToUrdu(student.name);
           await prisma.student.update({ where: { id: student.id }, data: { urduName: studentUrduName } })
        }
        let subjectUrduName = subjectRecord.urduName;
        if (!subjectUrduName) {
           subjectUrduName = await translateToUrdu(subjectRecord.name);
           await prisma.subject.update({ where: { id: subjectRecord.id }, data: { urduName: subjectUrduName } })
        }

        const formattedDate = new Date(data.testDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
        const d = new Date(data.testDate);
        const urduDate = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
        
        let urduMessage = '';
        if (studentData.isAbsent) {
          urduMessage = `Assalam o Alaikum. Aap ka bacha ${student.name} (Class ${classRecord.name}) ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein ghair hazir (absent) tha. Barae meharbani is baat ka khayal rakhein ke bacha regular test de.\n\nالسلام علیکم! آپ کا بچہ ${studentUrduName} تاریخ ${urduDate} کو ہونے والے ${subjectUrduName} کے امتحان میں غیر حاضر تھا۔ براہ مہربانی اس بات کا خیال رکھیں کہ بچہ باقاعدگی سے امتحان دے۔`;
        } else {
          const isGoodMarks = percentage >= 50;
          if (isGoodMarks) {
            urduMessage = `Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ne ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein bohot achi karkardagi dikhai hai. Us ne ${data.totalMarks} mein se ${studentData.marksObtained} marks haasil kiye hain. Shabash!\n\nالسلام علیکم! آپ کے بچے ${studentUrduName} نے تاریخ ${urduDate} کو ہونے والے ${subjectUrduName} کے امتحان میں بہت اچھی کارکردگی دکھائی ہے۔ اس نے ${data.totalMarks} میں سے ${studentData.marksObtained} نمبر حاصل کیے ہیں۔ شاباش!`;
          } else {
            urduMessage = `Assalam o Alaikum. Aap ke bache ${student.name} (Class ${classRecord.name}) ne ${formattedDate} ko hone wale ${subjectRecord.name} ke test mein ${data.totalMarks} mein se sirf ${studentData.marksObtained} marks haasil kiye hain. Barae meharbani bache ki parhai par tawajah dein.\n\nالسلام علیکم! آپ کے بچے ${studentUrduName} نے تاریخ ${urduDate} کو ہونے والے ${subjectUrduName} کے امتحان میں ${data.totalMarks} میں سے صرف ${studentData.marksObtained} نمبر حاصل کیے ہیں۔ براہ مہربانی بچے کی پڑھائی پر توجہ دیں۔`;
          }
        }
        
        urduMessage += '\n\nMuhammad Mashhood Tariq';
        
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
