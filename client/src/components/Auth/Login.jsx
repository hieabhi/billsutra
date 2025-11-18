import React, { useState } from 'react';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  // Send OTP to phone number
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      
      // Format phone number (should be in E.164 format: +91XXXXXXXXXX)
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setLoading(false);
      alert('OTP sent successfully! Check your phone.');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setLoading(false);
      
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      console.log('User signed in:', user);
      
      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Store token and call success callback
      localStorage.setItem('authToken', token);
      localStorage.setItem('userPhone', user.phoneNumber);
      
      if (onLoginSuccess) {
        onLoginSuccess(user, token);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', user.email);
      
      if (onLoginSuccess) {
        onLoginSuccess(user, token);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error with Google sign-in:', err);
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>BillSutra HMS</h1>
          <p>Hotel Management System</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!confirmationResult ? (
          // Phone Number Form
          <form onSubmit={handleSendOTP} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Enter 10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength="10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || phoneNumber.length !== 10}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <div id="recaptcha-container"></div>
          </form>
        ) : (
          // OTP Verification Form
          <form onSubmit={handleVerifyOTP} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setConfirmationResult(null);
                setOtp('');
              }}
              disabled={loading}
            >
              Change Number
            </button>
          </form>
        )}

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Google Sign-In Button */}
        <button 
          onClick={handleGoogleSignIn} 
          className="btn-google"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        <p className="login-footer">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
