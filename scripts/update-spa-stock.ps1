param(
  [string]$CurrentStockUrl = 'https://avlemmix-my.sharepoint.com/:x:/p/angelo/IQBho8ccoP7iTLW5lf8ESyxXAaPNn2tHRpmmSEhee_sVJeE?e=caKQnF&download=1',
  [string]$IncomingStockUrl = 'https://avlemmix-my.sharepoint.com/:x:/p/angelo/EVXDPHIAsa1IjPgA3aHlVAQBPaLBDEWYcoaZkm82kF57Bg?e=H2xx8C&download=1',
  [string]$SaunaStockUrl = 'https://avlemmix-my.sharepoint.com/:x:/p/angelo/Ee8O1yUpFeNHvQQ-FlI45PcBFuDZZxfo6hFU8lEIZ8bS6A?e=MC090c&download=1',
  [string]$ArrivalsUrl = 'https://www.sunspa-dealer.nl/stock/conatiner-arrivals/',
  [string]$ArrivalsPassword = $env:SUNSPA_DEALER_PASSWORD
)

$ErrorActionPreference = 'Stop'
$tempFiles = New-Object System.Collections.Generic.List[string]

if ([string]::IsNullOrWhiteSpace($ArrivalsPassword)) {
  throw 'SUNSPA_DEALER_PASSWORD ontbreekt. Zet dit wachtwoord als GitHub Actions secret.'
}

function Normalize-Text {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return '' }
  $normalized = $Value.ToLowerInvariant().Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder
  foreach ($ch in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($ch)
    }
  }
  return (($builder.ToString() -replace '[^a-z0-9]+', ' ') -replace '\s+', ' ').Trim()
}

function Get-CabinetColor {
  param([string]$Value)
  $clean = Normalize-Text $Value
  $clean = (($clean -replace '\balp\b', '') -replace '\bwide\b', '') -replace '\bsh\b|\bts\b', ''
  $clean = ($clean -replace '\s+', ' ').Trim()

  if ($clean -match 'palm' -and $clean -match 'black') { return @{ key = 'palm black'; color = 'Palm black' } }
  if ($clean -match 'ancient' -and ($clean -match 'grey' -or $clean -match 'gray')) { return @{ key = 'ancient grey'; color = 'Ancient grey' } }
  if ($clean -match 'graphite') { return @{ key = 'graphite'; color = 'Graphite' } }
  if ($clean -match 'chocolate') { return @{ key = 'chocolate'; color = 'Chocolate' } }
  if ($clean -match 'taupe') { return @{ key = 'taupe'; color = 'Taupe' } }
  if ($clean -match 'black') { return @{ key = 'black'; color = 'Black' } }
  if ($clean -match 'grey' -or $clean -match 'gray') { return @{ key = 'grey'; color = 'Grey' } }
  return @{ key = $clean; color = $Value }
}

function Get-StockModelName {
  param($Values, [string[]]$Columns)

  foreach ($column in $Columns) {
    $value = [string]$Values[$column]
    if (-not [string]::IsNullOrWhiteSpace($value) -and $value.Trim() -notin @('-', '0')) {
      return $value.Trim()
    }
  }

  return ''
}

function Normalize-Container {
  param([string]$Value)
  $clean = ([string]$Value).Trim().ToUpperInvariant()
  if ([string]::IsNullOrWhiteSpace($clean)) { return '' }

  $match = [regex]::Match($clean, '\bWS(?<number>\d{1,3})(?:-\d{4})?\b')
  if ($match.Success) { return $match.Groups['number'].Value }

  $match = [regex]::Match($clean, '\bS(?<number>\d{1,3})(?:-\d{4})?\b')
  if ($match.Success) { return 'S' + $match.Groups['number'].Value }

  $match = [regex]::Match($clean, '\b(?<number>\d{1,3})(?:-\d{4})\b')
  if ($match.Success) { return $match.Groups['number'].Value }

  $match = [regex]::Match($clean, '\b(?<number>\d{1,3})\b')
  if ($match.Success) { return $match.Groups['number'].Value }

  return $clean
}

function Get-DownloadUrl {
  param([string]$Url)
  if ($Url -match 'download=1') { return $Url }
  $separator = if ($Url.Contains('?')) { '&' } else { '?' }
  return "$Url${separator}download=1"
}

