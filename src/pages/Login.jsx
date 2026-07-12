import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

const DEMO_CREDENTIALS = [
  { label: 'Admin',         email: 'admin@assetflow.io',   role: 'Full access' },
  { label: 'Asset Manager', email: 'manager@assetflow.io', role: 'Assets, reports, audit' },
  { label: 'Dept Head',     email: 'head@assetflow.io',    role: 'Dept-scoped views' },
  { label: 'Employee',      email: 'user@assetflow.io',    role: 'Own allocations only' },
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('login'); // 'login' | 'signup'

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const result = login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  const quickLogin = async (em) => {
    setEmail(em);
    setPassword('password');
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(em, 'password');
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">AssetFlow</span>
            <p className="text-xs text-white/50">Enterprise ERM</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Every asset.<br />One system.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md">
            Track, allocate, and manage your organization's assets with precision.
            Full audit trails, role-based access, and real-time visibility — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Asset Tracking', 'Resource Booking', 'Maintenance', 'Audit Cycles', 'Analytics', 'Role-based Access'].map(f => (
              <span key={f} className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70">{f}</span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">© 2024 AssetFlow. Internal use only.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {['login', 'signup'].map(t => (
                <button
                  key={t}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                    tab === t ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => { setTab(t); setError(''); }}
                >
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <div className="p-8">
              {tab === 'login' ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">Sign in to your AssetFlow workspace.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="form-label" htmlFor="email">Email address</label>
                      <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="you@assetflow.io"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label mb-0" htmlFor="password">Password</label>
                        <button type="button" className="text-xs text-primary-600 hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPw ? 'text' : 'password'}
                          className="form-input pr-10"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {error && <p className="form-error text-sm">{error}</p>}

                    <button
                      id="login-btn"
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full justify-center py-2.5"
                    >
                      {loading ? 'Signing in…' : 'Sign In'}
                      {!loading && <ArrowRight size={15} />}
                    </button>
                  </form>

                  {/* Demo shortcuts */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3 text-center">Quick demo login</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_CREDENTIALS.map(cred => (
                        <button
                          key={cred.email}
                          onClick={() => quickLogin(cred.email)}
                          className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <p className="text-xs font-semibold text-gray-700">{cred.label}</p>
                          <p className="text-[10px] text-gray-400">{cred.role}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">All demo passwords: <code className="bg-gray-100 px-1 rounded">password</code></p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">Create a new AssetFlow account.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">First name</label>
                      <input className="form-input" placeholder="Jane" />
                    </div>
                    <div>
                      <label className="form-label">Last name</label>
                      <input className="form-input" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Work email</label>
                    <input className="form-input" type="email" placeholder="jane@company.io" />
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <select className="form-select">
                      <option value="">Select department…</option>
                      {['Engineering', 'Operations', 'Finance', 'HR', 'Marketing', 'IT Infrastructure'].map(d => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="Min. 8 characters" />
                  </div>
                  <button className="btn-primary w-full justify-center py-2.5 mt-2">
                    Create Account
                    <ArrowRight size={15} />
                  </button>
                  <p className="text-[10px] text-gray-400 text-center">Account will require admin approval before first login.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
