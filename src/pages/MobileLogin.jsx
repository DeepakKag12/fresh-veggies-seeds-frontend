import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, Phone, Lock, ArrowLeft, RotateCw, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MobileLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithData } = useAuth();

  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(5);
  const [resendTimer, setResendTimer] = useState(0);

  // References for the 6 split OTP input boxes
  const inputRefs = useRef([]);

  // Timer countdown effect for OTP resend (60s countdown)
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Focus first OTP box when transitioning to Step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Phone validation helper (Indian mobile format: 10 digits starting with 6,7,8,9)
  const isValidIndianPhone = (num) => /^[6-9]\d{9}$/.test(num);

  // Step 1: Send OTP
  const handlePhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!isValidIndianPhone(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { phone: cleanPhone });

      if (response.data.success) {
        setUserId(response.data.userId || '');
        setStep(2);
        setResendTimer(60); // 60s countdown like Blinkit/Zepto
        setOtpAttempts(5);
        setOtpValues(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await api.post('/auth/send-otp', { phone: cleanPhone });
      if (response.data.success) {
        setResendTimer(60);
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend OTP. Please wait.');
    } finally {
      setLoading(false);
    }
  };

  // Split OTP input handlers
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = digit;
    setOtpValues(newOtpValues);
    setError('');

    // Auto-advance to next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    const completeOtp = newOtpValues.join('');
    if (completeOtp.length === 6 && digit) {
      executeVerifyOtp(completeOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtpValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtpValues[i] = pastedData[i] || '';
    }
    setOtpValues(newOtpValues);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      executeVerifyOtp(pastedData);
    }
  };

  // Step 2: Verify OTP
  const executeVerifyOtp = async (codeToVerify) => {
    const finalOtp = codeToVerify || otpValues.join('');
    if (finalOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await api.post('/auth/verify-otp', {
        userId,
        phone: cleanPhone,
        otp: finalOtp
      });

      if (response.data.success) {
        const userData = response.data.data;
        loginWithData(userData);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        const from = location.state?.from;
        const fromPath = typeof from === 'string' ? from : from?.pathname;

        if (userData?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (fromPath) {
          navigate(fromPath, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);

      const attemptsMatch = message.match(/(\d+)\s+attempts?\s+remaining/i);
      if (attemptsMatch) {
        setOtpAttempts(parseInt(attemptsMatch[1], 10));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpFormSubmit = (e) => {
    e.preventDefault();
    executeVerifyOtp();
  };

  const isPhoneValid = isValidIndianPhone(phone.replace(/\D/g, '').slice(-10));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 max-w-md w-full relative overflow-hidden">
        {/* Top botanical accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>

        {/* Back button on Step 2 */}
        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Mobile Number
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
            {step === 1 ? <Phone className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Mobile OTP Login' : 'Enter Verification Code'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {step === 1
              ? 'Enter your mobile number to receive a 6-digit OTP'
              : `Code sent via SMS to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3.5 mb-5 rounded-r-lg flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm leading-snug">{error}</p>
          </div>
        )}

        {/* Step 1: Mobile Phone Form */}
        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all overflow-hidden">
                <span className="px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-base tracking-wider font-medium"
                  placeholder="9876543210"
                  maxLength="10"
                  disabled={loading}
                  autoFocus
                />
                {isPhoneValid && (
                  <span className="pr-3 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                We will send an instant 6-digit verification code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !isPhoneValid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: 6-Digit Split OTP Form */
          <form onSubmit={handleOtpFormSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Enter 6-Digit OTP
                </label>
                {otpAttempts < 5 && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {otpAttempts} attempts left
                  </span>
                )}
              </div>

              {/* 6 Split OTP Boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-12 text-center text-xl font-bold font-mono rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    maxLength={1}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP Timer & Trigger (Blinkit style) */}
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-gray-500 dark:text-gray-400">
                {resendTimer > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Resend OTP in <span className="font-mono font-bold text-emerald-600">{resendTimer}s</span>
                  </span>
                ) : (
                  <span>Didn't receive the code?</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
                className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpValues.join('').length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>
          </form>
        )}

        {/* Dual Mode Switch Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/60 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prefer email and password?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Sign in with Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;
