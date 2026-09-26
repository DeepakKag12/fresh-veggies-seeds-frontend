import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Sprout, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, PASSWORD_RULE_TEXT } from '../../utils/passwordPolicy';
import GuestMobileOtpStep from '../checkout/GuestMobileOtpStep';
import './auth-switch.css';

/* ─── Real Customer Name Check ─────────────────────────────────────────── */
const isPlaceholderName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  return /^customer(\s*\d+)?$/i.test(trimmed);
};

export default function AuthSwitch({ initialMode = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Sync mode whenever initialMode route prop changes
  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  // Auth Context & Navigation
  const { login, register } = useAuth();
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
        {/* ── Mobile Botanical Hero Header (Visible on mobile/tablet <= 870px) ── */}
        <div className="fv-mobile-header">
          <div className="fv-mobile-header-badge">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <h2 className="fv-mobile-header-title">Fresh Veggies</h2>
          <p className="fv-mobile-header-sub">
            {!isSignUp
              ? 'Welcome back! Sign in to grow fresh at home.'
              : 'Create your account to start growing today.'}
          </p>
          <div className="fv-mobile-mode-switcher">
            <button
              type="button"
              className={`fv-mobile-mode-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => {
                setIsSignUp(false);
                setSignInError('');
                setSignUpError('');
                window.history.replaceState(null, '', '/login');
              }}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              className={`fv-mobile-mode-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => {
                setIsSignUp(true);
                setSignInError('');
                setSignUpError('');
                window.history.replaceState(null, '', '/register');
              }}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        </div>

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
                  onClick={() => { setSignInMethod('email'); setSignInError(''); }}
                >
                  <Mail className="w-3.5 h-3.5" /> Email & Password
                </button>
                <button
                  type="button"
                  className={`fv-auth-tab ${signInMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => { setSignInMethod('phone'); setSignInError(''); }}
                >
                  <Phone className="w-3.5 h-3.5" /> Phone & OTP
                </button>
              </div>

              {/* Error Banners */}
              {signInMethod === 'email' && signInError && (
                <div className="fv-error-banner">{signInError}</div>
              )}

              {/* EMAIL / PHONE & PASSWORD LOGIN */}
              {signInMethod === 'email' && (
                <form onSubmit={handleSignInSubmit} className="w-full flex flex-col items-center">
                  <div className="fv-input-field">
                    <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                    <input
                      type="text"
                      placeholder="Email or 10-digit Phone"
                      required={signInMethod === 'email'}
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
                        <Phone className="w-3.5 h-3.5 text-green-600" />
                        Prefer SMS code? <strong>Sign in via Phone OTP</strong>
                      </button>
                    </div>
                  )}

                  <div className="fv-input-field">
                    <div className="fv-icon"><Lock className="w-4 h-4" /></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required={signInMethod === 'email'}
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

                  <div className="fv-forgot-link-wrapper">
                    <Link to="/forgot-password" className="fv-forgot-link">
                      Forgot password?
                    </Link>
                  </div>

                  <button type="submit" className="fv-btn shimmer-btn" disabled={signInLoading}>
                    {signInLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  {/* Mobile Quick Switcher Link */}
                  <div className="fv-mobile-bottom-prompt">
                    <span>New to Fresh Veggies? </span>
                    <button
                      type="button"
                      className="fv-inline-switch-btn"
                      onClick={() => {
                        setIsSignUp(true);
                        setSignInError('');
                        setSignUpError('');
                        window.history.replaceState(null, '', '/register');
                      }}
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              )}

              {/* PHONE & OTP LOGIN */}
              {signInMethod === 'phone' && (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full max-w-[360px] my-1">
                    <GuestMobileOtpStep
                      initialPhone={signInPhone}
                      onVerified={() => navigateToDestination()}
                    />
                  </div>
                  {/* Mobile Quick Switcher Link */}
                  <div className="fv-mobile-bottom-prompt mt-2">
                    <span>New to Fresh Veggies? </span>
                    <button
                      type="button"
                      className="fv-inline-switch-btn"
                      onClick={() => {
                        setIsSignUp(true);
                        setSignInError('');
                        setSignUpError('');
                        window.history.replaceState(null, '', '/register');
                      }}
                    >
                      Create an account
                    </button>
                  </div>
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

              <button type="submit" className="fv-btn shimmer-btn" disabled={signUpLoading}>
                {signUpLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Mobile Quick Switcher Link */}
              <div className="fv-mobile-bottom-prompt">
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="fv-inline-switch-btn"
                  onClick={() => {
                    setIsSignUp(false);
                    setSignInError('');
                    setSignUpError('');
                    window.history.replaceState(null, '', '/login');
                  }}
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── INTERACTIVE PANELS (Desktop) ── */}
        <div className="fv-panels-container">
          <div className="fv-panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>
                Join thousands of gardeners growing organic vegetables and fruits right at home.
              </p>
              <ul className="fv-perks-list">
                <li><CheckCircle2 className="w-4 h-4 text-green-300" /> 100% Non-GMO Certified Seeds</li>
                <li><ShieldCheck className="w-4 h-4 text-green-300" /> Free Delivery on orders ₹300+</li>
                <li><Sprout className="w-4 h-4 text-green-300" /> Organic & Chemical-Free Varieties</li>
              </ul>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => {
                  setIsSignUp(true);
                  setSignInError('');
                  setSignUpError('');
                  window.history.replaceState(null, '', '/register');
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
              <ul className="fv-perks-list">
                <li><CheckCircle2 className="w-4 h-4 text-green-300" /> Track your seed deliveries live</li>
                <li><ShieldCheck className="w-4 h-4 text-green-300" /> Fast SMS OTP & password login</li>
              </ul>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => {
                  setIsSignUp(false);
                  setSignInError('');
                  setSignUpError('');
                  window.history.replaceState(null, '', '/login');
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
