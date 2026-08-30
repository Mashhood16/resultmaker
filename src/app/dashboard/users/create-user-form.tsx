'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createUser } from './actions'

type ClassData = {
  id: string
  name: string
}

type SubjectData = {
  id: string
  name: string
}

export function CreateUserForm({
  role,
  availableClasses,
  availableSubjects
}: {
  role: string
  availableClasses: ClassData[]
  availableSubjects: SubjectData[]
}) {
  const [selectedRole, setSelectedRole] = useState(role === 'school' ? 'TEACHER' : 'STUDENT')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  
  return (
    <form action={createUser} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <input 
          name="name" 
          type="text" 
          required 
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. John Doe"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Username</label>
        <input 
          name="username" 
          type="text" 
          required 
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. jdoe123"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <input 
          name="password" 
          type="password" 
          required 
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Role</label>
        <select 
          name="role" 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {role === 'school' && <option value="TEACHER">Teacher</option>}
          <option value="STUDENT">Student (Class Account)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assign Classes</label>
        <div className="bg-muted/30 p-3 rounded-md border border-border max-h-48 overflow-y-auto space-y-2">
          {availableClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes available.</p>
          ) : (
            availableClasses.map(cls => (
              <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="classIds" 
                  value={cls.id} 
                  checked={selectedClasses.includes(cls.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClasses([...selectedClasses, cls.id])
                    } else {
                      setSelectedClasses(selectedClasses.filter(id => id !== cls.id))
                    }
                  }}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">{cls.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {selectedRole === 'TEACHER' && selectedClasses.length > 0 && (
        <div className="space-y-3 mt-4">
          <label className="text-sm font-medium">Assign Subjects (Granular Access)</label>
          {selectedClasses.map(classId => {
            const cls = availableClasses.find(c => c.id === classId)
            if (!cls) return null
            return (
              <div key={classId} className="bg-muted/30 p-3 rounded-md border border-border space-y-2">
                <div className="text-sm font-semibold">{cls.name} Subjects:</div>
                <div className="grid grid-cols-2 gap-2">
                  {availableSubjects.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name={`subjectAccess_${classId}`} 
                        value={sub.id}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-xs">{sub.name}</span>
                    </label>
                  ))}
                  {availableSubjects.length === 0 && (
                    <div className="text-xs text-muted-foreground">No subjects found.</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Button type="submit" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Create Account
      </Button>
    </form>
  )
}
