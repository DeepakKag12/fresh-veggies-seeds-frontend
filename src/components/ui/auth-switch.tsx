"use client";

import React, { useState, type FormEvent } from "react";
import { Mail, Lock, User, Phone, ArrowRight, Sprout, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface AuthSwitchProps {
  initialMode?: 'signin' | 'signup';
  onSignIn?: (data: { email: string; password: string }) => void;
  onSignUp?: (data: { name: string; email: string; phone: string; password: string }) => void;
  loading?: boolean;
  error?: string;
}

export default function AuthSwitch({
  initialMode = 'signin',
  onSignIn,
  onSignUp,
  loading = false,
  error = ''
}: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleSignInSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSignIn) {
      onSignIn({ email: signInEmail, password: signInPassword });
    }
  };

  const handleSignUpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSignUp) {
      onSignUp({
        name: signUpName,
        email: signUpEmail,
        phone: signUpPhone,
        password: signUpPassword
      });
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
          justify-content: center;
          align-items: center;
          padding: 16px;
          background: radial-gradient(circle at 10% 20%, rgba(22, 163, 74, 0.08) 0%, rgba(240, 253, 244, 0.6) 90%);
        }

        .fv-auth-container {
          position: relative;
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 60px -15px rgba(22, 101, 52, 0.15), 0 0 0 1px rgba(22, 163, 74, 0.12);
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
          padding: 0 3.5rem;
          transition: all 0.25s 0.4s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
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
          font-size: 2rem;
          color: #14532d;
          margin-bottom: 6px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .fv-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 20px;
        }

        .fv-input-field {
          max-width: 360px;
          width: 100%;
          background-color: #f8fafc;
          margin: 6px 0;
          height: 50px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 1rem;
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
          margin-right: 12px;
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
          font-size: 0.925rem;
          color: #0f172a;
          width: 100%;
        }

        .fv-input-field input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .fv-btn {
          width: 100%;
          max-width: 360px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          border: none;
          outline: none;
          height: 48px;
          border-radius: 14px;
          color: #ffffff;
          font-weight: 700;
          margin: 16px 0 8px 0;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 0.95rem;
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
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 24px;
        }

        .fv-btn.transparent {
          margin: 0;
          background: rgba(255, 255, 255, 0.15);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          width: 160px;
          height: 44px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.25s ease;
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
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.825rem;
          margin-bottom: 12px;
          width: 100%;
          max-width: 360px;
          text-align: center;
        }

        .fv-perks-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
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
            min-height: 720px;
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
            margin-bottom: 14px;
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
            padding: 0 1.25rem;
          }
        }
      `}</style>

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

              {error && !isSignUp && (
                <div className="fv-error-banner">{error}</div>
              )}

              <div className="fv-input-field">
                <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Lock className="w-4 h-4" /></div>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="fv-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* ── SIGN UP FORM ── */}
            <form className="fv-form sign-up-form" onSubmit={handleSignUpSubmit}>
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-6 h-6 text-green-600" />
                <h2 className="fv-title">Join Fresh Veggies</h2>
              </div>
              <p className="fv-subtitle">Start growing premium farm-fresh seeds</p>

              {error && isSignUp && (
                <div className="fv-error-banner">{error}</div>
              )}

              <div className="fv-input-field">
                <div className="fv-icon"><User className="w-4 h-4" /></div>
                <input
                  type="text"
                  placeholder="Your Full Real Name"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Mail className="w-4 h-4" /></div>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Phone className="w-4 h-4" /></div>
                <input
                  type="tel"
                  placeholder="10-digit Mobile Number"
                  maxLength={10}
                  required
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>

              <div className="fv-input-field">
                <div className="fv-icon"><Lock className="w-4 h-4" /></div>
                <input
                  type="password"
                  placeholder="Create strong password (min 8 chars)"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="fv-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'} <Sparkles className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ── INTERACTIVE PANELS ── */}
        <div className="fv-panels-container">
          <div className="fv-panel left-panel">
            <div className="content">
              <h3>New to Fresh Veggies?</h3>
              <p>
                Get access to heirloom seeds, exclusive discounts, order tracking, and fast doorstep delivery.
              </p>
              <ul className="fv-perks-list">
                <li><CheckCircle2 className="w-4 h-4 text-green-300" /> 100% Organic & Non-GMO Seeds</li>
                <li><ShieldCheck className="w-4 h-4 text-green-300" /> Free Delivery on orders ₹300+</li>
              </ul>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => setIsSignUp(true)}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="fv-panel right-panel">
            <div className="content">
              <h3>Already have an account?</h3>
              <p>Sign in to access your saved garden wishlist, addresses, and track your active seed shipments.</p>
              <button
                type="button"
                className="fv-btn transparent"
                onClick={() => setIsSignUp(false)}
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
