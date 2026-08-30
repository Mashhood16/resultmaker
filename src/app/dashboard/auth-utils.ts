import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function requireSchoolOrTeacherAccess(className?: string, classId?: string) {
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
    
    if (className) {
      // Find class to check access
      const cls = await prisma.class.findUnique({
        where: { name_schoolId: { name: className, schoolId } }
      })
      // If class doesn't exist, teacher cannot create it via upload implicitly
      if (!cls || !assignedClassIds.includes(cls.id)) {
        throw new Error(`Unauthorized: You are not assigned to class ${className}`)
      }
    }

    if (classId) {
      if (!assignedClassIds.includes(classId)) {
        throw new Error('Unauthorized: You are not assigned to this class')
      }
    }
  }

  return { schoolId, session }
}
