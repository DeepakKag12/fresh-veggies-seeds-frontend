import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sprout } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import PasswordInput from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice] = useState(location.state?.message || '');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Destination can arrive as router state (PrivateRoute) or as ?next=
        // (a session that expired on a protected page).
        const nextParam = new URLSearchParams(location.search).get('next');
        navigate(location.state?.from?.pathname || nextParam || '/', { replace: true });
      } else {
        setGlobalError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fv-page px-4 py-10 sm:px-6 lg:px-10">
      {/* Auth pages hide the site chrome, so without this there is no way back
          to the store — people who reached sign-in from checkout were stranded. */}
      <div className="mx-auto mb-4 max-w-[1100px]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Two ways out: back to wherever they came from, or into the store. */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-[50px] px-3 py-2 text-[14px] font-medium
                       text-fv-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-fv-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[50px] px-3 py-2 text-[14px] font-medium
                       text-fv-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-fv-primary"
          >
            Continue shopping
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1100px] overflow-hidden rounded-[18px] shadow-[0_18px_50px_rgba(10,76,54,0.10)]">
      {/* Left Side - Form */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-white dark:bg-gray-900"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <img 
              src="/logo.png" 
              alt="Fresh Veggies" 
              className="h-20 w-auto object-contain"
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-[34px] font-semibold mb-3 text-fv-heading">Welcome Back!</h1>
            <p className="text-fv-muted text-[16px]">
              Sign in to continue your organic journey
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {notice && (
              <div className="p-4 bg-fv-cream border border-fv-border rounded-lg text-fv-success text-sm">
                {notice}
              </div>
            )}
            {globalError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                {globalError}
              </motion.div>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your.email@example.com"
              required
            />

            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-fv-primary focus:ring-fv-primary"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-fv-primary hover:text-fv-primary-dark font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-fv-primary hover:bg-fv-primary-dark shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-fv-primary hover:text-fv-primary-dark font-semibold"
              >
                Create one now
              </Link>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or
                </span>
              </div>
            </div>

            <Link
              to="/mobile-login"
              className="w-full h-12 flex items-center justify-center px-4 border-2 border-fv-primary text-fv-primary hover:bg-fv-cream dark:hover:bg-green-950/30 rounded-full font-bold transition-all active:scale-[0.98] cursor-pointer shadow-2xs text-sm"
            >
              Login with Phone Number
            </Link>
          </motion.form>
        </div>
      </motion.div>

      {/* Right Side - Illustration */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="hidden lg:flex flex-1 bg-fv-primary items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 text-white text-center max-w-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-6">
              <Sprout className="w-20 h-20" />
            </div>
            <h2 className="font-serif text-[34px] font-semibold mb-4">
              Grow Your Own Fresh Vegetables
            </h2>
            <p className="text-xl text-white/80 leading-relaxed">
              Access premium organic seeds and start your journey to healthier, sustainable living
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-8 text-sm"
          >
            {/* These replace invented figures ("5000+ Happy Customers",
                "100+ Products") with claims the backend actually honours. */}
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">Free</div>
              <div className="text-white/80">Delivery over ₹300</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">COD</div>
              <div className="text-white/80">Pay on delivery</div>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">Tracked</div>
              <div className="text-white/80">On every order</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
