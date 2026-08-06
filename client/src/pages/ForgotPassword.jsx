import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { username: username.trim() });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-primary px-6 py-4 flex items-center gap-3">
        <div className="bg-white rounded px-2 py-1.5 flex items-center">
          <img src="/logo.png" alt="Absolute Veritas" className="h-6 w-auto object-contain" />
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">ABSOLUTE VERITAS FORM SUBMISSION</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your username and we'll email you a reset link.</p>
            </div>

            {message ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                {message}
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Username <span className="required">*</span></label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                      autoFocus
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-gray-400 border-t border-border">
        © {new Date().getFullYear()} Absolute Veritas · BIS Certification Consultancy · New Delhi, India
      </div>
    </div>
  );
}
