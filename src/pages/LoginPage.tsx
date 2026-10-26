import React, { useState, useEffect } from 'react';
import { login, getEmployees } from '../store';
import { Employee } from '../types';
import { LogIn, Shield, Users } from 'lucide-react';
import Logo from '../components/Logo';

interface LoginPageProps {
  onLogin: (user: Employee) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    const employees = getEmployees();
    setHasAccounts(employees.length > 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 300);
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
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

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
              <p className="text-xs text-blue-200/60 text-center mb-3">Quick Fill Demo Credentials</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@globalfutura.com', 'admin123')}
                  className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg p-2.5 text-left transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-xs text-blue-100 truncate">Admin: admin@globalfutura.com / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('john@globalfutura.com', 'emp123')}
                  className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg p-2.5 text-left transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-xs text-blue-100 truncate">Employee: john@globalfutura.com / emp123</span>
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
