# Restart LiveKit Server and Agent (Production Mode)
# Run this script when things get stuck

Write-Host "Stopping all LiveKit processes..." -ForegroundColor Yellow

# Stop livekit-server
Get-Process -Name "livekit-server" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✓ Stopped livekit-server" -ForegroundColor Green

# Stop Python agent processes
Get-CimInstance Win32_Process | Where-Object {$_.CommandLine -like "*agent.py*"} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ Stopped agent" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Host "`nStarting services in PRODUCTION mode..." -ForegroundColor Yellow

# Start livekit-server in production mode with config
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\livekit-server.exe --config livekit.yaml"
Write-Host "✓ Started livekit-server (production mode)" -ForegroundColor Green

Start-Sleep -Seconds 3

# Start agent in new window  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\python agent.py start"
Write-Host "✓ Started agent" -ForegroundColor Green

Write-Host "`n✅ All services restarted in production mode!" -ForegroundColor Cyan
Write-Host "Wait 5 seconds, then refresh your browser." -ForegroundColor Cyan
