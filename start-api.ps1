# Start Smart Building API with Swagger UI
# Usage: .\start-api.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Smart Building & Industrial IoT API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$port = 3001

# Check if dist/ exists
if (-not (Test-Path "dist")) {
    Write-Host "❌ dist/ folder not found. Building project..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🚀 Starting API server on port $port..." -ForegroundColor Green
Write-Host "📖 Swagger UI will be at: http://localhost:$port/docs`n" -ForegroundColor Green

# Set environment and start Node
$env:PORT = $port
$process = Start-Process -PassThru -NoNewWindow -FilePath "node" -ArgumentList "dist/main.js"

Write-Host "⏳ Waiting for app to start (3 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n✅ API Server Status:`n" -ForegroundColor Green

# Check if port is listening
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ✓ API is running on http://localhost:$port" -ForegroundColor Green
    Write-Host "   ✓ Swagger UI: http://localhost:$port/docs" -ForegroundColor Green
    Write-Host "   ✓ OpenAPI JSON: http://localhost:$port/api-json" -ForegroundColor Green
} else {
    Write-Host "   ✗ Could not verify port is open (app may still be starting)" -ForegroundColor Yellow
}

Write-Host "`n📋 Tips:" -ForegroundColor Cyan
Write-Host "   • Click 'Try it out' to test endpoints in Swagger UI"
Write-Host "   • Use Postman collection: docs/openapi/Smart-Building-API.postman_collection.json"
Write-Host "   • Press Ctrl+C to stop the server`n" -ForegroundColor Cyan

# Try to open in browser
Write-Host "🌐 Opening Swagger UI in browser..." -ForegroundColor Green
Start-Sleep -Seconds 2
Start-Process "http://localhost:$port/docs"

Write-Host "`n⏳ Server is running. Press Ctrl+C to stop or just close this window.`n" -ForegroundColor Yellow

# Keep script running
while ($true) {
    Start-Sleep -Seconds 60
    
    # Check if process is still running
    if (-not (Get-Process -Id $process.Id -ErrorAction SilentlyContinue)) {
        Write-Host "`n❌ API server stopped!" -ForegroundColor Red
        break
    }
}
