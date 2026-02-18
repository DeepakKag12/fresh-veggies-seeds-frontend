import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Phone, Lock } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MobileLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(5);

  // Step 1: Send OTP
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!phone) {
        setError('Please provide your phone number');
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/send-otp', { phone });

      if (response.data.success) {
        setUserId(response.data.userId);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp) {
        setError('Please enter the OTP');
        setLoading(false);
        return;
      }

      if (otp.length !== 6) {
        setError('OTP must be 6 digits');
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/verify-otp', {
        userId,
        otp
      });

      if (response.data.success) {
        // Store token and login user
        localStorage.setItem('token', response.data.data.token);
        login(response.data.data);
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to verify OTP';
      setError(message);
      
      // Extract attempts from error message
      const attemptsMatch = message.match(/(\d+) attempts remaining/);
      if (attemptsMatch) {
        setOtpAttempts(parseInt(attemptsMatch[1]));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Login with Phone
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {step === 1 ? 'Enter your phone number to receive an OTP' : 'Enter the OTP sent to your email'}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Step Progress */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="9876543210"
                  maxLength="10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter 10-digit mobile number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Sending OTP...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl letter-spacing tracking-widest font-mono"
                placeholder="000000"
                maxLength="6"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {otpAttempts > 0 ? (
                  <>
                    {otpAttempts} attempts remaining. OTP expires in 10 minutes.
                  </>
                ) : (
                  'No attempts remaining'
                )}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Verify & Login
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPhone('');
                setOtp('');
                setError('');
              }}
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2 font-semibold"
            >
              Use Different Number
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Prefer email/password?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;
