import React, { useState, useEffect, useRef } from 'react';
import { Phone, ShieldCheck, AlertCircle, Loader2, User } from 'lucide-react';
import api from '../utils/api';

/**
 * MSG91 SMS OTP Widget for checkout and mobile verification.
 * Loads the official MSG91 script and initializes SendOTP.
 * Verifies the resulting access token on the backend.
 */
const Msg91OtpWidget = ({ onSuccess, initialPhone = '', initialName = '' }) => {
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const scriptLoadingRef = useRef(false);

  const widgetId = process.env.REACT_APP_MSG91_WIDGET_ID || '36696f6e6235373730363034';
  const tokenAuth = process.env.REACT_APP_MSG91_TOKEN_AUTH || '571570TJ2Jnicrt6aa951c6P1';

  // Load MSG91 script dynamically with fallback
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.initSendOTP === 'function') {
      setScriptLoaded(true);
      return;
    }

    if (scriptLoadingRef.current) return;
    scriptLoadingRef.current = true;

    const urls = [
      'https://verify.msg91.com/otp-provider.js',
      'https://verify.phone91.com/otp-provider.js'
    ];

    let i = 0;
    function attempt() {
      // Check if already injected
      const existing = document.querySelector(`script[src="${urls[i]}"]`);
      if (existing) {
        if (typeof window.initSendOTP === 'function') {
          setScriptLoaded(true);
          return;
        }
      }

      const s = document.createElement('script');
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        if (typeof window.initSendOTP === 'function') {
          setScriptLoaded(true);
        }
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) {
          attempt();
        } else {
          console.warn('⚠️ Could not load MSG91 OTP script from any provider');
          setError('Unable to load SMS OTP service. Please check your internet connection or adblocker.');
        }
      };
      document.head.appendChild(s);
    }

    attempt();
  }, []);

  // Handle server-side token verification
  const handleVerifyAccessToken = async (accessToken) => {
    try {
      setVerifying(true);
      setError('');

      const response = await api.post('/auth/msg91/verify-token', {
        accessToken,
        name: name.trim() || undefined
      });

      if (response.data?.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(response.data.data, response.data.isNewUser);
        }
      } else {
        setError(response.data?.message || 'Failed to verify mobile token');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  // Trigger MSG91 OTP Widget
  const handleLaunchOtpWidget = (e) => {
    e?.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (typeof window.initSendOTP !== 'function') {
      setError('OTP service is still loading. Please wait a few seconds and try again.');
      return;
    }

    setVerifying(true);

    const configuration = {
      widgetId,
      tokenAuth,
      identifier: `91${cleanPhone}`,
      exposeMethods: false,
      success: (data) => {
        // Extract token string
        let token = '';
        if (typeof data === 'string') {
          token = data;
        } else if (data && typeof data === 'object') {
          token = data['access-token'] || data.token || data.message || data.response || '';
          if (!token && typeof data === 'object') {
            token = JSON.stringify(data);
          }
        }
        if (token) {
          handleVerifyAccessToken(token);
        } else {
          setError('Received empty token from OTP provider.');
          setVerifying(false);
        }
      },
      failure: (errorData) => {
        setVerifying(false);
        const errMsg = typeof errorData === 'string'
          ? errorData
          : (errorData?.message || errorData?.description || 'OTP verification was cancelled or failed.');
        setError(errMsg);
      }
    };

    try {
      window.initSendOTP(configuration);
    } catch (err) {
      console.error('Error launching MSG91 widget:', err);
      setVerifying(false);
      setError('Could not initialize the OTP widget. Please refresh and try again.');
    }
  };

  return (
    <div className="rounded-[18px] border border-fv-border bg-white p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-fv-primary/10 flex items-center justify-center text-fv-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-fv-heading">
            Mobile Verification
          </h2>
          <p className="text-xs sm:text-sm text-fv-muted">
            Enter your mobile number to receive a one-time SMS OTP via MSG91
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3.5 mb-5 rounded-r-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleLaunchOtpWidget} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Full Name (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              disabled={verifying}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Mobile Number *
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3.5 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              maxLength={10}
              disabled={verifying}
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent text-sm tracking-wider font-medium"
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
            A 6-digit SMS verification code will be sent to this number
          </p>
        </div>

        <button
          type="submit"
          disabled={verifying || phone.length !== 10 || !scriptLoaded}
          className="w-full mt-2 bg-fv-primary hover:bg-fv-primary-dark text-white py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying OTP…
            </>
          ) : !scriptLoaded ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading Verification Service…
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Verify with Mobile OTP
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-fv-muted">
        <span>🔒 Secure verification powered by MSG91</span>
        <span>No password required</span>
      </div>
    </div>
  );
};

export default Msg91OtpWidget;
