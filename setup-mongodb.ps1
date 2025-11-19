Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         BillSutra - MongoDB Setup Wizard                 ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "This wizard will help you set up MongoDB Atlas (5 minutes)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if .env exists
$envPath = "server\.env"
if (!(Test-Path $envPath)) {
    Write-Host "❌ ERROR: server\.env file not found!" -ForegroundColor Red
    Write-Host "   Please create it from server\.env.example" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check if MONGODB_URI is configured
$envContent = Get-Content $envPath -Raw
if ($envContent -match "MONGODB_URI=mongodb") {
    Write-Host "✅ MongoDB URI found in .env" -ForegroundColor Green
    
    # Test connection
    Write-Host "`n📡 Testing connection..." -ForegroundColor Cyan
    npm run db:test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Connection successful!" -ForegroundColor Green
        
        # Ask if user wants to migrate
        Write-Host "`nDo you want to migrate your data now? (Y/N): " -NoNewline -ForegroundColor Yellow
        $response = Read-Host
        
        if ($response -eq "Y" -or $response -eq "y") {
            Write-Host "`n🔄 Starting migration..." -ForegroundColor Cyan
            npm run db:migrate
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n💾 Creating first backup..." -ForegroundColor Cyan
                npm run db:backup
                
                Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
                Write-Host "`n📌 Next steps:" -ForegroundColor Yellow
                Write-Host "   1. Restart server: npm run dev" -ForegroundColor White
                Write-Host "   2. Test application" -ForegroundColor White
                Write-Host "   3. Check MongoDB Atlas dashboard" -ForegroundColor White
            }
        } else {
            Write-Host "`nSkipping migration. Run 'npm run db:migrate' when ready." -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Connection failed!" -ForegroundColor Red
        Write-Host "`n📖 Please check MONGODB_SETUP_GUIDE.md for help" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ MONGODB_URI not configured in .env" -ForegroundColor Red
    Write-Host "`n📋 Follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Create MongoDB Atlas account:" -ForegroundColor Cyan
    Write-Host "   → https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Create free cluster (takes 3-5 minutes)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Create database user with password" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Whitelist IP: 0.0.0.0/0" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Get connection string and add to server\.env:" -ForegroundColor Cyan
    Write-Host "   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/billsutra?..." -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Detailed guide: MONGODB_SETUP_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this script again after adding MONGODB_URI to .env" -ForegroundColor Green
}

Write-Host ""