function Get-CellColumn {
  param([string]$CellRef)
  return ([regex]::Match($CellRef, '^[A-Z]+')).Value
}

function Get-ZipText {
  param($Zip, [string]$Name)
  $entry = $Zip.Entries | Where-Object { $_.FullName -eq $Name } | Select-Object -First 1
  if (-not $entry) { return $null }
  $reader = [IO.StreamReader]::new($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-CellValue {
  param($Cell, $SharedStrings)
  $valueNode = $Cell.GetElementsByTagName('v') | Select-Object -First 1
  if ($valueNode) {
    $rawValue = $valueNode.InnerText
    if ($Cell.GetAttribute('t') -eq 's') { return $SharedStrings[[int]$rawValue] }
    return $rawValue
  }

  if ($Cell.GetAttribute('t') -eq 'inlineStr') {
    return $Cell.InnerText
  }

  return $null
}

function Get-SheetSharedStrings {
  param($Zip)
  [xml]$sharedXml = Get-ZipText $Zip 'xl/sharedStrings.xml'
  $sharedStrings = @()
  if ($sharedXml) {
    foreach ($si in $sharedXml.GetElementsByTagName('si')) {
      $sharedStrings += $si.InnerText
    }
  }
  return $sharedStrings
}

function Get-ExcelDateText {
  param($Value)
  if ($null -eq $Value -or "$Value" -notmatch '^\d+$') { return $null }
  return ([datetime]'1899-12-30').AddDays([int]$Value).ToString('yyyy-MM-dd')
}

function Read-XlsxRows {
  param(
    [string]$Url,
    [string]$Mode,
    [string[]]$ModelColumns,
    [string]$InnerColumn,
    [string]$CabinetColumn,
    [string]$QuantityColumn,
    [string]$ContainerColumn = ''
  )

  $tempFile = Join-Path $env:TEMP ("sunspa-live-stock-{0}.xlsx" -f ([guid]::NewGuid().ToString('N')))
  $tempFiles.Add($tempFile) | Out-Null
  Invoke-WebRequest -Uri (Get-DownloadUrl $Url) -OutFile $tempFile -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 60 | Out-Null

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::OpenRead($tempFile)

  try {
    [xml]$sharedXml = Get-ZipText $zip 'xl/sharedStrings.xml'
    [xml]$stylesXml = Get-ZipText $zip 'xl/styles.xml'
    [xml]$sheetXml = Get-ZipText $zip 'xl/worksheets/sheet1.xml'

    $sharedStrings = @()
    if ($sharedXml) {
      foreach ($si in $sharedXml.GetElementsByTagName('si')) {
        $sharedStrings += $si.InnerText
      }
    }

    $styleFillIds = @()
    foreach ($xf in $stylesXml.styleSheet.cellXfs.xf) {
      $styleFillIds += [int]$xf.fillId
    }

    $soldRows = 0
    $stockRows = 0
    $rows = @()

    foreach ($row in $sheetXml.GetElementsByTagName('row')) {
      $rowNumber = [int]$row.GetAttribute('r')
      if ($rowNumber -eq 1) { continue }

      $values = @{}
      $hasFill = $false

      foreach ($cell in $row.GetElementsByTagName('c')) {
        $column = Get-CellColumn $cell.GetAttribute('r')
        $values[$column] = Get-CellValue $cell $sharedStrings

        $styleIndex = if ($cell.HasAttribute('s')) { [int]$cell.GetAttribute('s') } else { 0 }
        $fillId = if ($styleIndex -lt $styleFillIds.Count) { $styleFillIds[$styleIndex] } else { 0 }
        if ($fillId -gt 1) { $hasFill = $true }
      }

      $modelName = Get-StockModelName $values $ModelColumns
      $cabinetRaw = [string]$values[$CabinetColumn]
      if ([string]::IsNullOrWhiteSpace($modelName) -or [string]::IsNullOrWhiteSpace($cabinetRaw)) { continue }

      if ($hasFill) {
        $soldRows++
        continue
      }

      $qty = 1
      if (-not [string]::IsNullOrWhiteSpace($QuantityColumn) -and $values[$QuantityColumn] -match '^\d+$') {
        $qty = [Math]::Max(1, [int]$values[$QuantityColumn])
      }

      $cabinet = Get-CabinetColor $cabinetRaw
      $container = if ($ContainerColumn) { Normalize-Container ([string]$values[$ContainerColumn]) } else { '' }

      $rows += @{
        mode = $Mode
        modelKey = Normalize-Text $modelName
        modelName = $modelName
        cabinetKey = $cabinet.key
        cabinetColor = $cabinet.color
        innerColor = [string]$values[$InnerColumn]
        container = $container
        quantity = $qty
      }

      $stockRows += $qty
    }

    return @{
      rows = @($rows)
      availableRows = $stockRows
      soldOrColoredRows = $soldRows
    }
  } finally {
    if ($zip) { $zip.Dispose() }
  }
}

function Read-SaunaStock {
  param([string]$Url)

  $tempFile = Join-Path $env:TEMP ("sunspa-sauna-stock-{0}.xlsx" -f ([guid]::NewGuid().ToString('N')))
  $tempFiles.Add($tempFile) | Out-Null
  Invoke-WebRequest -Uri (Get-DownloadUrl $Url) -OutFile $tempFile -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 60 | Out-Null

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [IO.Compression.ZipFile]::OpenRead($tempFile)

  try {
    $sharedStrings = Get-SheetSharedStrings $zip
    [xml]$currentSheet = Get-ZipText $zip 'xl/worksheets/sheet2.xml'
    [xml]$incomingSheet = Get-ZipText $zip 'xl/worksheets/sheet3.xml'
    $items = @{}
    $currentRows = 0
    $incomingRows = 0

    foreach ($row in $currentSheet.GetElementsByTagName('row')) {
      $rowNumber = [int]$row.GetAttribute('r')
      if ($rowNumber -eq 1) { continue }

      $values = @{}
      foreach ($cell in $row.GetElementsByTagName('c')) {
        $values[(Get-CellColumn $cell.GetAttribute('r'))] = Get-CellValue $cell $sharedStrings
      }

      $code = ([string]$values['B']).Trim()
      $name = ([string]$values['C']).Trim()
      if ([string]::IsNullOrWhiteSpace($code) -or [string]::IsNullOrWhiteSpace($name)) { continue }
      if ($name -match '(?i)profit|besturing|control panel|backrest|heater set|dak|handvat|led strip|garantie|accessoir') { continue }

      $qty = 0
      if ($values['G'] -match '^-?\d+$') { $qty = [Math]::Max(0, [int]$values['G']) }
      $key = Normalize-Text "$code $name"

      if (-not $items.ContainsKey($key)) {
        $items[$key] = @{
          key = $key
          code = $code
          name = $name
          currentTotal = 0
          incomingTotal = 0
          incoming = @()
        }
      }

      $items[$key].currentTotal += $qty
      $currentRows++
    }

    foreach ($row in $incomingSheet.GetElementsByTagName('row')) {
      $rowNumber = [int]$row.GetAttribute('r')
      if ($rowNumber -eq 1) { continue }

      $values = @{}
      foreach ($cell in $row.GetElementsByTagName('c')) {
        $values[(Get-CellColumn $cell.GetAttribute('r'))] = Get-CellValue $cell $sharedStrings
      }

      $code = ([string]$values['B']).Trim()
      $name = ([string]$values['E']).Trim()
      if ([string]::IsNullOrWhiteSpace($code) -or [string]::IsNullOrWhiteSpace($name)) { continue }
      if ($name -match '(?i)besturing|control panel|bank|led strip|garantie|accessoir') { continue }

      $qty = 0
      if ($values['J'] -match '^-?\d+$') { $qty = [Math]::Max(0, [int]$values['J']) }
      if ($qty -le 0) { continue }

      $key = Normalize-Text "$code $name"
      if (-not $items.ContainsKey($key)) {
        $items[$key] = @{
          key = $key
          code = $code
          name = $name
          currentTotal = 0
          incomingTotal = 0
          incoming = @()
        }
      }

      $items[$key].incomingTotal += $qty
      $items[$key].incoming += @{
        date = Get-ExcelDateText $values['G']
        count = $qty
      }
      $incomingRows++
    }

    return @{
      source = @{
        type = 'sharepoint-xlsx'
        live = $true
        url = $Url
      }
      counts = @{
        currentRows = $currentRows
        incomingRows = $incomingRows
      }
      items = @($items.Values | Sort-Object name)
    }
  } finally {
    if ($zip) { $zip.Dispose() }
  }
}

function Get-ArrivalDateFromText {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return $null }

  $patterns = @(
    '(?<day>\d{1,2})[/-](?<month>\d{1,2})[/-](?<year>\d{2,4})',
    '(?<year>\d{4})[/-](?<month>\d{1,2})[/-](?<day>\d{1,2})'
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($Value, $pattern)
    if ($match.Success) {
      $day = [int]$match.Groups['day'].Value
      $month = [int]$match.Groups['month'].Value
      $year = [int]$match.Groups['year'].Value
      if ($year -lt 100) { $year += 2000 }
      try { return [datetime]::new($year, $month, $day) } catch {}
    }
  }

  return $null
}

function Get-ContainerArrivals {
  param([string]$Url, [string]$Password)

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginUri = $Url.TrimEnd('/') + '?password-protected=login&redirect_to=' + [uri]::EscapeDataString($Url)

  try {
    Invoke-WebRequest -Uri $loginUri -Method Post -WebSession $session -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 30 -Body @{
      password_protected_pwd = $Password
      password_protected_rememberme = '1'
      'wp-submit' = 'Log In'
      password_protected_cookie_test = '1'
      'password-protected' = 'login'
      redirect_to = $Url
    } | Out-Null
  } catch {
    # A redirect after login can surface as an exception; the authenticated read below is what matters.
  }

  $response = Invoke-WebRequest -Uri $Url -WebSession $session -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 30
  $text = [System.Net.WebUtility]::HtmlDecode(($response.Content -replace '<[^>]+>', ' ')) -replace '\s+', ' '
  $arrivals = @{}
  $today = (Get-Date).Date

  $matches = [regex]::Matches($text, '(?i)(?:container\s*)?(?<container>S?\d{1,3})\b.{0,160}?(?<date>(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(?:\d{4}[/-]\d{1,2}[/-]\d{1,2}))')
  foreach ($match in $matches) {
    $container = $match.Groups['container'].Value.ToUpperInvariant()
    if ($arrivals.ContainsKey($container)) { continue }

    $arrivalDate = Get-ArrivalDateFromText $match.Groups['date'].Value
    if (-not $arrivalDate) { continue }

    $readyDate = $arrivalDate.Date.AddDays(28)
    $weeks = [Math]::Max(1, [int][Math]::Ceiling(($readyDate - $today).TotalDays / 7))
    $arrivals[$container] = @{
      container = $container
      arrivalDate = $arrivalDate.ToString('yyyy-MM-dd')
      readyDate = $readyDate.ToString('yyyy-MM-dd')
      weeks = $weeks
    }
  }

  return $arrivals
}

function Ensure-Model {
  param($Models, $Row)

  if (-not $Models.ContainsKey($Row.modelKey)) {
    $Models[$Row.modelKey] = @{
      key = $Row.modelKey
      name = $Row.modelName
      total = 0
      currentTotal = 0
      incomingTotal = 0
      cabinets = @{}
    }
  }

  if (-not $Models[$Row.modelKey].cabinets.ContainsKey($Row.cabinetKey)) {
    $Models[$Row.modelKey].cabinets[$Row.cabinetKey] = @{
      key = $Row.cabinetKey
      color = $Row.cabinetColor
      total = 0
      currentTotal = 0
      incomingTotal = 0
      innerColors = @{}
      sources = @{
        currentStock = 0
        incomingStock = @()
      }
    }
  }
}

try {
  $current = Read-XlsxRows `
    -Url $CurrentStockUrl `
    -Mode 'current' `
    -ModelColumns @('D', 'E', 'C') `
    -InnerColumn 'H' `
    -CabinetColumn 'I' `
    -QuantityColumn 'AA'

  $incoming = Read-XlsxRows `
    -Url $IncomingStockUrl `
    -Mode 'incoming' `
    -ModelColumns @('E', 'F', 'D', 'B') `
    -InnerColumn 'I' `
    -CabinetColumn 'J' `
    -QuantityColumn '' `
    -ContainerColumn 'C'

  $arrivals = Get-ContainerArrivals $ArrivalsUrl $ArrivalsPassword
  $saunaStock = Read-SaunaStock $SaunaStockUrl
  $models = @{}

  foreach ($row in $current.rows) {
    Ensure-Model $models $row
    $model = $models[$row.modelKey]
    $cabinet = $model.cabinets[$row.cabinetKey]

    $model.total += $row.quantity
    $model.currentTotal += $row.quantity
    $cabinet.total += $row.quantity
    $cabinet.currentTotal += $row.quantity
    $cabinet.sources.currentStock += $row.quantity

    if (-not [string]::IsNullOrWhiteSpace($row.innerColor)) {
      if (-not $cabinet.innerColors.ContainsKey($row.innerColor)) {
        $cabinet.innerColors[$row.innerColor] = 0
      }
      $cabinet.innerColors[$row.innerColor] += $row.quantity
    }
  }

  foreach ($row in $incoming.rows) {
    Ensure-Model $models $row
    $model = $models[$row.modelKey]
    $cabinet = $model.cabinets[$row.cabinetKey]
    $container = Normalize-Container ([string]$row.container)
    $arrival = if ($arrivals.ContainsKey($container)) { $arrivals[$container] } else { $null }

    $model.incomingTotal += $row.quantity
    $cabinet.incomingTotal += $row.quantity

    $existing = $cabinet.sources.incomingStock | Where-Object { $_.container -eq $container } | Select-Object -First 1
    if (-not $existing) {
      $existing = @{
        container = $container
        count = 0
        listed = [bool]$arrival
        arrivalDate = if ($arrival) { $arrival.arrivalDate } else { $null }
        readyDate = if ($arrival) { $arrival.readyDate } else { $null }
        weeks = if ($arrival) { $arrival.weeks } else { $null }
      }
      $cabinet.sources.incomingStock += $existing
    }
    $existing.count += $row.quantity
  }

  $modelList = foreach ($model in $models.Values) {
    $cabinetList = foreach ($cabinet in $model.cabinets.Values) {
      $innerList = foreach ($innerKey in $cabinet.innerColors.Keys) {
        @{
          color = $innerKey
          count = $cabinet.innerColors[$innerKey]
        }
      }

      @{
        key = $cabinet.key
        color = $cabinet.color
        total = $cabinet.total
        currentTotal = $cabinet.currentTotal
        incomingTotal = $cabinet.incomingTotal
        innerColors = @($innerList | Sort-Object color)
        sources = @{
          currentStock = $cabinet.sources.currentStock
          incomingStock = @($cabinet.sources.incomingStock | Sort-Object @{ Expression = { if ($_.weeks) { $_.weeks } else { 999 } } }, container)
        }
      }
    }

    @{
      key = $model.key
      name = $model.name
      total = $model.total
      currentTotal = $model.currentTotal
      incomingTotal = $model.incomingTotal
      cabinets = @($cabinetList | Sort-Object color)
    }
  }

  @{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    source = @{
      currentStock = @{
        type = 'sharepoint-xlsx'
        live = $true
        url = $CurrentStockUrl
      }
      incomingStock = @{
        type = 'sharepoint-xlsx'
        live = $true
        url = $IncomingStockUrl
      }
      containerArrivals = @{
        type = 'password-protected-html'
        live = $true
        url = $ArrivalsUrl
      }
    }
    counts = @{
      currentAvailableRows = $current.availableRows
      currentSoldOrColoredRows = $current.soldOrColoredRows
      incomingAvailableRows = $incoming.availableRows
      incomingSoldOrColoredRows = $incoming.soldOrColoredRows
      arrivals = $arrivals.Count
    }
    models = @($modelList | Sort-Object name)
    saunas = $saunaStock
  } | ConvertTo-Json -Depth 14
} finally {
  foreach ($tempFile in $tempFiles) {
    if (Test-Path $tempFile) { Remove-Item -LiteralPath $tempFile -Force }
  }
}
