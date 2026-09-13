$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot '../scripts/update-spa-stock.ps1'
$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }

# Load the real pure parsing functions without executing network requests.
foreach ($name in @('Normalize-Container', 'Get-ArrivalDateFromText', 'ConvertFrom-ContainerArrivalsHtml')) {
  $function = $ast.Find({ param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name
  }, $true)
  . ([scriptblock]::Create($function.Extent.Text))
}
function Assert-Equal($Actual, $Expected, $Message) {
  if ($Actual -ne $Expected) { throw "$Message -- expected '$Expected', got '$Actual'" }
}
$today = [datetime]'2026-09-13'
# These lines reproduce the date formats observed on the live dealer page.
$html = @'
<style>container 99: 1-1-2020</style>
<script>const example = "Container 98: 1-1-2020";</script>
<p>Container 76: 22-9-2026</p>
<p>Container 77: 22 -9-2026</p>
<p>Container 78: 22 -9-2026</p>
<p>Container 79 : 22 -9-2026</p>
<p>Container 80: 26 &ndash; 9-2026</p>
<p>Container 81: 26 – 9-2026</p>
<p>Container 82: 26 – 9-2026</p>
<p>Container 83 : 26 – 9-2026</p>
<p>Container 89: 6-10-2026</p>
'@
$arrivals = ConvertFrom-ContainerArrivalsHtml $html $today
Assert-Equal $arrivals.Count 9 'Every container should have its own arrival'
Assert-Equal $arrivals['79'].arrivalDate '2026-09-22' 'Container 79'
Assert-Equal $arrivals['80'].arrivalDate '2026-09-26' 'Container 80'
Assert-Equal $arrivals['82'].arrivalDate '2026-09-26' 'Container 82 must not borrow October 6'
Assert-Equal $arrivals['79'].readyDate '2026-10-20' 'Existing 28-day preparation period'
Assert-Equal $arrivals['80'].weeks 6 'Delivery weeks'
Assert-Equal $arrivals.ContainsKey('99') $false 'Ignore stylesheet'
Assert-Equal $arrivals.ContainsKey('98') $false 'Ignore script'
Assert-Equal $arrivals.ContainsKey('26') $false 'Date is not a container'

foreach ($date in @('26 - 9 - 2026', '26–9–2026', '26—9—2026', '26/9/26', '2026-09-26', '26 - 9-2026')) {
  Assert-Equal (Get-ArrivalDateFromText $date).ToString('yyyy-MM-dd') '2026-09-26' "Parse $date"
}
Assert-Equal (Get-ArrivalDateFromText '31-2-2026') $null 'Invalid date'

$arrivals = ConvertFrom-ContainerArrivalsHtml '<p>Container 79: nog onbekend</p><p>Container 80: 26-9-2026</p>' $today -WarningAction SilentlyContinue
Assert-Equal $arrivals.ContainsKey('79') $false 'Never borrow next container date'
Assert-Equal $arrivals['80'].arrivalDate '2026-09-26' 'Valid next container'
$arrivals = ConvertFrom-ContainerArrivalsHtml '<p>Container WS79-2026: 22-9-2026</p><p>Container S11: 26-9-2026</p>' $today
Assert-Equal $arrivals.ContainsKey('79') $true 'Normalize WS prefix'
Assert-Equal $arrivals.ContainsKey('S11') $true 'Preserve S prefix'

foreach ($badHtml in @('<form><input name="password_protected_pwd"></form>', '<p>Geen aankomstdata beschikbaar</p>')) {
  $failed = $false
  try { ConvertFrom-ContainerArrivalsHtml $badHtml $today | Out-Null } catch { $failed = $true }
  Assert-Equal $failed $true 'Reject unauthenticated or unrecognised output'
}
Write-Host 'Container arrival parser tests passed.'
