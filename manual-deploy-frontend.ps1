# Manual Frontend Deployment Script
# Run this to deploy the frontend when GitHub Actions fails

Write-Host "🚀 Building Frontend..." -ForegroundColor Cyan
cd client
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Built files are in: client/dist" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy manually:" -ForegroundColor Cyan
    Write-Host "1. Install Firebase CLI: npm install -g firebase-tools"
    Write-Host "2. Login to Firebase: firebase login"
    Write-Host "3. Deploy: firebase deploy --only hosting"
    Write-Host ""
    Write-Host "OR use Firebase Console:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://console.firebase.google.com/project/billsutra-hms/hosting"
    Write-Host "2. Click 'Add another site' or select existing site"
    Write-Host "3. Drag and drop the 'client/dist' folder"
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

cd ..
