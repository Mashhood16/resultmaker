import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function requireSchoolOrTeacherAccess(className?: string, classId?: string, subjectName?: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  if (!schoolId) {
    throw new Error('Unauthorized: School ID not found')
  }

  // Students cannot access dashboard modifications
  if (role === 'student') {
    throw new Error('Unauthorized: Students cannot modify records')
  }

  if (role === 'teacher') {
    const assignedClassIds = session.user.classIds || []
    
    let targetClassId = classId
    if (className) {
      // Find class to check access
      const cls = await prisma.class.findUnique({
        where: { name_schoolId: { name: className, schoolId } }
      })
      // If class doesn't exist, teacher cannot create it via upload implicitly
      if (!cls || !assignedClassIds.includes(cls.id)) {
        throw new Error(`Unauthorized: You are not assigned to class ${className}`)
      }
      targetClassId = cls.id
    }

    if (classId) {
      if (!assignedClassIds.includes(classId)) {
        throw new Error('Unauthorized: You are not assigned to this class')
      }
    }

    if (subjectName && targetClassId) {
      const subject = await prisma.subject.findUnique({
        where: { name_schoolId: { name: subjectName, schoolId } }
      })
      if (!subject) {
        // If subject doesn't exist, teacher cannot create it implicitly
        throw new Error(`Unauthorized: You cannot create new subjects (Subject ${subjectName} not found)`)
      }
      const allowedSubjects = session.user.subjectAccess?.[targetClassId] || []
      if (!allowedSubjects.includes(subject.id)) {
        throw new Error(`Unauthorized: You are not assigned to manage subject ${subjectName} in this class`)
      }
    }
  }

  return { 
    schoolId, 
    session,
    isTeacher: role === 'teacher',
    classIds: role === 'teacher' ? session.user.classIds || [] : []
  }
}
