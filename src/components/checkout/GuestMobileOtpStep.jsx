import React, { useState, useEffect, useRef } from 'react';
import { Phone, AlertCircle, CheckCircle, Loader2, RotateCw, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  initMsg91,
  sendMsg91Otp,
  retryMsg91Otp,
  verifyMsg91Otp,
  isValidIndianMobile
} from '../../utils/msg91';

const RESEND_COOLDOWN_SECONDS = 30;

const GuestMobileOtpStep = ({ onVerified }) => {
  const { loginWithData } = useAuth();

  const [phone, setPhone] = useState('');
  const [otpLength, setOtpLength] = useState(4);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [reqId, setReqId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [error, setError] = useState('');

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const digitInputRefs = useRef([]);

  // Pre-load MSG91 script on mount & listen to CAPTCHA verification
  useEffect(() => {
    window.onMsg91CaptchaVerified = (status) => {
      setCaptchaVerified(Boolean(status));
      if (status) {
        setError('');
      }
    };

    initMsg91().catch((err) => {
      console.warn('MSG91 pre-load notice:', err.message);
    });

    return () => {
      window.onMsg91CaptchaVerified = null;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  // Handle phone input change — enforces 10 digits
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    if (error) setError('');
  };

  // Safely extract string error message from any format
  const extractErrMsg = (err) => {
    if (!err) return 'Unable to send OTP. Please check the mobile number and try again.';
    if (typeof err === 'string') return err;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error === 'string') return err.error;
    if (typeof err.status === 'string') return err.status;
    if (typeof err.message === 'object') return extractErrMsg(err.message);
    try {
      return JSON.stringify(err);
    } catch {
      return 'An error occurred. Please try again.';
    }
  };

  // Step 1: Send OTP via window.sendOtp
  const handleSendOtp = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (loading) return;

    if (!isValidIndianMobile(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (typeof window.isCaptchaVerified === 'function' && !window.isCaptchaVerified() && !captchaVerified) {
      setError('Please complete the security check (I am human) above.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      sendMsg91Otp(
        phone,
        (data) => {
          console.log('MSG91 sendOtp success callback:', data);
          setLoading(false);
          const extractedReqId =
            data?.reqId ||
            (data && typeof data === 'object' && (data.request_id || data.message)) ||
            (typeof data === 'string' && data.length > 10 ? data : null);
          if (extractedReqId && typeof extractedReqId === 'string' && !extractedReqId.includes(' ')) {
            setReqId(extractedReqId);
          }

          const widgetData = typeof window.getWidgetData === 'function' ? window.getWidgetData() : null;
          const len = Number(widgetData?.otpLength) || (typeof data === 'object' && Number(data?.otpLength)) || 4;
          setOtpLength(len);
          setOtpDigits(new Array(len).fill(''));
          setStep('otp');
          setCooldown(RESEND_COOLDOWN_SECONDS);
          toast.success(`OTP sent to +91 ${phone}`);

          // Focus first OTP digit box after render
          setTimeout(() => {
            if (digitInputRefs.current[0]) {
              digitInputRefs.current[0].focus();
            }
          }, 100);
        },
        (err) => {
          console.error('MSG91 sendOtp error callback:', err);
          setLoading(false);
          setError(extractErrMsg(err));
        }
      );
    } catch (unexpected) {
      console.error('Unexpected error in handleSendOtp:', unexpected);
      setLoading(false);
      setError(unexpected?.message || 'Failed to initiate OTP. Please try again.');
    }
  };

  // Handle individual digit box change
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (error) setError('');

    // If user pasted a multi-digit string
    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < otpLength; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(cleaned.length, otpLength - 1);
      digitInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (cleaned && index < otpLength - 1) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between digit boxes
  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste on OTP boxes
  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < otpLength; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    const nextFocus = Math.min(pastedData.length, otpLength - 1);
    digitInputRefs.current[nextFocus]?.focus();
  };

  // Resend OTP via window.retryOtp
  const handleResendOtp = () => {
    if (resending || cooldown > 0) return;

    setError('');
    setResending(true);

    retryMsg91Otp(
      (data) => {
        setResending(false);
        const extractedReqId =
          data?.reqId ||
          (data && typeof data === 'object' && (data.request_id || data.message)) ||
          reqId;
        if (extractedReqId && typeof extractedReqId === 'string' && !extractedReqId.includes(' ')) {
          setReqId(extractedReqId);
        }

        setCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success('OTP resent successfully! 📲');
        digitInputRefs.current[0]?.focus();
      },
      (err) => {
        setResending(false);
        const errMsg =
          (err && typeof err === 'object' && (err.message || err.error)) ||
          (typeof err === 'string' ? err : 'Failed to resend OTP. Please wait before retrying.');
        setError(errMsg);
      },
      reqId
    );
  };

  // Change phone number: resets OTP and reqId state cleanly
  const handleChangePhone = () => {
    setStep('phone');
    setOtpDigits(new Array(otpLength).fill(''));
    setReqId(null);
    setError('');
    setCooldown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Step 2: Verify OTP via window.verifyOtp, then verify access token on backend
  const handleVerifyOtp = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (verifying) return;

    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length < otpLength) {
      setError(`Please enter the complete ${otpLength}-digit OTP.`);
      return;
    }

    setError('');
    setVerifying(true);

    try {
      verifyMsg91Otp(
        fullOtp,
        async (data) => {
          const accessToken =
            (typeof data === 'string' ? data : null) ||
            data?.['access-token'] ||
            data?.token ||
            data?.jwt ||
            data?.data?.['access-token'] ||
            data?.message;

          if (!accessToken) {
            setVerifying(false);
            setError('Could not retrieve access token from OTP provider.');
            return;
          }

          try {
            const response = await api.post('/auth/msg91-verify', {
              accessToken
            });

            if (response.data?.success && response.data?.data) {
              loginWithData(response.data.data);
              if (onVerified) onVerified(response.data.data);
            } else {
              setError(response.data?.message || 'Authentication failed. Please try again.');
              setVerifying(false);
            }
          } catch (serverErr) {
            setVerifying(false);
            const serverMsg =
              serverErr.response?.data?.message || 'Server verification failed. Please try again.';
            setError(serverMsg);
          }
        },
        (err) => {
          setVerifying(false);
          setError(extractErrMsg(err) || 'Invalid OTP. Please check and try again.');
        },
        reqId
      );
    } catch (unexpected) {
      console.error('Unexpected error in handleVerifyOtp:', unexpected);
      setVerifying(false);
      setError(unexpected?.message || 'Verification failed. Please try again.');
    }
  };

  const isOtpComplete = otpDigits.join('').length === otpLength;

  return (
    <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-fv-primary text-white">
                Step 1
              </span>
              <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                Mobile Verification
              </h2>
            </div>
            <p className="text-xs text-fv-muted dark:text-gray-400 mt-0.5">
              Instant login via SMS OTP to place your order
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3.5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* ── Phone Input Screen ── */}
      {step === 'phone' && (
        <div className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Enter Indian Mobile Number *
            </label>
            <div className="flex items-stretch rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-2xs focus-within:ring-2 focus-within:ring-fv-primary focus-within:border-transparent transition-all">
              <span className="flex items-center px-3 sm:px-3.5 border-r border-gray-200 dark:border-gray-600 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-l-xl select-none shrink-0">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!loading && phone.length === 10) handleSendOtp(e);
                  }
                }}
                placeholder="10-digit mobile number"
                maxLength={10}
                disabled={loading}
                className="w-full h-11 sm:h-12 px-3.5 bg-transparent text-gray-900 dark:text-white text-base font-medium tracking-wide focus:outline-none disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
              We'll send an SMS with a {otpLength}-digit verification code.
            </p>
          </div>

          {/* MSG91 Security CAPTCHA Container */}
          <div className="pt-0.5 pb-0.5">
            <div
              id="msg91-captcha-container"
              className="min-h-[78px] flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600/50 transition-all overflow-x-auto"
            ></div>
            <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-1">
              Complete the security check above to request your OTP
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || phone.length !== 10}
            className="w-full h-11 sm:h-12 rounded-xl bg-fv-primary hover:bg-fv-primary-dark active:scale-[0.99] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending OTP…</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <Phone className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── OTP Verification Screen ── */}
      {step === 'otp' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Mobile indicator pill with change number action */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">OTP sent to:</span>
              <span className="font-bold text-gray-900 dark:text-white truncate">
                +91 {phone}
              </span>
            </div>
            <button
              type="button"
              onClick={handleChangePhone}
              disabled={verifying}
              className="inline-flex items-center gap-1 font-semibold text-fv-primary hover:text-fv-primary-dark shrink-0 ml-2 py-1 px-2 rounded-md hover:bg-fv-primary/5 transition-colors cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>Change</span>
            </button>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5 text-center">
              Enter {otpLength}-digit Verification Code
            </label>

            {/* Individual Digit Boxes — Perfectly proportional on all mobile screens */}
            <div
              className="flex items-center justify-center gap-1.5 sm:gap-2.5 my-1 max-w-[340px] mx-auto w-full"
              onPaste={handleDigitPaste}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (digitInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isOtpComplete) {
                      e.preventDefault();
                      handleVerifyOtp(e);
                    } else {
                      handleDigitKeyDown(idx, e);
                    }
                  }}
                  disabled={verifying}
                  className="w-full max-w-[44px] h-12 sm:max-w-[48px] sm:h-13 flex-1 min-w-0 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-fv-primary focus:border-transparent transition-all disabled:opacity-60"
                  aria-label={`OTP Digit ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifying || !isOtpComplete}
              className="w-full h-11 sm:h-12 rounded-xl bg-fv-primary hover:bg-fv-primary-dark active:scale-[0.99] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying OTP…</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify & Continue</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || cooldown > 0 || verifying}
              className="w-full min-h-[38px] flex items-center justify-center text-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-fv-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {resending ? (
                <span className="inline-flex items-center gap-1.5">
                  <RotateCw className="h-3 w-3 animate-spin" /> Resending OTP…
                </span>
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                <span className="text-fv-primary font-bold">Resend OTP</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestMobileOtpStep;
