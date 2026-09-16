import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Sprout, CheckCircle2, ShieldCheck, Sparkles, ArrowLeft, Loader2, Eye, EyeOff, RotateCw, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, PASSWORD_RULE_TEXT } from '../../utils/passwordPolicy';
import {
  initMsg91,
  sendMsg91Otp,
  retryMsg91Otp,
  verifyMsg91Otp,
  isValidIndianMobile,
  cleanupMsg91Captcha,
  renderMsg91Captcha
} from '../../utils/msg91';

/* ─── Real Customer Name Check ─────────────────────────────────────────── */
const isPlaceholderName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  return /^customer(\s*\d+)?$/i.test(trimmed);
};

const RESEND_COOLDOWN_SECONDS = 30;

export default function AuthSwitch({ initialMode = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Auth Context & Navigation
  const { login, register, loginWithData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sign In Mode: 'email' | 'phone'
  const [signInMethod, setSignInMethod] = useState('email');

  // Dual Identifier (Email or Phone) State for Password login
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  const [signInPhone, setSignInPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState('phone'); // 'phone' | 'otp'
  const [otpLength, setOtpLength] = useState(4);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [reqId, setReqId] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const digitInputRefs = useRef([]);

  // Pre-load MSG91 script & listen to captcha
  useEffect(() => {
    window.onMsg91CaptchaVerified = (status) => {
      setCaptchaVerified(Boolean(status));
      if (status) setPhoneError('');
    };

    initMsg91().catch(() => {});

    return () => {
      window.onMsg91CaptchaVerified = null;
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupMsg91Captcha();
    };
  }, []);

  // Ensure CAPTCHA renders inside the in-card container whenever Phone tab is active
  useEffect(() => {
    if (signInMethod === 'phone' && phoneStep === 'phone') {
      const timer = setTimeout(() => {
        renderMsg91Captcha('msg91-captcha-container');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [signInMethod, phoneStep]);

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

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  // Destination redirect helper
  const navigateToDestination = () => {
    const nextParam = new URLSearchParams(location.search).get('next');
    navigate(location.state?.from?.pathname || nextParam || '/', { replace: true });
  };

  // Switch to Phone OTP mode seamlessly
  const switchToPhoneOtpWithNumber = (phone) => {
    const digits = (phone || '').replace(/\D/g, '').slice(-10);
    if (digits) {
      setSignInPhone(digits);
    }
    setSignInMethod('phone');
    setSignInError('');
    setPhoneError('');
  };

  // Sign In (Dual Identifier + Password) Handler
  const handleSignInSubmit = async (e) => {
    if (e) e.preventDefault();
    setSignInError('');

    const trimmedIdentifier = signInIdentifier.trim();
    if (!trimmedIdentifier) {
      setSignInError('Please enter your email address or 10-digit mobile number.');
      return;
    }

    const isEmail = trimmedIdentifier.includes('@');
    const digitsOnly = trimmedIdentifier.replace(/\D/g, '');

    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
        setSignInError('Please enter a valid email address.');
        return;
      }
    } else {
      if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
        setSignInError('Please enter a valid 10-digit Indian mobile number or email address.');
        return;
      }
    }

    if (!signInPassword) {
      setSignInError('Please enter your password.');
      return;
    }

    setSignInLoading(true);
    try {
      const result = await login(trimmedIdentifier, signInPassword);
      if (result.success) {
        navigateToDestination();
      } else {
        setSignInError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setSignInError(err.response?.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSignInLoading(false);
    }
  };

  // Send Phone OTP with Direct Backend Fallback
  const handleSendPhoneOtp = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (phoneLoading) return;

    if (!isValidIndianMobile(signInPhone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (typeof window.isCaptchaVerified === 'function' && !window.isCaptchaVerified() && !captchaVerified) {
      setPhoneError('Please complete the security check (I am human) above.');
      return;
    }

    setPhoneError('');
    setPhoneLoading(true);

    const onOtpSentSuccess = (data) => {
      setPhoneLoading(false);
      const extractedReqId =
        data?.reqId ||
        (data && typeof data === 'object' && (data.request_id || data.requestId || data.message)) ||
        (typeof data === 'string' && data.length > 10 ? data : null);
      if (extractedReqId && typeof extractedReqId === 'string' && !extractedReqId.includes(' ')) {
        setReqId(extractedReqId);
      }

      const widgetData = typeof window.getWidgetData === 'function' ? window.getWidgetData() : null;
      const len = Number(widgetData?.otpLength) || (typeof data === 'object' && Number(data?.otpLength)) || 4;
      setOtpLength(len);
      setOtpDigits(new Array(len).fill(''));
      setPhoneStep('otp');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(`OTP sent to +91 ${signInPhone}`);

      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    };

    // Try MSG91 client widget first
    try {
      sendMsg91Otp(
        signInPhone,
        (data) => {
          onOtpSentSuccess(data);
        },
        async (err) => {
          // If client widget fails, use direct backend MSG91 SMS endpoint
          try {
            const serverRes = await api.post('/auth/msg91/send-otp', { phone: signInPhone });
            if (serverRes.data?.success) {
              onOtpSentSuccess(serverRes.data);
            } else {
              setPhoneLoading(false);
              setPhoneError(serverRes.data?.message || (typeof err === 'string' ? err : err?.message) || 'Failed to send OTP.');
            }
          } catch (serverErr) {
            setPhoneLoading(false);
            setPhoneError(serverErr.response?.data?.message || (typeof err === 'string' ? err : err?.message) || 'Failed to send OTP.');
          }
        }
      );
    } catch (unexpected) {
      // Direct server fallback on unexpected widget exception
      try {
        const serverRes = await api.post('/auth/msg91/send-otp', { phone: signInPhone });
        if (serverRes.data?.success) {
          onOtpSentSuccess(serverRes.data);
        } else {
          setPhoneLoading(false);
          setPhoneError(serverRes.data?.message || unexpected?.message || 'Failed to send OTP.');
        }
      } catch (fallbackErr) {
        setPhoneLoading(false);
        setPhoneError(fallbackErr.response?.data?.message || 'Failed to initiate OTP.');
      }
    }
  };

  // Resend Phone OTP with Direct Backend Fallback
  const handleResendPhoneOtp = async () => {
    if (cooldown > 0 || phoneLoading) return;
    setPhoneError('');
    setPhoneLoading(true);

    const onResendSuccess = () => {
      setPhoneLoading(false);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpDigits(new Array(otpLength).fill(''));
      toast.success(`New OTP sent to +91 ${signInPhone}`);
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    };

    try {
      retryMsg91Otp(
        () => {
          onResendSuccess();
        },
        async (err) => {
          // Fallback to server resend
          try {
            const serverRes = await api.post('/auth/msg91/resend-otp', { phone: signInPhone });
            if (serverRes.data?.success) {
              onResendSuccess();
            } else {
              setPhoneLoading(false);
              setPhoneError(serverRes.data?.message || (typeof err === 'string' ? err : err?.message) || 'Failed to resend OTP.');
            }
          } catch (serverErr) {
            setPhoneLoading(false);
            setPhoneError(serverErr.response?.data?.message || (typeof err === 'string' ? err : err?.message) || 'Failed to resend OTP.');
          }
        },
        reqId
      );
    } catch (unexpected) {
      try {
        const serverRes = await api.post('/auth/msg91/resend-otp', { phone: signInPhone });
        if (serverRes.data?.success) {
          onResendSuccess();
        } else {
          setPhoneLoading(false);
          setPhoneError(serverRes.data?.message || unexpected?.message || 'Failed to resend OTP.');
        }
      } catch (fallbackErr) {
        setPhoneLoading(false);
        setPhoneError(fallbackErr.response?.data?.message || 'Failed to resend OTP.');
      }
    }
  };

  // Core OTP Verification with Digits Array & Direct Backend Verification Fallback
  const executeVerifyOtp = (digitsArr) => {
    const entered = (digitsArr || otpDigits).join('');
    if (entered.length !== otpLength) {
      setPhoneError(`Please enter all ${otpLength} digits of your OTP.`);
      return;
    }

    setPhoneError('');
    setPhoneLoading(true);

    // Direct Server Verification Helper
    const verifyDirectlyWithServer = async () => {
      try {
        const backendRes = await api.post('/auth/msg91/verify-otp', {
          phone: signInPhone,
          otp: entered
        });

        if (backendRes.data?.success && backendRes.data?.data) {
          loginWithData(backendRes.data.data);
          cleanupMsg91Captcha();
          navigateToDestination();
        } else {
          setPhoneError(backendRes.data?.message || 'Verification failed on server.');
        }
      } catch (apiErr) {
        setPhoneError(apiErr.response?.data?.message || 'Invalid OTP. Please check the code.');
      } finally {
        setPhoneLoading(false);
      }
    };

    try {
      verifyMsg91Otp(
        entered,
        async (res) => {
          try {
            const accessToken =
              res?.token ||
              res?.access_token ||
              (res && typeof res === 'object' && (res.data?.token || res.data?.access_token)) ||
              (typeof res === 'string' && res.length > 20 ? res : null);

            if (!accessToken) {
              // If no access token in widget callback, verify via server-side direct OTP API
              await verifyDirectlyWithServer();
              return;
            }

            const backendRes = await api.post('/auth/msg91/verify-token', {
              accessToken,
              phone: signInPhone
            });

            if (backendRes.data?.success && backendRes.data?.data) {
              loginWithData(backendRes.data.data);
              cleanupMsg91Captcha();
              navigateToDestination();
            } else {
              // Fallback to server verify-otp endpoint
              await verifyDirectlyWithServer();
            }
          } catch (apiErr) {
            await verifyDirectlyWithServer();
          }
        },
        async (err) => {
          // Widget failed; attempt direct server-side verification with the entered OTP
          console.warn('Widget verification failed, falling back to server verify-otp:', err);
          await verifyDirectlyWithServer();
        },
        reqId
      );
    } catch (err) {
      verifyDirectlyWithServer();
    }
  };

  // Verify Phone OTP Form Submit
  const handleVerifyPhoneOtp = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    executeVerifyOtp(otpDigits);
  };

  // OTP Input Change Handler (Auto-advance & Auto-submit)
  const handleOtpDigitChange = (idx, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[idx] = char;
    setOtpDigits(updated);

    if (char) {
      if (idx < otpLength - 1) {
        digitInputRefs.current[idx + 1]?.focus();
      } else if (idx === otpLength - 1) {
        // If all filled, auto-submit!
        if (updated.every((d) => Boolean(d))) {
          executeVerifyOtp(updated);
        }
      }
    }
  };

  // OTP Paste Handler (Auto-populate & Auto-submit)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength);
    if (!pastedData) return;

    const chars = pastedData.split('');
    const newDigits = new Array(otpLength).fill('');
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setOtpDigits(newDigits);

    const focusIdx = Math.min(chars.length, otpLength - 1);
    digitInputRefs.current[focusIdx]?.focus();

    if (chars.length === otpLength) {
      executeVerifyOtp(newDigits);
    }
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    const cleanName = signUpName.trim();
    if (!cleanName || isPlaceholderName(cleanName)) {
      setSignUpError('Please enter your actual Full Name (e.g. Rahul Sharma).');
      return;
    }

    const cleanEmail = signUpEmail.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setSignUpError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = signUpPhone.replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setSignUpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const passCheck = validatePassword(signUpPassword);
    if (!passCheck.valid) {
      setSignUpError(passCheck.message || PASSWORD_RULE_TEXT);
      return;
    }

    setSignUpLoading(true);
    try {
      const result = await register({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: signUpPassword,
      });

      if (result.success) {
        setSignUpSuccess('Registration successful! You can now sign in.');
        setSignInIdentifier(cleanEmail);
        setTimeout(() => {
          setIsSignUp(false);
          setSignUpSuccess('');
        }, 1500);
      } else {
        setSignUpError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setSignUpError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="auth-switch-root">
      <style>{`
        .auth-switch-root,
        .auth-switch-root * {
          box-sizing: border-box;
        }

        .auth-switch-root {
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 14px;
          background: radial-gradient(circle at 10% 20%, rgba(22, 163, 74, 0.08) 0%, rgba(240, 253, 244, 0.7) 90%);
        }

        .fv-nav-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
          margin-bottom: 14px;
        }

        .fv-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .fv-brand-link:hover {
          transform: translateY(-1px);
        }

        .fv-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 3px 8px rgba(22, 163, 74, 0.3);
        }

        .fv-brand-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #14532d;
          letter-spacing: -0.02em;
        }

        .fv-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.25);
          color: #15803d;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 18px;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          cursor: pointer;
        }

        .fv-back-btn:hover {
          background: #f0fdf4;
          border-color: #16a34a;
          color: #166534;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.15);
        }

        .fv-back-btn:active {
          transform: scale(0.97);
        }

        .fv-auth-container {
          position: relative;
          width: 100%;
          max-width: 1100px;
          min-height: 640px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 25px 65px -15px rgba(22, 101, 52, 0.18), 0 0 0 1px rgba(22, 163, 74, 0.12);
          overflow: hidden;
        }

        .fv-forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .fv-signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 0.9s 0.3s cubic-bezier(0.65, 0, 0.35, 1);
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        .fv-form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 3rem;
          transition: all 0.25s 0.4s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          width: 100%;
        }

        .fv-form.sign-up-form {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .fv-form.sign-in-form {
          z-index: 2;
          pointer-events: all;
        }

        .fv-title {
          font-size: 1.85rem;
          color: #14532d;
          margin-bottom: 4px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .fv-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 16px;
          text-align: center;
        }

        .fv-auth-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 12px;
          margin-bottom: 14px;
          width: 100%;
          max-width: 350px;
          gap: 4px;
        }

        .fv-auth-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 9px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fv-auth-tab:hover {
          color: #15803d;
        }

        .fv-auth-tab.active {
          background: #ffffff;
          color: #15803d;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .fv-input-field {
          width: 100%;
          max-width: 350px;
          background-color: #f8fafc;
          margin: 5px 0;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 0.85rem;
          position: relative;
          transition: all 0.2s ease;
        }

        .fv-input-field:focus-within {
          background-color: #ffffff;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .fv-input-field .fv-icon {
          color: #16a34a;
          margin-right: 10px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .fv-input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 500;
          font-size: 0.9rem;
          color: #0f172a;
          width: 100%;
        }

        .fv-input-field input::placeholder {
          color: #94a3b8;
          font-weight: 400;
          font-size: 0.85rem;
        }

        .fv-toggle-pass {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .fv-toggle-pass:hover {
          color: #15803d;
        }

        .fv-forgot-link {
          align-self: flex-end;
          max-width: 350px;
          width: 100%;
          text-align: right;
          font-size: 0.8rem;
          color: #16a34a;
          text-decoration: none;
          font-weight: 600;
          margin: 4px 0 8px 0;
        }

        .fv-forgot-link:hover {
          text-decoration: underline;
        }

        .fv-btn {
          width: 100%;
          max-width: 350px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          border: none;
          outline: none;
          height: 48px;
          border-radius: 14px;
          color: #ffffff;
          font-weight: 700;
          margin: 12px 0 6px 0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
        }

        .fv-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
        }

        .fv-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .fv-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

        .fv-resend-btn {
          background: #f0fdf4;
          border: 1px solid rgba(22, 163, 74, 0.25);
          color: #15803d;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 6px 14px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fv-resend-btn:hover:not(:disabled) {
          background: #dcfce7;
          border-color: #16a34a;
          transform: translateY(-1px);
        }

        .fv-resend-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fv-edit-badge {
          background: #f0fdf4;
          border: 1px solid rgba(22, 163, 74, 0.2);
          color: #15803d;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .fv-edit-badge:hover {
          background: #dcfce7;
          border-color: #16a34a;
          transform: translateY(-0.5px);
        }

        .fv-panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .fv-panel {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          text-align: left;
          z-index: 6;
          padding: 3rem 16% 3rem 16%;
        }

        .left-panel {
          pointer-events: all;
        }

        .right-panel {
          pointer-events: none;
        }

        .fv-panel .content {
          color: #ffffff;
          transition: transform 0.8s 0.3s cubic-bezier(0.65, 0, 0.35, 1);
        }

        .fv-panel h3 {
          font-weight: 800;
          line-height: 1.2;
          font-size: 1.85rem;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .fv-panel p {
          font-size: 0.925rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.92);
          margin-bottom: 20px;
        }

        .fv-btn.transparent {
          margin: 0;
          background: rgba(255, 255, 255, 0.15);
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(8px);
          width: 155px;
          height: 44px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.875rem;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fv-btn.transparent:hover {
          background: #ffffff;
          color: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .fv-auth-container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .fv-auth-container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .fv-auth-container.sign-up-mode .fv-signin-signup {
          left: 25%;
        }

        .fv-auth-container.sign-up-mode .fv-form.sign-up-form {
          opacity: 1;
          z-index: 2;
          pointer-events: all;
        }

        .fv-auth-container.sign-up-mode .fv-form.sign-in-form {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .fv-auth-container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .fv-auth-container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .fv-auth-container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .fv-auth-container:before {
          content: "";
          position: absolute;
          height: 2200px;
          width: 2200px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #15803d 0%, #16a34a 60%, #4ade80 100%);
          transition: 1.5s cubic-bezier(0.65, 0, 0.35, 1);
          border-radius: 50%;
          z-index: 6;
          box-shadow: 0 0 50px rgba(22, 163, 74, 0.3);
        }

        .fv-error-banner {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-bottom: 10px;
          width: 100%;
          max-width: 350px;
          text-align: center;
        }

        .fv-success-banner {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.8rem;
          margin-bottom: 10px;
          width: 100%;
          max-width: 350px;
          text-align: center;
        }

        .fv-perks-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
        }

        .fv-perks-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.95);
        }

        @media (max-width: 870px) {
          .fv-auth-container {
            min-height: 740px;
            height: auto;
          }
          .fv-signin-signup {
            width: 100%;
            top: 92%;
            transform: translate(-50%, -100%);
            transition: 0.8s 0.3s ease-in-out;
          }
          .fv-signin-signup,
          .fv-auth-container.sign-up-mode .fv-signin-signup {
            left: 50%;
          }
          .fv-panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .fv-panel {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2rem 1.5rem;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .fv-panel .content {
            padding: 0;
            transition: transform 0.8s ease-in-out;
          }
          .fv-panel h3 {
            font-size: 1.35rem;
          }
          .fv-panel p {
            font-size: 0.825rem;
            margin-bottom: 12px;
          }
          .fv-btn.transparent {
            width: 130px;
            height: 38px;
            font-size: 0.8rem;
          }
          .fv-auth-container:before {
            width: 1600px;
            height: 1600px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
          }
          .fv-auth-container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .fv-auth-container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .fv-auth-container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .fv-auth-container.sign-up-mode .fv-signin-signup {
            top: 8%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          .fv-form {
            padding: 0 1rem;
          }
        }
      `}</style>

      {/* ── Sleek Top Navigation Bar ── */}
      <div className="fv-nav-container">
        <Link to="/" className="fv-brand-link">
          <div className="fv-brand-icon">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="fv-brand-title">Fresh Veggies</span>
        </Link>

        <Link to="/" className="fv-back-btn">
          <ArrowLeft className="w-4 h-4" /> Return to Store
        </Link>
      </div>

      <div className={isSignUp ? "fv-auth-container sign-up-mode" : "fv-auth-container"}>
        <div className="fv-forms-container">
          <div className="fv-signin-signup">
            {/* ── SIGN IN FORM ── */}
            <div className="fv-form sign-in-form">
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-6 h-6 text-green-600" />
                <h2 className="fv-title">Welcome Back</h2>
              </div>
              <p className="fv-subtitle">Sign in via Email or instant Mobile OTP</p>

              {/* Login Method Segmented Switcher */}
              <div className="fv-auth-tabs">
                <button
                  type="button"
                  className={`fv-auth-tab ${signInMethod === 'email' ? 'active' : ''}`}
                  onClick={() => { setSignInMethod('email'); setSignInError(''); setPhoneError(''); }}
                >
                  <Mail className="w-3.5 h-3.5" /> Email & Password
                </button>
                <button
                  type="button"
                  className={`fv-auth-tab ${signInMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => { setSignInMethod('phone'); setSignInError(''); setPhoneError(''); }}
                >
                  <Phone className="w-3.5 h-3.5" /> Phone & OTP
                </button>
              </div>

              {/* Error Banners */}
              {signInMethod === 'email' && signInError && (
                <div className="fv-error-banner">{signInError}</div>
              )}
              {signInMethod === 'phone' && phoneError && (
                <div className="fv-error-banner">{phoneError}</div>
              )}

              {/* EMAIL / PHONE & PASSWORD LOGIN */}
              {signInMethod === 'email' && (
                <form onSubmit={handleSignInSubmit} className="w-full flex flex-col items-center">
                  <div className="fv-input-field">
                    <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                    <input
                      type="text"
                      placeholder="Email or 10-digit Phone"
                      required
                      autoComplete="username"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                    />
                  </div>

                  {/* Smart phone detection hint */}
                  {/^[6-9]\d{9}$/.test(signInIdentifier.trim().replace(/\D/g, '')) && !signInIdentifier.includes('@') && (
                    <div className="w-full max-w-[350px] mb-2 px-1 text-left">
                      <button
                        type="button"
                        onClick={() => switchToPhoneOtpWithNumber(signInIdentifier)}
                        className="text-xs text-green-700 hover:text-green-800 font-semibold flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-green-600" />
                        Prefer SMS code? <strong>Sign in via Phone OTP</strong>
                      </button>
                    </div>
                  )}

                  <div className="fv-input-field">
                    <div className="fv-icon"><Lock className="w-4 h-4" /></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      autoComplete="current-password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="fv-toggle-pass"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Link to="/forgot-password" className="fv-forgot-link">
                    Forgot password?
                  </Link>

                  <button type="submit" className="fv-btn" disabled={signInLoading}>
                    {signInLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {/* PHONE & OTP LOGIN */}
              {signInMethod === 'phone' && (
                <div className="w-full flex flex-col items-center">
                  {phoneStep === 'phone' ? (
                    <form onSubmit={handleSendPhoneOtp} className="w-full flex flex-col items-center">
                      <div className="fv-input-field">
                        <div className="fv-icon"><Phone className="w-4 h-4" /></div>
                        <input
                          type="tel"
                          placeholder="10-digit Mobile number"
                          maxLength={10}
                          required
                          autoComplete="tel"
                          value={signInPhone}
                          onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                      </div>

                      {/* In-card CAPTCHA container */}
                      <div className="w-full max-w-[350px] my-1">
                        <div
                          id="msg91-captcha-container"
                          className="min-h-[74px] flex items-center justify-center p-1 rounded-xl bg-gray-50 border border-gray-200 text-xs overflow-x-auto"
                        />
                      </div>

                      <button
                        type="submit"
                        className="fv-btn"
                        disabled={phoneLoading || signInPhone.length !== 10}
                      >
                        {phoneLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                        ) : (
                          <>Send OTP <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyPhoneOtp} className="w-full flex flex-col items-center">
                      <div className="w-full max-w-[350px] flex items-center justify-between px-1 mb-2 text-xs">
                        <span className="text-gray-600 font-medium">
                          OTP sent to <strong>+91 {signInPhone}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => { setPhoneStep('phone'); setPhoneError(''); }}
                          className="fv-edit-badge"
                        >
                          <Edit3 className="w-3 h-3" /> Change Number
                        </button>
                      </div>

                      {/* Digit Boxes with Paste & Auto-submit */}
                      <div className="flex gap-2 justify-center mb-3">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (digitInputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onPaste={handleOtpPaste}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                                digitInputRefs.current[idx - 1]?.focus();
                              }
                            }}
                            className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                          />
                        ))}
                      </div>

                      {/* Resend button / countdown */}
                      <div className="mb-3 text-xs flex justify-center">
                        {cooldown > 0 ? (
                          <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            Resend code in <strong>{cooldown}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendPhoneOtp}
                            disabled={phoneLoading}
                            className="fv-resend-btn"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Resend OTP Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="fv-btn"
                        disabled={phoneLoading || otpDigits.join('').length !== otpLength}
                      >
                        {phoneLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                        ) : (
                          <>Verify & Sign In <CheckCircle2 className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ── SIGN UP FORM ── */}
            <form className="fv-form sign-up-form" onSubmit={handleSignUpSubmit}>
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-6 h-6 text-green-600" />
                <h2 className="fv-title">Create Account</h2>
              </div>
              <p className="fv-subtitle">Start growing premium farm-fresh seeds</p>

              {signUpError && (
                <div className="fv-error-banner">{signUpError}</div>
              )}
              {signUpSuccess && (
                <div className="fv-success-banner">{signUpSuccess}</div>
              )}

              <div className="fv-input-field">
                <div className="fv-icon"><User className="w-4 h-4" /></div>
                <input
                  type="text"
                  placeholder="Your Full Real Name *"
                  required
                  autoComplete="name"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="email"
                  placeholder="Email address *"
                  required
                  autoComplete="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Phone className="w-4 h-4" /></div>
                <input
                  type="tel"
                  placeholder="10-digit Mobile Number *"
                  maxLength={10}
                  required
                  autoComplete="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Lock className="w-4 h-4" /></div>
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 chars, letter + number) *"
                  required
                  autoComplete="new-password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="fv-toggle-pass"
                  aria-label="Toggle password visibility"
                >
                  {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button type="submit" className="fv-btn" disabled={signUpLoading}>
                {signUpLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <Sparkles className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── INTERACTIVE PANELS ── */}
        <div className="fv-panels-container">
          <div className="fv-panel left-panel">
            <div className="content">
              <h3>New here? 🌱</h3>
              <p>
                Join thousands of gardeners growing organic vegetables and fruits right at home.
              </p>
              <ul className="fv-perks-list">
                <li><CheckCircle2 className="w-4 h-4 text-green-300" /> 100% Non-GMO Certified Seeds</li>
                <li><ShieldCheck className="w-4 h-4 text-green-300" /> Free Delivery on orders ₹300+</li>
              </ul>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => {
                  setIsSignUp(true);
                  setSignInError('');
                  setSignUpError('');
                }}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="fv-panel right-panel">
            <div className="content">
              <h3>One of us?</h3>
              <p>Welcome back! Sign in to continue your gardening journey with us.</p>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => {
                  setIsSignUp(false);
                  setSignInError('');
                  setSignUpError('');
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
