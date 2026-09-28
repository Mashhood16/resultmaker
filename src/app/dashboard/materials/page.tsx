import { getTeacherClassesAndSubjects, getTeacherMaterials } from './actions'
import { MaterialsClient } from './materials-client'

export const metadata = {
  title: 'Materials | Cendro Class',
}

export default async function MaterialsPage() {
  const { classes, subjects, subjectAccess } = await getTeacherClassesAndSubjects()
  const existingMaterials = await getTeacherMaterials()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Study Materials</h2>
      </div>
      
      <MaterialsClient 
        classes={classes} 
        subjects={subjects} 
        subjectAccess={subjectAccess}
        existingMaterials={existingMaterials}
      />
    </div>
  )
}
