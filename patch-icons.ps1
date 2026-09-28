$clientPath = 'src/app/dashboard/materials/materials-client.tsx'
$client = Get-Content -LiteralPath $clientPath -Raw
$client = $client -replace '\bYoutube\b', 'Video'
Set-Content -LiteralPath $clientPath -Value $client

$pagePath = 'src/app/public/leaderboard/[classId]/materials/page.tsx'
$page = Get-Content -LiteralPath $pagePath -Raw
$page = $page -replace '\bYoutube\b', 'Video'
Set-Content -LiteralPath $pagePath -Value $page
