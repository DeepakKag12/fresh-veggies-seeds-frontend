import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Sprout, CheckCircle2, ShieldCheck, Sparkles, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, PASSWORD_RULE_TEXT } from '../../utils/passwordPolicy';

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

  // Auth Context & Navigation
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  // Sign In Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setSignInError('');

    if (!signInEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail.trim())) {
      setSignInError('Please enter a valid email address.');
      return;
    }
    if (!signInPassword) {
      setSignInError('Please enter your password.');
      return;
    }

    setSignInLoading(true);
    try {
      const result = await login(signInEmail.trim(), signInPassword);
      if (result.success) {
        const nextParam = new URLSearchParams(location.search).get('next');
        navigate(location.state?.from?.pathname || nextParam || '/', { replace: true });
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
        setSignInEmail(cleanEmail);
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
          padding: 24px 16px;
          background: radial-gradient(circle at 10% 20%, rgba(22, 163, 74, 0.08) 0%, rgba(240, 253, 244, 0.6) 90%);
        }

        .fv-nav-container {
          width: 100%;
          max-width: 960px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .fv-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.2);
          color: #15803d;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 16px;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }

        .fv-back-btn:hover {
          background: #f0fdf4;
          border-color: #16a34a;
          transform: translateY(-1px);
        }

        .fv-auth-container {
          position: relative;
          width: 100%;
          max-width: 960px;
          min-height: 590px;
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
          height: 46px;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          margin: 12px 0 6px 0;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 0.925rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
        }

        .fv-btn:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.45);
        }

        .fv-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
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
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          width: 150px;
          height: 42px;
          border-radius: 12px;
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

      {/* ── Top Navigation Bar ── */}
      <div className="fv-nav-container">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="fv-back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>

        <Link to="/" className="fv-back-btn">
          Continue shopping
        </Link>
      </div>

      <div className={isSignUp ? "fv-auth-container sign-up-mode" : "fv-auth-container"}>
        <div className="fv-forms-container">
          <div className="fv-signin-signup">
            {/* ── SIGN IN FORM ── */}
            <form className="fv-form sign-in-form" onSubmit={handleSignInSubmit}>
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-6 h-6 text-green-600" />
                <h2 className="fv-title">Welcome Back</h2>
              </div>
              <p className="fv-subtitle">Sign in to manage your orders & seeds</p>

              {signInError && (
                <div className="fv-error-banner">{signInError}</div>
              )}

              <div className="fv-input-field">
                <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </div>

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
