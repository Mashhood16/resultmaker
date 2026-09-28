$schema = Get-Content -Raw -Path prisma/schema.prisma
$schema = $schema -replace 'teacherId   String\r?\n', "teacherId   String?`n  schoolId    String?`n"
$schema = $schema -replace 'teacher     User     @relation\(fields: \[teacherId\], references: \[id\], onDelete: Cascade\)\r?\n', "teacher     User?    @relation(fields: [teacherId], references: [id], onDelete: Cascade)`n  school      School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)`n"
Set-Content -Path prisma/schema.prisma -Value $schema
