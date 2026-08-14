import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { StudentNavbar } from '../../components/layout/StudentNavbar';
import { useAuth } from '../../context/AuthContext';

export const StudentProfile: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [year, setYear] = useState(profile?.year || '1');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          department,
          year,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-on-background">
      <StudentNavbar />

      <main className="flex-grow max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg pt-20 md:pt-24 pb-32 md:pb-stack-lg flex flex-col items-center">
        <div className="w-full max-w-2xl bg-surface rounded-2xl border border-outline-variant p-stack-md md:p-stack-lg shadow-sm">
          <div className="flex items-center gap-4 mb-stack-lg pb-stack-md border-b border-outline-variant">
            <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-headline-md font-bold shadow-sm">
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-headline-md font-headline-md text-primary">{profile?.full_name}</h1>
              <p className="text-body-sm text-on-surface-variant">
                {profile?.email} • Role: <span className="font-semibold uppercase">{profile?.role}</span>
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-stack-md p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-stack-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Register Number
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.register_number || ''}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface-variant cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
                  Year of Study
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div className="pt-stack-md flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-secondary text-on-secondary rounded-lg font-label-md font-semibold hover:bg-on-secondary-fixed-variant transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
