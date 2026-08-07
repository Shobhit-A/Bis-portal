import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadCaptcha = useCallback(() => {
    setCaptchaAnswer('');
    api.get('/auth/captcha').then(res => setCaptcha(res.data)).catch(() => setCaptcha(null));
  }, []);

  useEffect(() => { loadCaptcha(); }, [loadCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password, captcha?.token, captchaAnswer);
      toast.success(`Welcome back, ${user.username}`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/portal');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Login failed. Please try again.');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="Absolute Veritas" className="h-12 w-auto object-contain" />
            </div>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">Sign in to your account</h1>
              <p className="text-sm text-gray-500 mt-1">BIS Certification Client Portal</p>
            </div>

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
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="label">Password <span className="required">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Security Check <span className="required">*</span></label>
                <div className="flex gap-2 items-stretch">
                  <div className="input flex-1 bg-gray-50 font-mono text-center select-none">
                    {captcha ? `${captcha.question} = ?` : '...'}
                  </div>
                  <button type="button" onClick={loadCaptcha} title="Get a new question"
                    className="px-3 border border-border rounded text-gray-400 hover:text-primary hover:border-primary transition-colors">
                    <RefreshCw size={15} />
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input mt-2"
                  placeholder="Enter the answer"
                  value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            New client?{' '}
            <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Having trouble? Contact{' '}
            <a href="mailto:info@absoluteveritas.com" className="text-primary hover:underline">
              info@absoluteveritas.com
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-gray-400 border-t border-border">
        © {new Date().getFullYear()} Absolute Veritas · BIS Certification Consultancy · New Delhi, India
      </div>
    </div>
  );
}
