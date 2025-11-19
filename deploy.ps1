# =====================================================
# BillSutra Cloud Deployment Script
# =====================================================
# Deploys your app to Vercel (100% online)
# =====================================================

Write-Host "🚀 BillSutra Cloud Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "✅ Vercel CLI ready" -ForegroundColor Green
Write-Host ""

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Cyan
cd client
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built" -ForegroundColor Green
Write-Host ""

# Return to root
cd ..

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy your deployment URL from above" -ForegroundColor White
    Write-Host "2. Add environment variables in Vercel Dashboard" -ForegroundColor White
    Write-Host "3. Update Firebase authorized domains" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check error messages above" -ForegroundColor Yellow
}
