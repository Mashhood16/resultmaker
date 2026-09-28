$schema = Get-Content -Raw -Path prisma/schema.prisma
$schema = $schema -replace 'onlineTests  OnlineTest\[\]\r?\n  createdAt    DateTime', "onlineTests  OnlineTest[]`n  materials    ClassMaterial[]`n  createdAt    DateTime"
Set-Content -Path prisma/schema.prisma -Value $schema
