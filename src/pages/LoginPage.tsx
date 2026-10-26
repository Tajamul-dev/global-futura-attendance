import React, { useState, useEffect } from 'react';
import { loginWithSync, getEmployees, syncFromServer } from '../store';
import { Employee } from '../types';
import { LogIn, Shield, Users, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

interface LoginPageProps {
  onLogin: (user: Employee) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    const employees = getEmployees();
    setHasAccounts(employees.length > 0);
    void syncFromServer().then(() => {
      setHasAccounts(getEmployees().length > 0);
    });
  }, []);

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setIsLoading(true);
    setError('');
    try {
      const user = await loginWithSync(targetEmail, targetPass);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password. Check spelling or tap a demo account below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLogin(email, password);
  };

  const quickLoginDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    void performLogin(demoEmail, demoPass);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-block mb-4">
            <Logo size="lg" className="drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">Employee Attendance Portal</h1>
          <p className="text-blue-200/70 mt-1.5 text-sm">Track time, manage breaks, stay productive</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-blue-200/70 hover:text-white rounded-lg cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[46px] py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {hasAccounts && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-xs text-blue-200/60 text-center mb-3">One-Tap Demo Sign In</p>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => quickLoginDemo('admin@globalfutura.com', 'admin123')}
                  className="w-full min-h-[44px] flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span className="text-xs text-blue-100 truncate">admin@globalfutura.com / admin123</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-300 shrink-0">Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginDemo('john@globalfutura.com', 'emp123')}
                  className="w-full min-h-[44px] flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-xs text-blue-100 truncate">john@globalfutura.com / emp123</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-300 shrink-0">Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 text-center">
          <div className="flex justify-center mb-2">
            <Logo size="sm" className="opacity-75" />
          </div>
          <p className="text-blue-200/40 text-xs">
            © {new Date().getFullYear()} Global Futura INC. All rights reserved.
          </p>
          <p className="text-blue-200/30 text-xs mt-1">Pure Quality · Global Reach · Jericho, New York</p>
        </div>
      </div>
    </div>
  );
}
