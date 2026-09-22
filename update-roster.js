const fs = require('fs');

function updateRosterView() {
  let text = fs.readFileSync('src/app/dashboard/student-roster-view.tsx', 'utf8');
  
  // 1. Update editForm state
  text = text.replace(
    "name: '', registrationNumber: '', rollNumber: '', section: '', fatherName: '', fatherPhone: '', fatherCnic: ''",
    "name: '', urduName: '', registrationNumber: '', rollNumber: '', section: '', fatherName: '', fatherPhone: '', fatherCnic: ''"
  );
  
  // 2. TableHead
  text = text.replace(
    "<TableHead className=\"text-muted-foreground font-bold\">Name</TableHead>",
    "<TableHead className=\"text-muted-foreground font-bold\">Name</TableHead>\n                  <TableHead className=\"text-muted-foreground font-bold\">Urdu Name</TableHead>"
  );

  // 3. TableCell
  text = text.replace(
    "<TableCell className=\"font-semibold text-foreground\">{student.name}</TableCell>",
    "<TableCell className=\"font-semibold text-foreground\">{student.name}</TableCell>\n                      <TableCell className=\"font-semibold text-foreground\" dir=\"rtl\">{student.urduName || '-'}</TableCell>"
  );
  
  // 4. openEditModal
  text = text.replace(
    "name: student.name,",
    "name: student.name,\n      urduName: student.urduName || '',"
  );

  // 5. Edit Modal Inputs
  const editInputs = `              <div className="space-y-2">
                <Label className="text-muted-foreground">Student Name</Label>
                <Input className="bg-background border-border text-foreground" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Urdu Name</Label>
                <Input className="bg-background border-border text-foreground" value={editForm.urduName} onChange={e => setEditForm({...editForm, urduName: e.target.value})} dir="rtl" />
              </div>`;
              
  text = text.replace(
    `              <div className="space-y-2">
                <Label className="text-muted-foreground">Student Name</Label>
                <Input className="bg-background border-border text-foreground" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>`,
    editInputs
  );

  fs.writeFileSync('src/app/dashboard/student-roster-view.tsx', text, 'utf8');
}

function updateStudentActions() {
  let text = fs.readFileSync('src/app/dashboard/student-actions.ts', 'utf8');
  // Update zod schema
  if (!text.includes('urduName: z.string().optional()')) {
    text = text.replace(
      "name: z.string().min(1, 'Name is required'),",
      "name: z.string().min(1, 'Name is required'),\n  urduName: z.string().optional(),"
    );
  }
  fs.writeFileSync('src/app/dashboard/student-actions.ts', text, 'utf8');
}

updateRosterView();
updateStudentActions();
console.log("Done");
