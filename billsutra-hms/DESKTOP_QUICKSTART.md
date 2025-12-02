# 🚀 BillSutra Desktop - Quick Start Guide

## For Users

### Installation
1. Download `BillSutra-Setup-1.0.0.exe` from website
2. Run the installer
3. Follow installation wizard
4. Launch "BillSutra Hotel Management" from desktop shortcut

### First Time Setup
1. App will start automatically and show loading screen
2. Server initializes (takes 5-10 seconds first time)
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
4. Start managing your hotel!

### Data Location
All your hotel data is stored locally in:
```
C:\Users\[YourName]\AppData\Roaming\BillSutra Hotel Management\data\
```

### Updates
- App automatically checks for updates on startup
- You'll be notified when a new version is available
- Updates download in background
- Install when convenient

### Backup Your Data
**IMPORTANT**: Regularly backup your data folder:
```
C:\Users\[YourName]\AppData\Roaming\BillSutra Hotel Management\data\
```
Copy this folder to external drive or cloud storage.

---

## For Developers

### Development Mode
```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### Building Installer

#### Prerequisites
```bash
# Build frontend first
cd client
npm install
npm run build
cd ..

# Install Electron dependencies
npm install
```

#### Create Windows Installer
```bash
# Create unpacked version (for testing)
npm run pack

# Create installer (.exe)
npm run dist:win
```

Output will be in: `dist-electron/`

#### Build for Other Platforms
```bash
# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

### Project Structure
```
BillSutra/
├── electron-main.js          # Electron main process
├── electron-preload.js       # Preload script for security
├── electron-server.js        # Server wrapper
├── electron-builder.json     # Build configuration
├── server/                   # Express backend
│   ├── index.js             # Server entry point
│   ├── data/                # JSON database
│   ├── models/              # Data models
│   ├── routes/              # API routes
│   └── repositories/        # Data access layer
├── client/                   # React frontend
│   ├── src/                 # Source code
│   └── dist/                # Built files (after npm run build)
└── assets/                   # Icons and resources
```

### Configuration

#### Port Configuration
Default port: `5051`

To change, edit:
- `server/index.js` (line 25)
- `electron-main.js` (line 79)
- `.env` file

#### Auto-Update Configuration
Edit `electron-builder.json`:
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "billsutra"
  }
}
```

### Debugging
```bash
# View Electron console
Press F12 in the app window

# View server logs
Check console output in terminal
```

### Common Issues

**1. App won't start**
- Check if port 5051 is available
- Kill any existing Node.js processes
- Restart computer

**2. Build fails**
- Ensure `client/dist` exists (run `npm run build:client`)
- Delete `node_modules` and reinstall
- Check disk space (need 2GB+ free)

**3. Auto-update not working**
- Only works in packaged app (not development)
- Need to configure GitHub releases
- Check internet connection

### Testing Checklist
- [ ] App starts without errors
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create booking
- [ ] Can check-in guest
- [ ] Can post charges
- [ ] Can checkout guest
- [ ] Data persists after restart
- [ ] Updates check on startup

---

## Support

For issues or questions:
- Email: support@billsutra.com
- WhatsApp: +91-XXXXXXXXXX
- Documentation: www.billsutra.com/docs

---

## License

This software is licensed under the BillSutra EULA.
See LICENSE.txt for details.
