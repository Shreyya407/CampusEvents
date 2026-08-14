import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ConfigWarning } from '../../components/common/ConfigWarning';

export const StudentSignup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions to register.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Execute Supabase auth signup with student metadata
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            register_number: registerNumber,
            department: department || 'Computer Science',
            year: year || '1',
            role: 'student', // ALWAYS STUDENT FOR PUBLIC SIGNUP!
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        navigate('/events');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-gutter relative overflow-hidden bg-background">
      <ConfigWarning />

      {/* Atmospheric Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-fixed blur-[120px] opacity-40"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-surface-container-high blur-[140px] opacity-60"></div>
      </div>

      {/* Registration Container */}
      <main className="w-full max-w-[1000px] mx-auto z-10 flex shadow-2xl rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/30 relative my-8">
        {/* Left Panel: Branding & Imagery */}
        <div className="hidden lg:flex w-5/12 bg-primary relative flex-col justify-between p-stack-lg overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
              alt="Campus event"
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-stack-lg text-on-primary">
              <span className="material-symbols-outlined text-[32px]">event_available</span>
              <span className="text-title-lg font-title-lg tracking-tight">CampusEvents</span>
            </div>
            <h1 className="text-display-lg font-display-lg text-on-primary mt-12 leading-tight">
              Join the
              <br />
              Experience.
            </h1>
            <p className="text-body-lg font-body-lg text-primary-fixed mt-stack-md max-w-sm">
              Create your student account to discover, register for, and check into exclusive campus workshops and events.
            </p>
          </div>
          <div className="relative z-10 mt-auto pt-12">
            <p className="text-label-sm font-label-sm text-primary-fixed">
              Official University Event Registration Platform
            </p>
          </div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="w-full lg:w-7/12 p-margin-mobile md:p-margin-desktop bg-surface-container-lowest">
          <div className="mb-stack-lg">
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Student Registration</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              Please enter your details to create an official student profile.
            </p>
          </div>

          {error && (
            <div className="mb-stack-md p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-stack-md">
            {/* Personal Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="registerNumber">
                  Register / Roll Number
                </label>
                <input
                  id="registerNumber"
                  type="text"
                  required
                  placeholder="e.g. 2024CS105"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="email">
                College Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="e.g. jane.doe@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
              />
            </div>

            {/* Academic Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                >
                  <option value="" disabled>Select Department</option>
                  <option value="Computer Science">Computer Science & IT</option>
                  <option value="Engineering">Electronics & Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Business Administration">Business & Management</option>
                  <option value="Arts & Humanities">Arts & Humanities</option>
                  <option value="Biotechnology">Biotechnology & Life Sciences</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="year">
                  Year of Study
                </label>
                <select
                  id="year"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                >
                  <option value="" disabled>Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-stack-md pt-stack-sm border-t border-outline-variant/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div>
                  <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-label-md font-label-md text-on-surface-variant mb-1" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded bg-surface border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Actions */}
            <div className="pt-stack-md">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                />
                <span className="text-body-sm font-body-sm text-on-surface-variant">
                  I agree to the college <span className="text-secondary font-medium">Terms of Registration</span> and privacy policy.
                </span>
              </label>
            </div>

            <div className="pt-stack-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                Already registered?{' '}
                <Link to="/login" className="text-secondary font-medium hover:underline">
                  Log in
                </Link>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-secondary text-on-secondary rounded text-label-md font-label-md hover:bg-on-secondary-fixed-variant transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
