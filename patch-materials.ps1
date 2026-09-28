$schema = Get-Content -Raw -Path prisma/schema.prisma
$schema = $schema -replace 'fileType    String\?\r?\n  classId', "fileType    String?`n  resourceType String @default(`"UPLOAD`")`n  chapter     String?`n  topic       String?`n  classId"
Set-Content -Path prisma/schema.prisma -Value $schema
