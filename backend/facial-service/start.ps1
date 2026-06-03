# Start the SICISV Facial Recognition Service
param(
  [string]$Port = "3002"
)

$ErrorActionPreference = "Stop"
$VENV_DIR = Join-Path $PSScriptRoot "venv"

if (-not (Test-Path $VENV_DIR)) {
  Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
  python -m venv $VENV_DIR
  Write-Host "Installing dependencies..." -ForegroundColor Cyan
  & "$VENV_DIR\Scripts\pip.exe" install -r (Join-Path $PSScriptRoot "requirements.txt")
}

$env:FACIAL_SERVICE_URL = "http://localhost:$Port"

Write-Host "Starting Facial Recognition Service on port $Port..." -ForegroundColor Green
& "$VENV_DIR\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port $Port --reload
