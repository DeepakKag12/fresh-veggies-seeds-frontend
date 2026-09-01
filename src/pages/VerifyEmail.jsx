import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) return;
    requestStarted.current = true;
    api.get(`/auth/verify-email/${token}`)
      .then((response) => {
        setStatus('success');
        setMessage(response.data.message);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'This verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md text-center bg-white rounded-xl shadow-sm p-8">
        {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 text-green-600 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />}
        {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-red-600" />}
        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          {status === 'loading' ? 'Verifying email' : status === 'success' ? 'Email verified' : 'Verification failed'}
        </h1>
        <p className="mt-3 text-gray-600">{message}</p>
        {status !== 'loading' && (
          <Link to="/login" className="inline-block mt-6 px-5 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">
            Continue to login
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;