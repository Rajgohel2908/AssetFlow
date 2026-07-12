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
    const result = await login(email, password);
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
    <div className="app-canvas min-h-screen flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-[2rem] border border-[#e4e4e7] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
        {/* Left panel — branding */}
        <div className="login-panel-art hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-[#fafafa] border-r border-[#f4f4f5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#18181b] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-[#111111]">AssetFlow</span>
              <p className="text-xs text-[#a1a1aa]">Enterprise ERM</p>
            </div>
          </div>

          <div className="max-w-md relative z-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa] mb-4">Minimal asset operations</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#111111] mb-4">
              One quiet interface for every asset.
            </h1>
            <p className="text-sm leading-6 text-[#71717a] max-w-lg">
              Track, allocate, and manage assets with a clean hierarchy, soft contrast, and no visual noise.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg">
              {['Asset Tracking', 'Resource Booking', 'Maintenance', 'Audit Cycles'].map(f => (
                <div key={f} className="rounded-2xl border border-[#d4d4d8] bg-white px-4 py-3 text-sm text-[#3f3f46]">
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#a1a1aa]">© 2024 AssetFlow. Internal use only.</p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#18181b] flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold tracking-tight text-[#111111]">AssetFlow</span>
                <p className="text-xs text-[#a1a1aa]">Enterprise ERM</p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-[1.5rem] border border-[#e4e4e7] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#f4f4f5]">
                {['login', 'signup'].map(t => (
                  <button
                    key={t}
                    className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                      tab === t ? 'text-[#111111] border-b-2 border-[#111111] bg-[#fafafa]' : 'text-[#a1a1aa] hover:text-[#52525b]'
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
                  <p className="text-sm text-[#71717a] mb-6">Sign in to your AssetFlow workspace.</p>

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
                        <button type="button" className="text-xs text-[#52525b] hover:text-[#18181b]">
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#18181b]"
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
                  <div className="mt-6 pt-5 border-t border-[#f4f4f5]">
                    <p className="text-xs text-[#a1a1aa] mb-3 text-center">Quick demo login</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_CREDENTIALS.map(cred => (
                        <button
                          key={cred.email}
                          onClick={() => quickLogin(cred.email)}
                          disabled={loading}
                          className="text-left px-3 py-2 rounded-xl border border-[#e4e4e7] hover:border-[#d4d4d8] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
                        >
                          <p className="text-xs font-medium text-[#18181b]">{cred.label}</p>
                          <p className="text-[10px] text-[#a1a1aa]">{cred.role}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#a1a1aa] mt-2 text-center">All demo passwords: <code className="bg-[#f4f4f5] px-1 rounded">password</code></p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#71717a] mb-2">Create a new AssetFlow account.</p>
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
                  <p className="text-[10px] text-[#a1a1aa] text-center">Account will require admin approval before first login.</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
