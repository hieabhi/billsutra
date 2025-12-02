# BillSutra Installers & Downloads

This folder contains the desktop application installers for BillSutra.

## 📥 HMS Desktop App Installer

**File**: `BillSutra-HMS-Setup.exe` (96.5 MB)

### System Requirements
- Windows 10 or Windows 11
- 200 MB free disk space
- Internet connection (for first setup)

### Installation Steps

1. **Download** the installer from https://billsutra.com/demo
2. **Run** `BillSutra-HMS-Setup.exe`
3. **Follow** the installation wizard
4. **Launch** BillSutra after installation completes
5. **Login** with:
   - Username: `admin`
   - Password: `admin123`

### First-Time Setup

After login, complete these steps:

1. **Configure Hotel Details** (Settings)
   - Hotel name, address
   - GST number, phone

2. **Add Items** (Items Menu)
   - Menu items/services
   - Rates and GST rates

3. **Create Rooms** (Rooms)
   - Add your rooms/suites
   - Assign room types

4. **Start Billing!**
   - Create first guest folio
   - Add charges and payments
   - Print GST-compliant invoice

### Demo Data

The installer includes sample data for testing:
- 10 sample rooms across 3 floors
- Multiple demo bookings
- Sample items and customers
- Test transactions

Feel free to modify or delete this data.

## 🔄 Updating the Installer

To rebuild the installer:

```bash
# From project root
npm run dist:win

# New installer will be created in dist-electron/
# Copy to billsutra-website/public/downloads/
```

## 📱 macOS & Linux Versions

Coming soon! Build with:
- macOS: `npm run dist:mac`
- Linux: `npm run dist:linux`

## 🆘 Troubleshooting

### Installation Fails
- Ensure Windows Defender/Antivirus isn't blocking
- Try running installer as Administrator
- Check you have 200 MB free space

### App Won't Start
- Restart your computer
- Reinstall the application
- Contact support@billsutra.com

### Can't Login
- Default credentials: admin / admin123
- Check internet connection
- Try resetting the app cache

## 📞 Support

- **Email**: support@billsutra.com
- **Website**: https://billsutra.com
- **Documentation**: https://billsutra.com/docs

---

**Version**: 1.0.0  
**Last Updated**: January 2025
