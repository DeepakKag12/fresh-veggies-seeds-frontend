import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, RefreshCw, Edit2 } from 'lucide-react';
import api from '../utils/api';

/**
 * Mobile Number Verification Component.
 * Standard e-commerce 1-click checkout phone authentication.
 */
const Msg91OtpWidget = ({ onSuccess, initialPhone = '', initialName = '' }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, '').slice(-10));
  const [name, setName] = useState(initialName);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');

  const otpInputsRef = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/msg91/send-otp', { phone: cleanPhone });
      if (res.data?.success) {
        setStep('otp');
        setResendTimer(30);
        if (res.data?.devOtp) {
          setDevOtpHint(res.data.devOtp);
        }
        // Focus first OTP input on transition
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        setError(res.data?.message || 'Unable to send verification code. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input digits
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 4 digits are filled, auto-verify
    if (digit && index === 3 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (otpCode) => {
    const codeToVerify = typeof otpCode === 'string' ? otpCode : otp.join('');
    if (!codeToVerify || codeToVerify.length < 4) {
      setError('Please enter the complete 4-digit code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/msg91/verify-otp', {
        phone: phone.replace(/\D/g, '').slice(-10),
        otp: codeToVerify,
        name: name.trim() || undefined
      });

      if (res.data?.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(res.data.data, res.data.isNewUser);
        }
      } else {
        setError(res.data?.message || 'Invalid code. Please check and try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/msg91/resend-otp', { phone: phone.replace(/\D/g, '').slice(-10) });
      if (res.data?.success) {
        setResendTimer(30);
        if (res.data?.devOtp) setDevOtpHint(res.data.devOtp);
      } else {
        setError(res.data?.message || 'Unable to resend code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-7 shadow-xs">
      {step === 'phone' ? (
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-fv-primary">
              Step 1 of 3
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              Mobile Number
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Enter your phone number to continue checkout
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Phone Number
              </label>
              <div className="flex rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:border-fv-primary focus-within:ring-2 focus-within:ring-fv-primary/20 transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-50 dark:bg-gray-800 border-r border-slate-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 select-none">
                  <span className="text-base">🇮🇳</span>
                  <span className="font-semibold text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  autoFocus
                  className="flex-1 px-4 py-3 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Full Name <span className="text-gray-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-fv-primary focus:ring-2 focus:ring-fv-primary/20 focus:outline-none bg-white dark:bg-gray-700 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white font-semibold text-base transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending verification code…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-fv-primary" />
            We protect your details with encrypted checkout
          </p>
        </div>
      ) : (
        /* Step 2: Verification Code Screen */
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-fv-primary">
              Step 1 of 3
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              Verify Number
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Enter the 4-digit code sent to <strong className="text-gray-900 dark:text-white">+91 {phone}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
                className="text-fv-primary hover:underline text-xs font-semibold inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Change
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex justify-center gap-3 sm:gap-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-13 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-gray-600 focus:border-fv-primary focus:ring-2 focus:ring-fv-primary/20 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all shadow-xs"
                />
              ))}
            </div>

            {devOtpHint && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtpHint.split('').slice(0, 4);
                    setOtp(digits);
                    handleVerifyOtp(devOtpHint);
                  }}
                  className="text-xs text-fv-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  Didn't receive SMS? Use code <strong className="font-bold underline">{devOtpHint}</strong> (tap to apply)
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleVerifyOtp(otp.join(''))}
              disabled={loading || otp.some((d) => d === '')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white font-semibold text-base transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Verify & Proceed
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resend code in <span className="font-semibold text-fv-primary">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-xs font-semibold text-fv-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Msg91OtpWidget;
