// License Manager for Electron Main Process
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const { validateLicenseKey } = require('./license-utils');

class LicenseManager {
  constructor() {
    this.licenseFile = path.join(app.getPath('userData'), 'license.dat');
    this.machineId = null;
    this.currentLicense = null;
  }

  /**
   * Get machine ID
   */
  getMachineId() {
    if (!this.machineId) {
      try {
        this.machineId = machineIdSync();
      } catch (error) {
        console.error('Failed to get machine ID:', error);
        this.machineId = 'UNKNOWN';
      }
    }
    return this.machineId;
  }

  /**
   * Check if a license exists
   */
  hasLicense() {
    return fs.existsSync(this.licenseFile);
  }

  /**
   * Save license key to file
   */
  saveLicense(licenseKey) {
    try {
      const userData = app.getPath('userData');
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      
      fs.writeFileSync(this.licenseFile, licenseKey, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save license:', error);
      return false;
    }
  }

  /**
   * Load license key from file
   */
  loadLicense() {
    try {
      if (!this.hasLicense()) {
        return null;
      }
      return fs.readFileSync(this.licenseFile, 'utf8').trim();
    } catch (error) {
      console.error('Failed to load license:', error);
      return null;
    }
  }

  /**
   * Validate the current license
   */
  validateCurrentLicense() {
    const licenseKey = this.loadLicense();
    
    if (!licenseKey) {
      return {
        valid: false,
        reason: 'NO_LICENSE',
        message: 'No license key found. Please activate BillSutra.'
      };
    }

    const machineId = this.getMachineId();
    const validation = validateLicenseKey(licenseKey, machineId);

    if (!validation.valid) {
      if (validation.expired) {
        return {
          valid: false,
          reason: 'EXPIRED',
          message: 'Your license has expired. Please renew to continue using BillSutra.',
          data: validation.data
        };
      }
      if (!validation.machineValid) {
        return {
          valid: false,
          reason: 'MACHINE_MISMATCH',
          message: 'This license key is registered to a different computer.',
          data: validation.data
        };
      }
      return {
        valid: false,
        reason: 'INVALID',
        message: validation.error || 'Invalid license key.',
        data: null
      };
    }

    this.currentLicense = validation.data;
    return {
      valid: true,
      data: validation.data,
      daysRemaining: validation.daysRemaining
    };
  }

  /**
   * Activate with a new license key
   */
  activate(licenseKey) {
    const machineId = this.getMachineId();
    const validation = validateLicenseKey(licenseKey, machineId);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.expired ? 'This license key has expired.' :
                 !validation.machineValid ? 'This license key is registered to a different computer.' :
                 'Invalid license key.'
      };
    }

    // Save the license
    const saved = this.saveLicense(licenseKey);
    
    if (!saved) {
      return {
        success: false,
        message: 'Failed to save license key. Please check file permissions.'
      };
    }

    this.currentLicense = validation.data;
    
    return {
      success: true,
      data: validation.data,
      message: `BillSutra activated successfully! Your ${validation.data.type} license is valid for ${validation.daysRemaining} days.`
    };
  }

  /**
   * Deactivate (remove license)
   */
  deactivate() {
    try {
      if (this.hasLicense()) {
        fs.unlinkSync(this.licenseFile);
      }
      this.currentLicense = null;
      return { success: true };
    } catch (error) {
      console.error('Failed to deactivate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current license info
   */
  getLicenseInfo() {
    const validation = this.validateCurrentLicense();
    
    if (!validation.valid) {
      return {
        activated: false,
        ...validation
      };
    }

    return {
      activated: true,
      valid: true,
      hotelName: validation.data.hotelName,
      email: validation.data.email,
      type: validation.data.type,
      maxRooms: validation.data.maxRooms,
      features: validation.data.features,
      issuedDate: validation.data.issuedDate,
      expiryDate: validation.data.expiryDate,
      daysRemaining: validation.daysRemaining,
      expiringSoon: validation.daysRemaining <= 30
    };
  }

  /**
   * Check if a feature is available in current license
   */
  hasFeature(feature) {
    if (!this.currentLicense) {
      const validation = this.validateCurrentLicense();
      if (!validation.valid) {
        return false;
      }
    }
    
    return this.currentLicense && 
           this.currentLicense.features && 
           this.currentLicense.features.includes(feature);
  }

  /**
   * Check if room limit is exceeded
   */
  canAddRoom(currentRoomCount) {
    if (!this.currentLicense) {
      const validation = this.validateCurrentLicense();
      if (!validation.valid) {
        return false;
      }
    }
    
    return this.currentLicense && currentRoomCount < this.currentLicense.maxRooms;
  }
}

module.exports = LicenseManager;
