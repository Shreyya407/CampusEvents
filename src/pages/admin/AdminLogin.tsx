import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ConfigWarning } from '../../components/common/ConfigWarning';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);

      if (data.user) {
        // Verify role is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileData?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Access denied. Your account does not have Admin privileges.');
        }

        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans text-on-primary">
      <ConfigWarning />

      <main className="relative z-10 w-full max-w-[440px] px-margin-mobile md:px-0 py-8">
        <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant p-stack-lg w-full flex flex-col items-center text-on-surface">
          {/* Header */}
          <div className="flex flex-col items-center mb-stack-lg w-full">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-stack-md border border-outline-variant/30">
              <span className="material-symbols-outlined text-[36px]">admin_panel_settings</span>
            </div>
            <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight text-center">
              CampusEvents Admin
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-stack-sm text-center">
              University Management Portal
            </p>
          </div>

          {error && (
            <div className="w-full mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-stack-md">
            <div className="flex flex-col gap-base">
              <label className="text-label-md font-label-md text-on-surface" htmlFor="adminEmail">
                Admin Email
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@college.edu"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-base">
              <label className="text-label-md font-label-md text-on-surface" htmlFor="adminPassword">
                Password
              </label>
              <input
                id="adminPassword"
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
              className="w-full mt-stack-md bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-stack-sm shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Access Admin Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">security</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-stack-lg pt-stack-md border-t border-outline-variant/40 w-full text-center">
            <Link to="/login" className="text-label-sm text-secondary hover:underline">
              Switch to Student Portal Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
