import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      const res = await api.post('/auth/register', {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        captchaToken: captcha?.token,
        captchaAnswer
      });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">AV</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">ABSOLUTE VERITAS</span>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">Create an account</h1>
              <p className="text-sm text-gray-500 mt-1">BIS Certification Client Portal</p>
            </div>

            {success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                {success}
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
                      placeholder="Choose a username"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      autoComplete="username"
                      autoFocus
                      minLength={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email <span className="required">*</span></label>
                    <input
                      type="email"
                      className="input"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      autoComplete="email"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">We'll email you once your account is approved.</p>
                  </div>
                  <div>
                    <label className="label">Password <span className="required">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Set a password"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        autoComplete="new-password"
                        minLength={6}
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
                    {loading ? 'Submitting...' : 'Register'}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
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
