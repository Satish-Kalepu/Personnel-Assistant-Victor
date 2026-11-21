param([switch]$Cloud)
$ErrorActionPreference = 'Stop'
$PocRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PocPython = Join-Path $PocRoot '.local/venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $PocPython)) {
    throw 'Local POC environment is missing. Follow README.md setup first.'
}
$PreviousCloudFlag = $env:SARVAM_PRIVACY_CONFIRMED
try {
    if ($Cloud) {
        Write-Host 'Cloud mode: Sarvam processes speech; OpenAI receives transcripts. This flag applies only to this run.'
        $env:SARVAM_PRIVACY_CONFIRMED = 'true'
    }
    & $PocPython (Join-Path $PocRoot 'server.py')
} finally {
    $env:SARVAM_PRIVACY_CONFIRMED = $PreviousCloudFlag
}
