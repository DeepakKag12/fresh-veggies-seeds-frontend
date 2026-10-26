import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  X,
  ArrowRight,
  RotateCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export const ChatPhoneLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { loginWithData } = useAuth();

  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Resend countdown timer
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

  // Focus first OTP box on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const isValidIndianPhone = (num) => /^[6-9]\d{9}$/.test(num);

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(clean);
    if (error) setError('');
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (!isValidIndianPhone(clean)) {
      setError('Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: clean });
      if (res.data?.success) {
        setUserId(res.data.userId || '');
        setStep(2);
        setResendTimer(60);
        setOtpValues(['', '', '', '', '', '']);
        toast.success(`OTP sent to +91 ${clean}`);
      } else {
        setError(res.data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send OTP. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP input handlers
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);
    if (error) setError('');

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const completeCode = newOtp.join('');
    if (completeCode.length === 6 && digit) {
      executeVerifyOtp(completeCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtpValues(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      executeVerifyOtp(pasted);
    }
  };

  // Step 2: Verify OTP
  const executeVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpValues.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const clean = phone.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/verify-otp', {
        userId,
        phone: clean,
        otp: code
      });

      if (res.data?.success) {
        const userData = res.data.data;
        loginWithData(userData);
        toast.success(`Logged in as ${userData.name || 'Shopper'}`);
        if (onLoginSuccess) onLoginSuccess(userData);
        onClose();
      } else {
        setError(res.data?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
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
      const clean = phone.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/send-otp', { phone: clean });
      if (res.data?.success) {
        setResendTimer(60);
        setOtpValues(['', '', '', '', '', '']);
        toast.success('New OTP sent');
        otpInputRefs.current[0]?.focus();
      } else {
        setError(res.data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-fv-border overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-[#0A4C36] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Live Chat Login</h3>
                <p className="text-[11px] text-emerald-200">Fresh Veggies Support</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: Phone Number Input */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Mobile Number
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                    Enter your phone number to receive a one-time OTP password and connect with botanical experts.
                  </p>

                  <div className="flex rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600 bg-white dark:bg-gray-800 transition-all">
                    <span className="inline-flex items-center px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 select-none">
                      +91
                    </span>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0A4C36] hover:bg-[#073626] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: 6-Digit OTP Verification */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Code sent to </span>
                    <span className="font-semibold text-gray-900 dark:text-white">+91 {phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-medium text-xs cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                {/* 6 OTP Boxes */}
                <div className="flex justify-between gap-1.5" onPaste={handleOtpPaste}>
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs transition-all"
                    />
                  ))}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => executeVerifyOtp()}
                  disabled={loading || otpValues.join('').length !== 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0A4C36] hover:bg-[#073626] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Start Chatting</span>
                    </>
                  )}
                </button>

                {/* Resend Cooldown */}
                <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Alternative full login link */}
            <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-800 text-center">
              <a
                href="/login"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Or log in with email and password →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ChatPhoneLoginModal;
