import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ConfigWarning } from '../../components/common/ConfigWarning';

export const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        // Fetch role to route accordingly
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileData?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/events');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans text-on-surface">
      <ConfigWarning />

      {/* Atmospheric Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container-high opacity-80 z-10"></div>
        <div
          className="absolute inset-0 bg-cover bg-center z-0 mix-blend-overlay opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80')",
          }}
        ></div>
      </div>

      {/* Login Card Container */}
      <main className="relative z-10 w-full max-w-[440px] px-margin-mobile md:px-0 py-8">
        <div className="bg-surface rounded-2xl shadow-ambient border border-outline-variant p-stack-lg w-full flex flex-col items-center">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-stack-lg w-full">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-stack-md border border-outline-variant/30 text-secondary">
              <span className="material-symbols-outlined text-[36px]">school</span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight text-center">
              CampusEvents
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-stack-sm text-center">
              Student Authentication Portal
            </p>
          </div>

          {error && (
            <div className="w-full mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-stack-md">
            <div className="flex flex-col gap-base">
              <label className="text-label-md font-label-md text-on-surface" htmlFor="studentEmail">
                Student Email
              </label>
              <input
                id="studentEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-base">
              <label className="text-label-md font-label-md text-on-surface" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-stack-md bg-secondary text-on-secondary py-3 rounded-lg font-label-md text-label-md hover:bg-on-secondary-fixed-variant transition-colors flex items-center justify-center gap-stack-sm shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Link */}
          <div className="mt-stack-md border-t border-outline-variant/40 pt-stack-md w-full text-center">
            <Link
              to="/admin/login"
              className="text-label-sm font-label-sm text-on-surface-variant hover:text-secondary flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Are you an Administrator? Click here to Login</span>
            </Link>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-stack-lg text-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            New student?{' '}
            <Link
              to="/signup"
              className="font-label-md text-label-md text-secondary hover:text-on-secondary-fixed-variant transition-colors underline-offset-4 hover:underline ml-1"
            >
              Register here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};
